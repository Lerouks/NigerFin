# Lancement de nfireport.com, liste de travail

Audit du 26 août 2026, dix dimensions balayées en parallèle, chaque blocage
attaqué par un vérificateur chargé de le réfuter. Ce qui suit ne contient que
les constats qui ont survécu à cette contradiction.

**Stratégie retenue par Raouf le 26 août : ouvrir en média gratuit d'abord.**
Sept articles sur huit sont gratuits, le mur payant ne ferme presque rien.
Le site ouvre donc comme média gratuit avec sa liste d'attente, et Premium
reste éteint jusqu'à ce que le stock d'articles le justifie. Cela sort du
chemin critique tout le tunnel de paiement et toute la newsletter.

---

## Verdict

**Ce qui bloque le lancement n'est pas technique, c'est éditorial.**

La machine est en meilleur état que les rapports bruts ne le laissaient croire.
Le paiement iPay est correctement durci, les données personnelles sont fermées,
la mécanique SEO est propre, le moteur de données refuse d'inventer un chiffre.
Sur dix dimensions, une seule vraie faille méritait le mot « bloquant », et elle
a été corrigée en trente minutes.

Ce qui bloque, c'est que NFI Report n'a plus de journal. Dernier article le
17 avril 2026, soit 131 jours. La une est consacrée à la RDC et aux Émirats.
Trois articles sur huit ne mentionnent jamais le Niger. Zéro ligne sur
l'uranium, alors que l'uranium est partout ailleurs sur le site. Aucun réglage
ne répare cela.

---

## Bloc 0, fait le 26 août 2026

Corrigé et déployé, commit `7975c9f`.

- **La porte n'était pas verrouillée.** `src/lib/site-data.ts` retombait sur
  `prelaunchEnabled: false` dès que Supabase répondait mal : une coupure réseau
  suffisait à ouvrir le site toute seule. Le repli est devenu « fermé », et la
  dernière valeur lue avec succès est rejouée en priorité.
  **À repasser à `false` le jour de l'ouverture.**
- **Le contenu payant était téléchargeable sans compte.** Reproduit avec la
  seule clé publique : l'article premium sortait entier, les 35 leçons premium
  sortaient d'un bloc, 116 956 caractères. Migration `00031`, appliquée en
  production : le SELECT au niveau table est retiré aux rôles publics puis
  réaccordé colonne par colonne, contenu exclu. La route des leçons lit
  désormais le contenu avec la clé de service.
- **Les pages légales et le désabonnement étaient inatteignables.** Elles
  passent maintenant le filtre du pré-lancement, et la page d'attente porte un
  lien vers la politique de confidentialité sous son formulaire.
- **Le pré-lancement disait `nofollow` en plus de `noindex`**, ce qui empêchait
  Google d'apprendre l'architecture du site pendant l'attente. Seul `noindex`
  reste.

### Reste du bloc 0, non fait

- **Cinq chiffres inventés dorment dans le bandeau flash** : « indice composite
  +1,01 % », « minier +18 % au T1 2026 », « Uranium 89,50 USD/lb, +1,42 % »,
  « échanges intra-régionaux +23 % ». Aucune source. Le bandeau est éteint, mais
  un interrupteur dans l'admin et NFI publie quatre chiffres faux sur la BRVM en
  haut de chaque page. L'API publique les sert déjà en clair. *10 minutes.*

---

## Bloc 1, le vrai verrou

**Écrire 8 à 10 articles récents, dont un de fond sur l'uranium à mettre en une,
et garder 3 articles d'avance en brouillon.**

Répartition actuelle : économie 6, finance 3, marchés 1, entreprises 1, ce qui
fait afficher deux fois « Plus d'articles à venir prochainement » sous les
titres de rubrique de l'accueil.

C'est le seul point de cette liste qui ne se répare pas par un réglage. Tout le
reste est du polissage à côté.

---

## Bloc 2, corrections en base et dans l'admin, sans une ligne de code

Un après-midi, tout depuis le Cockpit.

