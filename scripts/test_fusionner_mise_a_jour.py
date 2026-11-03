"""Tests de la lecture des versions par la fusion automatique.

Ce script est le seul contrôle entre Dependabot et la production : une montée
majeure qu'il lirait mal partirait en ligne sans décision humaine. Les corps
ci-dessous reprennent les formes réelles qu'écrit Dependabot.
"""
import importlib.util
import os
import pathlib
import unittest
from unittest import mock

_CHEMIN = pathlib.Path(__file__).with_name("fusionner-mise-a-jour.py")
_SPEC = importlib.util.spec_from_file_location("fusion", _CHEMIN)
fusion = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(fusion)


class Ruptures(unittest.TestCase):
    def test_majeure_mise_a_jour_seule(self):
        corps = "Bumps [pako](https://github.com/nodeca/pako) from 2.1.0 to 3.0.3.\n"
        self.assertEqual(fusion.majeures("", corps), ["pako 2.1.0 vers 3.0.3"])

    def test_majeure_paquet_avec_portee(self):
        corps = "Bumps [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped) from 22.19.13 to 26.4.1."
        self.assertEqual(fusion.majeures("", corps), ["@types/node 22.19.13 vers 26.4.1"])

    def test_action_github_a_un_seul_chiffre(self):
        corps = "Bumps [actions/setup-node](https://github.com/actions/setup-node) from 6 to 7."
        self.assertEqual(fusion.majeures("", corps), ["actions/setup-node 6 vers 7"])

    def test_mineure_en_zero_x_est_une_rupture(self):
        corps = "Bumps [@supabase/ssr](https://github.com/supabase/ssr) from 0.10.3 to 0.12.5."
        self.assertEqual(fusion.majeures("", corps), ["@supabase/ssr 0.10.3 vers 0.12.5"])

    def test_correctif_en_zero_x_passe(self):
        corps = "Bumps [@supabase/ssr](https://github.com/supabase/ssr) from 0.10.3 to 0.10.5."
        self.assertEqual(fusion.majeures("", corps), [])

    def test_groupe_de_correctifs_passe(self):
        corps = ("Bumps the next-ecosystem group with 2 updates:\n"
                 "Updates `next` from 16.4.4 to 16.4.5\n"
                 "Updates `eslint-config-next` from 16.4.4 to 16.4.5\n")
        self.assertEqual(fusion.majeures("", corps), [])

    def test_groupe_avec_une_majeure(self):
        corps = ("Updates `typescript` from 5.9.3 to 7.0.2\n"
                 "Updates `@types/react` from 19.2.6 to 19.2.7\n")
        self.assertEqual(fusion.majeures("", corps), ["typescript 5.9.3 vers 7.0.2"])

    def test_les_blocs_details_ne_comptent_pas(self):
        corps = ("Bumps [lucide-react](https://github.com/lucide-icons/lucide) from 1.16.0 to 1.61.0.\n"
                 "<details>\n<summary>Release notes</summary>\n"
                 "Updates `autre-paquet` from 1.0.0 to 2.0.0\n</details>\n")
        self.assertEqual(fusion.majeures("", corps), [])

    def test_titre_seul(self):
        self.assertEqual(fusion.majeures("chore(deps): bump sharp from 0.34.5 to 0.35.5", ""),
                         ["sharp 0.34.5 vers 0.35.5"])

    def test_aucune_version_lisible_rend_none(self):
        self.assertIsNone(fusion.majeures("Mise a jour", "Un texte sans aucune version."))


