#!/usr/bin/env python3
"""Fusionne une mise a jour de dependance proposee par Dependabot, sous conditions.

Pourquoi ce script existe : le proprietaire du site ne code pas. Sans fusion
automatique, les correctifs de securite s'empilent en propositions que personne
n'ouvre, ce qui est exactement ce qui s'est passe ici, avec seize propositions en
attente et huit vulnerabilites connues.

Ce qui est fusionne automatiquement : les corrections et les montees mineures,
et seulement si toute la verification est passee au vert (analyse, types, tests,
compilation).

Ce qui ne l'est jamais : les montees de version MAJEURE, et les montees
mineures d'un paquet encore en 0.x (0.10 vers 0.12), qui sont des ruptures en
versionnage semantique. Elles changent le comportement d'une bibliotheque et
peuvent casser le site sans qu'aucun test ne le voie. Elles restent ouvertes,
etiquetees, et attendent une decision humaine. Une proposition dont aucune
version n'est lisible est refusee de la meme facon : dans le doute, un humain.
"""
import json
import os
import re
import subprocess
import sys
import time

DEPOT = os.environ.get("DEPOT", "Lerouks/NigerFin")
# Les deux formes que Dependabot ecrit : « Bumps [paquet](lien) from A to B. »
# pour une mise a jour seule, « Updates `paquet` from A to B » pour un groupe.
# Les versions peuvent n'avoir qu'un chiffre (actions GitHub : « from 6 to 7 »).
PAIRE = re.compile(
    r"(?:\bbumps?\s+\[?(?P<p1>[^\s\]\[]+?)\]?(?:\([^)]*\))?|\bupdates?\s+`(?P<p2>[^`]+)`)"
    r"\s+from\s+v?(?P<av>\d+(?:\.\d+)*)\S*?\s+to\s+v?(?P<ap>\d+(?:\.\d+)*)",
    re.IGNORECASE,
)
# Ligne du tableau qu'ecrit Dependabot pour un groupe :
# « | [paquet](lien) | `1.2.3` | `2.0.0` | ».
LIGNE_TABLEAU = re.compile(
    r"^\|\s*\[(?P<p>[^\]]+)\]\([^)]*\)\s*\|\s*`v?(?P<av>\d+(?:\.\d+)*)[^`]*`\s*\|\s*`v?(?P<ap>\d+(?:\.\d+)*)[^`]*`\s*\|",
    re.MULTILINE,
)
# « ... group with 12 updates » : le nombre de paquets que la proposition change.
ANNONCE = re.compile(r"\bwith\s+(\d+)\s+updates?\b", re.IGNORECASE)
# Identifiant complet d'un commit, tel que GitHub le transmet.
SHA_COMPLET = re.compile(r"[0-9a-f]{40}")


def gh(*args, json_sortie=True):
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr.strip(), file=sys.stderr)
        return None
    return json.loads(r.stdout) if json_sortie else r.stdout


def rupture(avant: str, apres: str) -> bool:
    """Vrai pour une montee majeure, ou mineure tant que le paquet est en 0.x."""
    a = [int(x) for x in avant.split(".")]
    b = [int(x) for x in apres.split(".")]
    if a[0] != b[0]:
        return True
    return a[0] == 0 and (a[1:2] or [0]) != (b[1:2] or [0])


def majeures(titre: str, corps: str):
    """Rend les ruptures trouvees (liste, vide si aucune), ou None si aucune
    version n'est lisible dans la proposition."""
    # Les blocs <details> (notes de version, liste des commits) citent d'autres
    # paquets et d'autres versions : seul le resume compte.
    resume = re.sub(r"<details>.*?</details>", " ", corps or "", flags=re.S | re.I)
    texte = f"{titre or ''}\n{resume}"
    paires = {}
    for m in PAIRE.finditer(texte):
        paires[m.group("p1") or m.group("p2")] = (m.group("av"), m.group("ap"))
    for m in LIGNE_TABLEAU.finditer(resume):
        paires.setdefault(m.group("p"), (m.group("av"), m.group("ap")))
    if not paires:
        return None
    # Au-dela de 65 536 caracteres, Dependabot tronque le corps et les dernieres
    # lignes disparaissent : un paquet non lu pourrait etre une majeure. Moins de
    # paquets lus qu'annonces, c'est une decision humaine.
    annonce = ANNONCE.search(texte)
    if annonce and len(paires) < int(annonce.group(1)):
        return None
    return sorted(f"{p} {av} vers {ap}" for p, (av, ap) in paires.items() if rupture(av, ap))