| # | Ce que c'est | Effort |
|---|---|---|
| 1 | Les 11 liens « Comprendre cet actif » de `/marches` mènent à des pages qui n'existent pas. Les 5 slugs utilisés n'ont aucune correspondance avec les 10 vrais slugs. Le pont entre les chiffres et l'Éducation, cassé 11 fois sur 11. | 30 min |
| 2 | La fiche du STOXX Europe 600 décrit le CAC 40 : « indice phare de la Bourse de Paris, 40 plus grandes capitalisations françaises ». | 5 min |
| 3 | Coquille en tête d'accroche : « inancement rare », le F manque. Premier caractère visible de l'article sur trois pages. | 5 min |
| 4 | Deux chiffres d'inflation contradictoires sur `/niger` : -4,7 % en base, -7,5 % dans le bloc juste en dessous. Une troisième valeur (+3,7 %) dort ailleurs en base. | 30 min |
| 5 | BRVM Composite et Uranium sont « indisponible » depuis le 21 juillet, `brvm.org/api/quotes` renvoie 404. Décider : masquer les 2 lignes, ou saisir la clôture à la main. Ne jamais remettre une valeur inventée. Le Veilleur NFI collecte déjà brvm.org en HTML, c'est la source de remplacement évidente. | 30 min |
| 6 | `/marches` se contredit sur l'uranium : « indisponible » en haut, « 139,42 $/kg, T4 2025 » en bas. Idem or et Brent, sous un tampon « Avril 2026 ». | 1 h |
| 7 | Les 8 articles n'ont ni titre ni description SEO : Google les affiche coupés en plein milieu d'une phrase. | 1 h |
| 8 | `/about` promet 10 secteurs de couverture, 4 sont alimentés, dont l'agriculture annoncée et jamais traitée. | 15 min |
| 9 | `/marches` affirme que le Niger est « exportateur stratégique » de minerai de fer, ce que `/niger` contredit. | 15 min |
| 10 | 7 fiches d'entreprises sur 8 sans photo, aucune sans chiffre d'affaires. L'« Atlas économique » se résume à des logos. Laisser vide plutôt qu'inventer. | 2 h |

---

## Bloc 3, le jour de l'ouverture

Deux heures.

- Basculer `prelaunch_enabled` à `false` en base.
- Repasser le repli de `src/lib/site-data.ts` à `prelaunchEnabled: false`.
- **L'image de partage principale est un portrait présenté comme un paysage** :
  1080 x 1350, fond noir, monogramme argenté seul, aucun texte, aucun « NFI
  Report », alors que le code la déclare en 1200 x 630. Recadrée par Facebook et
  WhatsApp, il reste un rectangle noir. Elle sert l'accueil, `/premium`,
  `/articles` et `/about`, les quatre liens qu'on partage le jour d'un
  lancement. *30 min.*
- Créer la propriété Google Search Console et soumettre le sitemap. *15 min.*

---

## Bloc 4, découvrabilité, dans la semaine

- Les 10 pages Éducation partagent une seule carte de partage générique, à cause
  d'un paramètre lu de la mauvaise façon en Next 16. Les 73 leçons perdent leur
  principal levier de partage. *30 min.*
- L'image de repli des articles renvoie 404. Au premier article publié sans
  photo de couverture, la carte de partage et la fiche Google cassent ensemble.
  *15 min.*
- La recherche ne lit pas le corps des articles : « uranium », « pétrole » et
  « inflation » renvoient zéro résultat. *2 h.*
- `/newsletter` et `/contact` n'ont aucune image de partage, les dimensions
  annoncées des images d'articles sont fausses sur les 8, les 4 parcours
  éducatifs sont absents du sitemap. *2 h.*

---

## Bloc 5, conformité, dans la semaine

- Les mentions légales renvoient à des **CGV qui n'existent pas**, et les CGU
  décrivent « un abonnement renouvelable, résiliable à tout moment » alors que
  le produit est un paiement unique. Sur `/premium`, deux blocs affichent
  « Annulation 1 clic » pour une fonction qui n'existe pas. *3 h.*
- La politique de confidentialité ne dit ni les durées de conservation, ni les
  sous-traitants d'infrastructure. *1 h.*
- Le bandeau cookies annonce la mesure d'audience mais autorise aussi Sentry,
  jamais nommé. La page `/cookies` décrit un réglage par catégorie qui n'existe
  pas. Une fois « Accepter » cliqué, on ne peut plus revenir en arrière. *3 h.*
- La page de confidentialité affirme que les données envoyées à PostHog sont
  « anonymisées », alors que l'adresse e-mail et le rôle lui sont transmis à
  chaque connexion. *30 min.*
- Deux affirmations contradictoires sur le pays d'hébergement : « vos données
  restent en Europe » sur `/newsletter`, « San Francisco » dans les mentions
  légales, la base étant réellement en Oregon. *30 min.*
- La page newsletter revendique une « conformité RGPD intégrale », référentiel
  européen, alors que l'autorité de NFI est la HAPDP et le texte la loi 2017-28.
  *10 min.*
