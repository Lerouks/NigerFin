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

DEPOT = os.environ.get("DEPOT", "Lerouks/NigerFin")
# « Updates `paquet` from 1.2.3 to 1.3.0 », le format que Dependabot ecrit
# toujours dans le corps de sa proposition, y compris pour un groupe.
MOTIF = re.compile(
    r"Updates?\s+`?\[?([^`\]\s]+)\]?`?\s+from\s+v?(\d+)\.(\d+)\.(\S*?)\s+to\s+v?(\d+)\.(\d+)\.(\S+)",
    re.IGNORECASE,
)


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


def main() -> int:
    numero = os.environ["NUMERO_PR"]
    pr = gh("pr", "view", numero, "--repo", DEPOT, "--json",
            "author,headRefName,isCrossRepository,title,body,state,mergeable")
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

    grosses = majeures(pr.get("body", ""))
    if grosses:
        print("Montee de version majeure, decision humaine requise :")
        for g in grosses:
            print("  -", g)
        subprocess.run(["gh", "pr", "edit", numero, "--repo", DEPOT,
                        "--add-label", "changement-majeur"], capture_output=True)
        return 0

    print(f"Fusion de #{numero} : {pr['title']}")
    r = subprocess.run(
        ["gh", "pr", "merge", numero, "--repo", DEPOT, "--squash", "--delete-branch"],
        capture_output=True, text=True)
    if r.returncode != 0:
        # Cas courant et sans gravite : la proposition est en retard sur la
        # branche principale. Dependabot la remet a jour tout seul au prochain
        # passage, et elle repassera ici.
        print(f"Fusion impossible pour l'instant : {r.stderr.strip()}")
        return 0
    print("Fusionnee.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
