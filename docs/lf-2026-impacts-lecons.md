# Impacts Loi de Finances 2026 sur les leçons NIGERFIN

Source : `ORDONNANCE-N-2025-44 LOI DE FINANCES 2026.pdf`, signée 31/12/2025 par Général Abdourahamane Tiani, entrée en vigueur 1er janvier 2026.

À traiter en passe de correction de contenu après la feature parcours (décision NFI 2026-04-17).

## Règles d'application

- Ne pas toucher aux simulateurs (/outil/*) même si les taux semblent obsolètes
- Ajouter un disclaimer "tarifs et conditions peuvent évoluer, consulter un conseiller" sur toute leçon touchant aux chiffres fiscaux
- Faire valider par NFI chaque leçon avant écriture en DB

## Leçons à mettre à jour

### economie-niger / fiscalite-droit / budget-banque

| Leçon | Impact LF 2026 |
|---|---|
| `fiscalite-droit #1` Les bases de la fiscalité au Niger | Nouveau barème ITS Art. 150 (9 tranches 1% à 35%). Nouvelles taxes TDTA et TPN. |
| `fiscalite-droit #2` Fiscalité des revenus d'investissement | IRCM Art. 178 : exonérations OPCVM, SICAV, SICAF. Art. 180 : exonérations intérêts livrets d'épargne, SFD, obligations État. |
| `fiscalite-droit #3` Droits des actionnaires OHADA | Vérifier si rien de changé (plutôt OHADA que Niger) |
| `economie-niger #6` Investir à la BRVM : guide pratique | Ajouter mention IRCM exonéré pour OPCVM/SICAV. |
| `economie-niger #12` Ouvrir un compte-titres chez SGI-Niger (nouvelle) | Renvoyer vers leçon fiscalité pour régime IRCM. |
| `budget-banque #8` Le mobile money : la révolution financière | **Critique** : TDTA 0,5% de base, 5% au-delà de 2M FCFA. Art. 394 sexies. |
| `budget-banque #5` Le système bancaire au Niger | Peut mentionner obligation paiement bancaire >= 2M FCFA pour déductibilité (Art. 23 et 339). |
| `budget-banque #7` La microfinance au Niger | Exonérations SFD (systèmes financiers décentralisés) : intérêts comptes exonérés IRCM (Art. 180). |
| `bases-finance #8` Les comptes d'épargne en zone UEMOA | Exonération intérêts livrets d'épargne classiques (Art. 180). |

### entrepreneuriat

| Leçon | Impact LF 2026 |
|---|---|
| `entrepreneuriat #1` De l'idée au business plan | Mentionner incitations fiscales jeunes entrepreneurs. |
| `entrepreneuriat #2` Les formes juridiques au Niger | Vérifier SICAF/SICAV/OPCVM décrits si pertinent. |
| `entrepreneuriat #3` Financer sa startup au Niger | **Majeur** : Taxe professionnelle Art. 279 — exonération 1ère année, 50% 2e année pour jeunes ≤ 40 ans. Règle paiement bancaire >= 2M. |
| `entrepreneuriat #4` Gérer la croissance de son entreprise | Conservation comptabilité 10 ans. TVA non déductible sur achats non-bancaires >= 2M. |

### immobilier

| Leçon | Impact LF 2026 |
|---|---|
| `immobilier #1` Les bases de l'investissement immobilier | Droits de publicité foncière Art. 1041 : 1% mutation, 2% zone habitat immatriculation, 3% zone industrielle. |
| `immobilier #2` Le foncier au Niger : cadre juridique | Vérifier Art. 1041 intégré. |
| `immobilier #3` Financer son projet immobilier | Droits hypothèque 1,5% ; mainlevée 50 000 FCFA. |

### devises-change

| Leçon | Impact LF 2026 |
|---|---|
| `devises-change #4` Les transferts d'argent en Afrique de l'Ouest | **Critique** : TDTA (0,5% / 5% au-delà de 2M) sur transferts d'argent. |

## Taux et chiffres clés LF 2026 (référence rapide)

### ITS (Impôt sur Traitements et Salaires) mensuel
- 0 – 25 000 : 1%
- 25 001 – 50 000 : 2%
- 50 001 – 100 000 : 6%
- 100 001 – 150 000 : 13%
- 150 001 – 300 000 : 25%
- 300 001 – 400 000 : 30%
- 400 001 – 700 000 : 32%
- 700 001 – 1 000 000 : 34%
- Au-delà de 1 000 000 : 35%

### TDTA (Taxe Dépôts et Transferts Argent, nouvelle 2026)
- 0,5% montant brut (base)
- 5% pour montants > 2 000 000 FCFA

### TPN (Taxe Paiements Numéraire, nouvelle 2026)
- 1% HT du paiement
- Exonéré si ≤ 100 000 FCFA

### Taxe professionnelle (Art. 279)
- 1ère année : exonération totale
- Jeunes entrepreneurs ≤ 40 ans en 2e année : exonération 50%

### Déductibilité entreprise (Art. 23 et 339)
- Charge ≥ 2 000 000 FCFA payée non-bancaire : NON déductible
- TVA non déductible sur achats ≥ 2 000 000 FCFA non-bancaires

### Droits immobiliers (Art. 1041)
- Mutation totale propriété : 1%
- Zone industrielle/commerciale : 3%
- Zone habitat : 2%
- Hypothèque : 1,5%
- Main levée : 50 000 FCFA forfait

### Budget 2026
- Total recettes : 1 861 milliards FCFA
- Total dépenses : 2 923 milliards FCFA (AE 3 053)
- Déficit : 425 milliards FCFA
- Impôts revenus/bénéfices/gains en capital : 342 milliards
- Impôts salaires : 79 milliards
- Impôts biens/services : 517 milliards

## TODO après feature parcours

1. Valider avec NFI la liste des leçons à mettre à jour
2. Rédiger une version corrigée de chaque leçon (draft markdown)
3. Faire valider à NFI chaque draft avant insertion DB
4. Insérer via Supabase MCP avec idempotence (UPDATE sur id existant, pas INSERT)
5. Ajouter disclaimer systématique