- `/publicite` vend des articles sponsorisés « clairement signalés », alors
  qu'aucun champ ne permet de les signaler. *4 h, ou retirer la promesse.*
- Aucun directeur de publication n'est nommé, alors que le site se déclare
  service de presse en ligne. *Arbitrage de Raouf.*
- `contact@nfireport.com` ne reçoit rien, aucun MX sur le domaine. L'adresse est
  publiée dans les mentions légales, sur `/publicite`, sur les factures, et
  comme adresse d'exercice des droits devant la HAPDP. Le formulaire du site,
  lui, fonctionne et enregistre bien en base. *20 min.*
- Aucune politique DMARC, `_dmarc.nfireport.com` est vide, alors que SPF et DKIM
  sont en place. Gmail et Yahoo classent plus sévèrement sans DMARC. *15 min
  chez Namecheap.*

---

## Bloc 6, exploitation, dans le mois

- Pas de sauvegarde automatisée des **données** de la base. Le schéma, lui, est
  bien versionné sur GitHub. À faire avant le premier client payant. *2 h.*
- Compte Vercel gratuit, plan réservé à un usage non commercial, sans moyen de
  paiement. À passer en Pro avant d'encaisser. *15 min, 20 $/mois.*
- Aucune page n'est mise en cache : chaque visite depuis Niamey remonte jusqu'en
  Virginie, puis interroge une base en Oregon. *1 jour.*
- La table des limitations de débit n'est jamais purgée : 7 335 lignes pour
  4 comptes. *2 h.*
- La migration des notifications push n'a jamais été appliquée, la table
  n'existe pas, le Cockpit propose une fonction morte. *1 h.*
- Sentry est aveugle sur le middleware et sur tout visiteur qui n'a pas accepté
  les cookies. *2 h.*
- La mesure d'audience Vercel est activée dans le tableau de bord mais le script
  n'est pas installé : zéro visite comptée. *30 min.*
- Le dépôt GitHub est public sans garde-fou anti-fuite de secret. L'historique
  est propre aujourd'hui, vérifié sur 3 473 fichiers. Trois interrupteurs
  gratuits à activer. *10 min.*
- La route d'analytique du paywall accepte des écritures anonymes sans
  limitation. *15 min.*
- 8 vulnérabilités élevées dans les dépendances de production. *2 h.*
- La supervision passe « dégradée » tous les jours depuis 37 jours à cause de la
  BRVM, ce qui rend l'alerte inaudible. La panne de l'uranium n'apparaît nulle
  part. Aucune alerte n'atteint réellement Raouf. *3 h.*
- Le calcul de clôture quotidien écrase les variations nulles. *30 min.*
- `TODOS-SECURITY.md` est périmé et décrit comme bloquant un trou déjà bouché.
  *30 min.*

---

## Bloc 7, avant d'encaisser le premier franc

Hors chemin critique tant que Premium reste éteint.

- **Aucun paiement réel n'a jamais abouti en production.** La branche succès
  n'est prouvée que par les tests. Payer 5 000 FCFA depuis un vrai téléphone et
  vérifier les 6 effets : statut `verified`, rôle `premium`, abonnement au bon
  montant, e-mail reçu, facture émise, PDF dans le coffre. *30 min.*
- **La facture n'est pas conforme à la loi nigérienne** : pas de certification
  SECeF, et aucune mention du régime d'exonération de TVA. Inscription e-SECeF
  sur le NIF, et ajout de la mention « exonéré de TVA, publications périodiques
  d'information ». *1 h pour la mention, une démarche DGI pour le reste.*
- **Le secret du webhook est la même valeur que la clé API secrète**, vérifié
  par empreinte, sur Vercel comme en local. *1 h.*
- **`.env.local` pointe sur la base de production** : un simple `npm run dev`
  écrit dans les paiements réels. C'est l'origine des 12 lignes de test de
  juillet.
- Un renouvellement anticipé efface les jours restants. *1 h.*
- Rien ne s'affiche à l'écran après un paiement, `?checkout=` n'est lu par
  aucune page. *2 h.*
- Cinq clics sur « Payer » et le client est bloqué une heure, avec un message
  qui ressemble à une accusation. Chaque clic crée une ligne fantôme « En
  attente » définitive. *1 h.*
- Un abonné ne peut pas renouveler : l'e-mail d'échéance pointe vers une page
  qui répond « Vous êtes déjà abonné », sans bouton. *15 min.*