class Groupes(unittest.TestCase):
    def test_tableau_du_groupe_lu(self):
        corps = ("Bumps the testing group with 2 updates:\n\n"
                 "| Package | From | To |\n| --- | --- | --- |\n"
                 "| [vitest](https://github.com/vitest-dev/vitest) | `4.1.11` | `5.0.1` |\n"
                 "| [@testing-library/react](https://github.com/testing-library/react-testing-library) | `16.3.0` | `16.3.1` |\n")
        self.assertEqual(fusion.majeures("", corps), ["vitest 4.1.11 vers 5.0.1"])

    def test_corps_tronque_decision_humaine(self):
        # 4 paquets annoncés, 3 lisibles : le 4e a été coupé par la troncature.
        corps = ("Bumps the next-ecosystem group with 4 updates:\n"
                 "Updates `next` from 16.4.4 to 16.4.5\n"
                 "Updates `@next/bundle-analyzer` from 16.4.4 to 16.4.5\n"
                 "Updates `eslint-config-next` from 16.4.4 to 16.4.5\n"
                 "_Description has been truncated_")
        self.assertIsNone(fusion.majeures("", corps))

    def test_ligne_sans_version_de_depart_decision_humaine(self):
        corps = ("Bumps the supabase group with 2 updates:\n"
                 "Updates `a` from 1.0.0 to 1.0.1\nUpdates `b` to 2.0.0\n")
        self.assertIsNone(fusion.majeures("", corps))

    def test_groupe_complet_de_correctifs_passe(self):
        corps = ("Bumps the tiptap group with 2 updates:\n"
                 "Updates `@tiptap/core` from 3.1.0 to 3.2.0\n"
                 "Updates `@tiptap/react` from 3.1.0 to 3.2.0\n")
        self.assertEqual(fusion.majeures("chore(deps): bump the tiptap group with 2 updates", corps), [])


SHA = "a" * 40


def proposition(**surcharges):
    pr = {
        "author": {"login": "app/dependabot"}, "headRefName": "dependabot/npm_and_yarn/next-16.4.5",
        "headRefOid": SHA, "isCrossRepository": False, "state": "OPEN", "mergeable": "MERGEABLE",
        "title": "chore(deps): bump next from 16.4.4 to 16.4.5",
        "body": "Bumps [next](https://github.com/vercel/next.js) from 16.4.4 to 16.4.5.",
    }
    pr.update(surcharges)
    return pr


class Decision(unittest.TestCase):
    """main() : ce qui part réellement en production, avec un faux gh."""

    def lancer(self, pr, etat=None):
        appels = []

        def faux_gh(*args, json_sortie=True):
            if "author,headRefName,headRefOid,isCrossRepository,title,body,state,mergeable" in args:
                return pr
            return etat or {"headRefOid": pr["headRefOid"], "mergeable": "MERGEABLE", "state": "OPEN"}

        def faux_run(cmd, **kw):
            appels.append(cmd)
            return mock.Mock(returncode=0, stdout="", stderr="")

        env = {"NUMERO_PR": "42", "SHA_VERIFIE": SHA, "DEPOT": "Lerouks/NigerFin"}
        with mock.patch.dict(os.environ, env), mock.patch.object(fusion, "gh", faux_gh), \
             mock.patch.object(fusion.subprocess, "run", faux_run), mock.patch.object(fusion.time, "sleep"):
            code = fusion.main()
        return code, appels

    def fusions(self, appels):
        return [c for c in appels if c[:3] == ["gh", "pr", "merge"]]

    def test_correctif_a_jour_fusionne_avec_le_commit_valide(self):
        code, appels = self.lancer(proposition())
        self.assertEqual(code, 0)
        fusions = self.fusions(appels)
        self.assertEqual(len(fusions), 1)
        self.assertIn("--match-head-commit", fusions[0])
        self.assertIn(SHA, fusions[0])

    def test_majeure_etiquetee_jamais_fusionnee(self):
        pr = proposition(title="chore(deps): bump pako from 2.1.0 to 3.0.3",
                         body="Bumps [pako](https://github.com/nodeca/pako) from 2.1.0 to 3.0.3.")
        _, appels = self.lancer(pr)
        self.assertEqual(self.fusions(appels), [])
        self.assertTrue(any("changement-majeur" in c for c in appels))

    def test_proposition_illisible_ni_fusionnee_ni_etiquetee(self):
        _, appels = self.lancer(proposition(title="Mise a jour", body="Aucune version ici."))
        self.assertEqual(appels, [])

    def test_tete_changee_depuis_la_ci(self):
        _, appels = self.lancer(proposition(headRefOid="b" * 40))
        self.assertEqual(self.fusions(appels), [])

    def test_auteur_autre_que_dependabot_refuse(self):
        _, appels = self.lancer(proposition(author={"login": "quelquun"}))
        self.assertEqual(appels, [])


if __name__ == "__main__":
    unittest.main()
