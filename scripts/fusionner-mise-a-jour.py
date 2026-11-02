#!/usr/bin/env python3
"""Fusionne une mise a jour de dependance proposee par Dependabot, sous conditions.

Pourquoi ce script existe : le proprietaire du site ne code pas. Sans fusion
automatique, les correctifs de securite s'empilent en propositions que personne
n'ouvre, ce qui est exactement ce qui s'est passe ici, avec seize propositions en
attente et huit vulnerabilites connues.

Ce qui est fusionne automatiquement : les corrections et les montees mineures,
et seulement si toute la verification est passee au vert (analyse, types, tests,
compilation).

Ce qui ne l'est jamais : les montees de version MAJEURE. Une majeure change le
comportement d'une bibliotheque et peut casser le site sans qu'aucun test ne le
voie. Elles restent ouvertes, etiquetees, et attendent une decision humaine.
"""
import json
import os
import re
import subprocess
import sys
import time

DEPOT = os.environ.get("DEPOT", "Lerouks/NigerFin")
# « Updates `paquet` from 1.2.3 to 1.3.0 », le format que Dependabot ecrit
# toujours dans le corps de sa proposition, y compris pour un groupe.
MOTIF = re.compile(
    r"Updates?\s+`?\[?([^`\]\s]+)\]?`?\s+from\s+v?(\d+)\.(\d+)\.(\S*?)\s+to\s+v?(\d+)\.(\d+)\.(\S+)",
    re.IGNORECASE,
)
# Identifiant complet d'un commit, tel que GitHub le transmet.
SHA_COMPLET = re.compile(r"[0-9a-f]{40}")


def gh(*args, json_sortie=True):
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr.strip(), file=sys.stderr)
        return None
    return json.loads(r.stdout) if json_sortie else r.stdout


def majeures(corps: str):
    """Rend la liste des paquets dont le premier numero de version change."""
    trouvees = []
    for m in MOTIF.finditer(corps or ""):
        paquet, av_maj, _, _, ap_maj, _, _ = m.groups()
        if av_maj != ap_maj:
            trouvees.append(f"{paquet} {av_maj}.x vers {ap_maj}.x")
    return trouvees


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

    grosses = majeures(pr.get("body", ""))
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