- Un client ne peut pas retrouver sa facture depuis son compte. *30 min.*
- Aucun bouton « S'abonner » pour un lecteur connecté. *15 min.*
- Créer son compte pendant le paiement éjecte le client sur l'accueil. *2 h.*
- Robustesse : si une écriture échoue après le verrou d'idempotence, le client
  est débité et jamais activé ; la facture part sans garantie d'exécution sur
  Vercel ; la route peut mettre 16 secondes sans durée maximale déclarée ; le
  webhook peut se faire limiter par son propre garde-fou ; aucun événement
  d'argent n'est écrit dans le journal d'audit ; il n'existe ni colonne de
  référence iPay ni tâche de réconciliation. *1 jour.*

---

## Bloc 8, avant le premier envoi de newsletter

Hors chemin critique tant que la newsletter n'est pas envoyée.

- **La version texte envoie le Premium complet aux abonnés gratuits.** Le texte
  est calculé une seule fois, sans tenir compte de l'audience, et le même est
  attaché aux deux lots. Le HTML coupe correctement, le texte non. *2 h.*
- La version texte n'a aucun lien de désabonnement et dit « abonné Premium » à
  tout le monde. *30 min.*
- Un envoi refusé par Resend est enregistré comme intégralement livré. *1 h.*
- Un incident après l'envoi remet le numéro en brouillon, ce qui ouvre la porte
  à un double envoi complet. *1 h.*
- Aucun retour sur les e-mails envoyés, pas de webhook Resend. Rebonds et
  plaintes pour spam ne remontent jamais. *30 min, aucun code.*
- Un échec d'envoi est invisible pour le code appelant : la facture est
  enregistrée « envoyée » sans être partie. *2 h.*
- Pas de double opt-in, donc n'importe qui peut inscrire l'adresse d'un tiers.
  L'e-mail de bienvenue est le seul qui n'offre aucune sortie. Un compte
  supprimé continue de recevoir la newsletter. La newsletter n'identifie pas
  NFI Group SARL. Tout acheteur Premium est inscrit d'office. *1 jour.*
- La newsletter publierait « BRVM Composite 0,00 pts, fixe » et « Uranium
  0,00 USD, fixe ». Le canal e-mail n'a pas reçu le correctif anti-fabrication
  du 20 juillet. *30 min.*

---

## Bloc 9, le paywall est décoratif

Pas urgent : 7 articles sur 8 sont gratuits, le mur ne ferme presque rien.
Le devient le jour où le stock Premium existe. *1 jour pour l'ensemble.*

Le compteur d'articles Premium est alimenté par le navigateur du lecteur, pas
par le serveur. Le réglage « nombre d'articles gratuits » ne fait rien, la
colonne n'existe pas en base. Tout le panneau admin Paywall pilote des réglages
branchés nulle part. Aucun événement de conversion n'est envoyé depuis avril.
La limite de 3 articles pour visiteur anonyme est du code mort. Le teaser du mur
payant invente deux paragraphes génériques, dont une mention d'« experts
interrogés » qui n'existent pas.

---

## Cosmétique

Le rail de marché noir de l'accueil est éteint depuis le 19 juillet. La page
tarifs promet Nita et Amana, la page de paiement ne propose qu'iPayMoney. Les
titres en très gras s'affichent en gras simple, les graisses 800 et 900 ne sont
pas chargées. 136 Ko de polices préchargées, dont 38 Ko pour deux lignes de
texte. Le hero de `/entreprises` est une image de 4 608 pixels de large, 920 Ko,
sur une page secondaire. La page reste visuellement vide environ une seconde à
cause des animations d'entrée. Les fichiers de `public/` sont revalidés à chaque
visite. Le champ e-mail de la page d'attente fait 40 pixels de haut. Les
difficultés de parcours s'affichent sans accents. Le plan du site ne mentionne
ni `/articles`, ni `/premium`, ni `/newsletter`. La page d'accueil montre le
même article jusqu'à 4 fois et en cache deux entièrement. Aucun article n'est
signé par un humain, et les fondateurs sont réduits à deux initiales. Le numéro
de téléphone du texte de secours des mentions légales est faux.

---

## Constats écartés par les vérificateurs

À ne pas ressortir : l'e-mail de bienvenue en boucle, « aucune sauvegarde »,
« un compte gratuit lit 100 % du Premium », « l'offre Premium repose sur
1 article ». `CRON_SECRET` existe bien sur Vercel Production, créé il y a
127 jours : la newsletter du lundi n'est pas cassée pour cette raison.