def tete_changee(tete, sha_verifie: str) -> str:
    """Explique pourquoi on renonce quand la proposition a bougé depuis la CI."""
    return (f"Abandon : la proposition pointe maintenant sur {tete}, pas sur {sha_verifie}, "
            "le commit que la vérification a validé. La vérification du nouveau commit "
            "relancera ce traitement.")


def main() -> int:
    numero = os.environ["NUMERO_PR"]
    # Le commit que la vérification (CI) a validé. C'est le seul qui peut être
    # fusionné : entre la fin de la CI et la fusion, Dependabot peut repousser
    # la branche, et cette nouvelle tête n'a encore été testée par personne.
    sha_verifie = os.environ.get("SHA_VERIFIE", "").strip().lower()
    if not SHA_COMPLET.fullmatch(sha_verifie):
        print("Refusé : le commit validé par la vérification est inconnu (SHA_VERIFIE absent ou invalide).")
        return 1

    pr = gh("pr", "view", numero, "--repo", DEPOT, "--json",
            "author,headRefName,headRefOid,isCrossRepository,title,body,state,mergeable")
    if not pr:
        return 1

    # Trois verrous. Le depot est public : n'importe qui peut proposer une
    # modification, et une fusion automatique sans ces controles serait une porte
    # ouverte sur la production.
    if pr["author"]["login"] != "app/dependabot":
        print(f"Refuse : proposition de {pr['author']['login']}, pas de Dependabot.")
        return 0
    if pr["isCrossRepository"]:
        print("Refuse : la proposition vient d'une copie externe du depot.")
        return 0
    if not pr["headRefName"].startswith("dependabot/"):
        print(f"Refuse : branche inattendue ({pr['headRefName']}).")
        return 0
    if pr["state"] != "OPEN":
        print("Deja traitee.")
        return 0
    if pr["headRefOid"] != sha_verifie:
        print(tete_changee(pr["headRefOid"], sha_verifie))
        return 0

    grosses = majeures(pr.get("title", ""), pr.get("body", ""))
    if grosses is None:
        print("Refuse : versions illisibles ou incompletes dans la proposition, decision humaine requise.")
        return 0
    if grosses:
        print("Montee de version majeure, decision humaine requise :")
        for g in grosses:
            print("  -", g)
        subprocess.run(["gh", "pr", "edit", numero, "--repo", DEPOT,
                        "--add-label", "changement-majeur"], capture_output=True)
        return 0

    print(f"Fusion de #{numero} : {pr['title']}")

    # GitHub calcule la fusionnabilite d'une proposition de facon differee.
    # Juste apres la fin de la verification, l'etat vaut encore UNKNOWN et la
    # fusion est refusee. C'est ce qui laissait des mises a jour de securite
    # vertes dormir indefiniment, alors que tout etait bon. On attend que le
    # calcul aboutisse au lieu de renoncer au premier refus.
    #
    # Pendant cette attente (jusqu'à une minute et demie), la tête de la
    # proposition peut changer. Elle est donc relue à chaque essai, et la fusion
    # elle-même exige que la tête soit encore le commit validé : si elle bouge
    # entre la lecture et la fusion, GitHub refuse au lieu de fusionner du code
    # que la CI n'a jamais vu.
    for essai in range(1, 7):
        etat = gh("pr", "view", numero, "--repo", DEPOT, "--json", "headRefOid,mergeable,state")
        if etat and etat.get("state") == "MERGED":
            print("Deja fusionnee entre-temps.")
            return 0
        if etat and etat.get("headRefOid") != sha_verifie:
            print(tete_changee(etat.get("headRefOid"), sha_verifie))
            return 0
        if etat and etat.get("mergeable") == "CONFLICTING":
            print("Conflit avec la branche principale : Dependabot la remettra a jour lui-meme.")
            return 0
        if etat and etat.get("mergeable") == "MERGEABLE":
            r = subprocess.run(
                ["gh", "pr", "merge", numero, "--repo", DEPOT, "--squash", "--delete-branch",
                 "--match-head-commit", sha_verifie],
                capture_output=True, text=True)
            if r.returncode == 0:
                print("Fusionnee.")
                return 0
            print(f"Refus de fusion (essai {essai}) : {r.stderr.strip()}")
        else:
            print(f"GitHub calcule encore la fusionnabilite (essai {essai})...")
        time.sleep(15)

    print("Fusion impossible pour l'instant. Elle sera retentee au prochain passage.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
