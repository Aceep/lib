# Passation — kyle-lib

Repo GitHub : `Aceep/lib` (dossier local `kyle-lib`), projet perso, branche `feat/catalog`.
Catalogue web d'EPUB pour 2 personnes, hébergé en local sur mon serveur.

## État actuel

- `server/` : Fastify + SQLite (better-sqlite3, recherche FTS5 qui ignore les accents) + indexeur EPUB incrémental
  + job de synchro (`rclone sync <RCLONE_REMOTE> <BOOKS_DIR>`, puis indexation ; cron via croner, 4 h par défaut ; bouton dans l'UI).
- `web/` : Vite + React + react-router. Catalogue (recherche, filtres auteur/langue, tri, pagination dans l'URL),
  fiche livre + téléchargement, panneau de synchro dans l'en-tête.
- Fastify sert `web/dist` en prod, avec renvoi vers `index.html` pour les routes de l'appli.
- Tests : `npm test` (69 serveur + 7 front), `npm run typecheck`.
- Dev : `npm run dev -w server` + `npm run dev -w web`. Indexation manuelle : `npm run index -w server`.
- Variables d'env : `BOOKS_DIR`, `DATA_DIR`, `RCLONE_REMOTE`, `SYNC_CRON` (`off` pour désactiver), `PORT`,
  `HOST` (`127.0.0.1` par défaut), `WEB_DIR`.

## Décisions

- MEGA n'est qu'une source copiée en local par rclone ; l'appli ne parle jamais à MEGA.
- L'aperçu de lecture est abandonné.
- Pas de Testing Library pour l'instant (non validé).

## Tâche suivante : trier les doublons sur le compte MEGA (gratuit, ~10 Go d'EPUB)

- rclone n'est pas encore installé ; c'est moi qui l'installe et qui lance `rclone config` (mot de passe saisi par moi uniquement).
- Lancer rclone lit `~/.config/rclone`, hors du repo : me demander d'abord.
- Approche envisagée :
  1. Lecture seule : `rclone lsjson -R` pour repérer les fichiers de même taille ou de nom proche une fois normalisé.
     **Fait** (2026-11-21) : `rclone lsjson -R --files-only mega: > data/mega-lsjson.json`, puis
     `node scripts/mega-pass1.mjs data/mega-lsjson.json docs/doublons-mega.md`. Vérifié : MEGA n'expose aucune empreinte
     via rclone (`Hashes: []`), d'où une passe 1 limitée aux noms et tailles. Les EPUB sont dans `mega:Library`
     (915 fichiers, 1,3 Go ; 814 rangés dans `Books/<Lettre>/<Auteur>/`, le reste en vrac à la racine).
  2. Après la synchro locale : empreinte du contenu pour les doublons exacts, et métadonnées EPUB (titre + auteur,
     via `server/src/epub/read-epub-metadata.ts`) pour repérer le même livre sous deux fichiers différents.
     **Fait** (lecture seule) : `npm run duplicates -w server [-- --json] [dossier]` (`server/src/duplicates/find-duplicates.ts`).
     Fichier proposé à garder : sans marqueur de copie (`(1)`, `copie`, `copy`), puis le plus gros, puis le chemin le plus court.
     Lancé le 2026-11-21 après `rclone copy mega:Library books/ --include "*.epub"` : 914 EPUB, 315 groupes, 329 fichiers
     en trop (545 Mo). Rapport : `docs/doublons-mega-passe2.md` (via `scripts/mega-pass2-report.mjs`, qui écrit aussi
     `data/doublons-a-deplacer.txt`).
  3. Rapport groupe par groupe avec une proposition de fichier à garder ; aucune modification sans ma validation.
     Déplacer les doublons dans un dossier `_doublons` sur MEGA plutôt que les supprimer.
     **Fait le 2026-11-21** : `rclone move mega:Library mega:_doublons --files-from data/doublons-a-deplacer.txt`
     (329 déplacements côté serveur, 519 Mio, 0 erreur) + `rclone moveto` du jumeau NFC de « Le ministère du futur
     (Z-Library) », renommé `… (2).epub` dans `_doublons`. Bilan : `mega:Library` 915 → **585 EPUB**, `mega:_doublons`
     330 fichiers, et `npm run duplicates` ne trouve plus rien sur la copie locale resynchronisée.
     Réversible : `rclone move mega:_doublons mega:Library`. Les 19 groupes à écart de taille > 10 % ont été tranchés
     « on garde le plus gros » ; si une version déplacée était la bonne, elle est dans `_doublons` au même chemin.
     Reste à décider quand vider `_doublons` (à la main, dans l'interface MEGA).
## Rangement de `mega:Library` (2026-11-21)

- Format choisi (compatible avec une recherche par mots) : `Books/<Lettre du nom>/<Prénom Nom>/<Prénom Nom - Titre>.epub`,
  d'après les métadonnées EPUB. Règles dans `server/src/library/file-naming.ts` (testé).
- `npm run plan-layout -w server -- <books> <plan.json> <rapport.md> scripts/layout-overrides.json` produit le plan
  (`docs/rangement-mega.md`) ; `scripts/layout-overrides.json` fixe à la main les cibles des EPUB aux métadonnées fausses
  (titre/auteur inversés, auteur `Unknown`…). `node scripts/apply-layout-plan.mjs <plan.json> mega:Library books --apply`
  applique le plan (un `rclone moveto` côté serveur par fichier + même renommage en local, journal
  `data/apply-layout-plan.log` avec chaque ancien → nouveau).
- **Appliqué le 2026-11-21** : 586 renommages côté serveur (journal `data/apply-layout-plan.log`, ancien → nouveau),
  plus 11 dossiers MEGA renommés de NFD en NFC et 5 doublons de plus (collisions de noms) déplacés vers `_doublons`
  (335 fichiers là-bas). État final : `mega:Library` = 580 EPUB dans `Books/<Lettre>/<Auteur>/`, 0 à la racine,
  copie locale identique (`rclone sync --dry-run` ne transfère rien), `plan-layout` et `duplicates` ne proposent plus rien.
  Les exceptions de `scripts/layout-overrides.json` sont désormais clés par leur chemin final (le plan reste idempotent).
- Pièges rencontrés, à garder en tête : `/mnt/c` (NTFS) est insensible à la casse, donc un `mkdir` sur « R. F. Kuang »
  tombe dans « R. f. Kuang » ; MEGA accepte deux dossiers dont le nom ne diffère que par la forme Unicode (NFC/NFD) et
  `rclone moveto` réutilise un dossier NFD existant. `proposeName` sort du NFC pour éviter d'en recréer.
- Les 598 fiches Calibre (`.jpg`/`.opf`) de `Books/` ont été supprimées le 2026-11-21 (`rclone delete`, donc dans la
  corbeille MEGA). `Books/` ne contient plus que les 580 EPUB, dans 426 dossiers auteurs.
- Restes à trier à la main : `Books/_À identifier/` (2 EPUB sans métadonnées) ; hors `Books/`, `Library/Other/`
  (12 PDF, 1 RAR, 2 `.json`) et `Library/Graphics/` (BD et mangas en `.cbz`/`.cbr`, avec quelques doublons de même nom
  MEGA) n'ont pas été touchés — l'appli n'indexe que les EPUB.
- Rappel : la barre de recherche de l'appli lit titre/auteurs/description des métadonnées, pas les noms de fichiers.
- Bug repéré à corriger : le lecteur OPF ne décode pas les entités HTML (`Tr&#xE9;vidic`), ce qui pollue la recherche.
  `decodeEntities` dans `file-naming.ts` est un palliatif local au nommage ; la vraie correction est dans `server/src/epub/opf.ts`.

- `rclone sync mega:Library books/` signale `Graphics/Invincible intégrale` et `Graphics/zzImpénétrable` en
  « Duplicate directory found in source » (deux dossiers de même nom sur MEGA) : sans effet sur les EPUB, à nettoyer
  dans l'interface MEGA si ça gêne.
- Au passage : `Books/I/Nemirovsky Irene/IRENE_NEMIROVSKY__LE_BAL.epub` est refusé par notre lecteur zip
  (`invalid relative path: OPS/../cover.jpg`) ; l'indexeur l'ignorera aussi. À voir si on assouplit ou si on répare le fichier.
- Attention : le quota de transfert du compte MEGA gratuit limite la synchro complète.

## Ajout de livres depuis l'appli (fait le 2026-11-21)

- Page `/upload` (bouton « Ajouter des livres » dans l'en-tête). Flux en deux temps :
  `POST /api/uploads` (multipart, champ `file`) dépose l'EPUB dans `DATA_DIR/uploads/`, lit les métadonnées, propose le
  chemin `Books/<Lettre>/<Prénom Nom>/<Prénom Nom - Titre>.epub` (mêmes règles que le rangement, `file-naming.ts`)
  et liste les doublons : `identical` (même SHA-256), `same-book` (même titre + auteurs normalisés), `same-path`.
  Puis `POST /api/uploads/:id/confirm` range le fichier, le pousse sur MEGA (`rclone copyto`, obligatoire sinon la
  synchro suivante l'effacerait — en cas d'échec le fichier reste en transit et on peut re-confirmer) et l'indexe ;
  `DELETE /api/uploads/:id` annule. Les uploads non confirmés expirent après 1 h et au redémarrage.
- Nouvelle colonne `books.content_hash` (migration 3), remplie à l'indexation (rattrapage automatique des anciens livres).
- La synchro ne tire plus que `*.epub` depuis MEGA (`Library/` contient aussi ~7 Go de BD et PDF).
- Vérifié de bout en bout sur la vraie bibliothèque (doublon détecté, livre de test poussé sur MEGA puis supprimé).
- Titre et auteurs sont corrigeables dans l'aperçu (`PATCH /api/uploads/:id`, recalcul du chemin et des doublons après
  500 ms sans frappe). La correction n'est écrite que dans le catalogue, pas dans l'EPUB : si la base est reconstruite
  depuis les fichiers, les métadonnées d'origine reviennent. Réécrire l'OPF dans l'archive serait l'étape suivante si ça gêne.
- Limite : 300 Mo par fichier, un fichier par requête (le front envoie les fichiers un par un).

## Étape 7 — Docker (fait le 2026-11-21)

- `npm run build -w server` compile `src/` vers `server/dist/` (`tsconfig.build.json`) ; `npm start -w server` lance
  `node dist/main.js`. Le défaut de `WEB_DIR` (`../../web/dist` depuis `config.js`) reste valable depuis `dist/`.
- `Dockerfile` en trois étapes (build, deps de prod, runtime `node:22-bookworm-slim` + binaire rclone officiel),
  `compose.yaml` + `.env.example` : volumes `./data:/data`, `./books:/books`, `~/.config/rclone:/config/rclone:ro`
  (`RCLONE_CONFIG` pointe dessus). Procédure dans `README.md`.
- Non testé sur le serveur cible : seulement `docker build` + `docker run` ici (WSL). Le conteneur tourne en `node` (uid 1000) :
  si `./data`/`./books` sont créés par root sur l'hôte, les passer en `chown 1000:1000`.

## Refonte UI/UX (2026-11-21)

- En-tête : logo + nav (Auteurs, Ajouter) + indicateur de synchro en pastille (détails et bouton dans un popover).
- Catalogue : étagère « Ajoutés récemment » sur l'accueil, « Afficher plus » à la place des pages (`page=N` dans l'URL
  signifie « pages 1 à N affichées », rechargées en parallèle), puces de filtres actifs, filtres repliés sur mobile,
  squelettes de chargement, placeholder de couverture coloré par titre, raccourci `/` vers la recherche.
- Fiche livre : résumé replié au-delà de 600 caractères, étagère « Aussi de <auteur> », mise en page mobile compacte.
- Page `/authors` : index A–Z avec filtre, construit sur `/api/facets`.
- Page d'ajout : glisser-déposer. Favicon SVG, titre d'onglet par page.
- Pas de test de composants (pas de Testing Library, décision maintenue) ; vérifié par captures Chrome headless
  (`chrome.exe --headless=new --screenshot`, voir `data/shots/` localement). Attention : `@fastify/static` en
  `wildcard: false` n'apprend les fichiers qu'au démarrage → redémarrer le serveur après chaque `npm run build -w web`.
- Donnée à nettoyer un jour : la table `authors` est unique sans casse mais avec accents (« Agnès Martin-Lugand » et
  « Agnes Martin-lugand » coexistent) ; fusionner sur `toSortKey` serait une migration.

## Panneau admin — lot 1, étape 1 : comptes et sessions (fait le 2026-11-21)

- Décisions : login obligatoire pour tout le monde, appli exposée sur Internet, HTTPS par Caddy (`Caddyfile`, service
  `caddy` du compose ; le port 3000 n'est plus publié sur l'hôte).
- Migration 4 : `users` (hash scrypt, rôle `admin`/`member`) et `sessions` (SHA-256 du jeton, 30 jours d'inactivité).
- `server/src/auth/` (service, mots de passe) et `server/src/api/auth-routes.ts` : un hook exige une session sur tout
  `/api/*` (sauf login/logout) et le rôle admin sur `/api/admin/*` ; refus des écritures dont l'`Origin` n'est pas le
  nôtre ; 5 échecs de connexion par IP ou par compte = 15 min de blocage (en mémoire).
- Routes : `/api/auth/login|logout|me|password`, `/api/admin/users` (liste, création, réinitialisation, suppression).
- Front : page de connexion, `/account` (mot de passe, déconnexion), `/admin/users`.
- `buildApp` sans `auth` laisse tout ouvert : réservé aux tests du catalogue, `main.ts` le passe toujours.

## Panneau admin — lot 1, étapes 2 à 4 (fait le 2026-11-21)

- **Journal d'activité** (migration 5, `server/src/activity/activity-log.ts`) : compte, IP, user-agent, action, livre,
  détails JSON (le titre y est copié pour survivre à la suppression du livre). Actions : connexions (réussies, échouées
  avec le nom tenté), déconnexion, mots de passe, comptes, téléchargement, uploads (direct, soumis, validé, refusé,
  annulé), synchro lancée. `GET /api/admin/activity` (filtres `action`, `username`, pagination). Purge au démarrage puis
  chaque jour au-delà de `ACTIVITY_RETENTION_DAYS` (365 par défaut).
- **Validation des uploads** (migration 6, table `upload_submissions`) : un admin confirme directement
  (`POST /api/uploads/:id/confirm`, 403 pour un membre) ; un membre soumet (`POST /api/uploads/:id/submit`) et le fichier
  attend dans `DATA_DIR/uploads/`. L'admin corrige, valide (même route `confirm`) ou refuse avec motif
  (`POST /api/admin/uploads/:id/reject`). Les envois soumis survivent au redémarrage, pas les brouillons (1 h).
  Un membre ne voit que ses envois (`GET /api/uploads/mine`) et ne peut pas en tenir plus de 10 à la fois.
- **Santé** (`server/src/admin/library-health.ts`, `GET /api/admin/health`) : fichiers illisibles, fiches sans
  couverture/langue/résumé, auteurs en double probable (`authorIdentityKey` : ordre des mots, casse, accents, initiales),
  20 dernières synchros. Sur la vraie base : 702 livres, 1 fichier illisible, 170 fiches incomplètes, 55 groupes d'auteurs.
- Front : `/admin` (onglets Activité, Envois à valider, Santé, Utilisateurs), pastille du nombre d'envois en attente,
  « Mes envois » sur la page d'ajout des membres.
- Non fait : aucune vérification visuelle dans un navigateur, `docker compose up` avec Caddy jamais lancé.

## Panneau admin — séries, édition, fusion d'auteurs, suppression (fait le 2026-11-21)

- **Séries** (migration 7 : `books.series`, `series_index`, `series_checked`) : lues dans `calibre:series` /
  `calibre:series_index` et `belongs-to-collection` / `group-position` (`server/src/epub/opf.ts`). Les livres déjà
  indexés sont rattrapés à la synchro suivante sans toucher au reste de leur fiche. `GET /api/books?series=…` liste les
  tomes dans l'ordre ; le nom de la série est cherchable. Sur la vraie base : 59 livres sur 702 ont une série (41 séries),
  avec du bruit (« L'assasin royal » / « L'assassin royal », « . », « Epub commercial ») à corriger à la main.
- **Corrections durables** (table `book_overrides`, clé = `content_hash`) : `PATCH /api/admin/books/:id` (titre, auteurs,
  série, tome) écrit la correction et met la fiche à jour ; `saveBook` la réapplique à chaque indexation, même si le
  fichier a bougé. Les corrections faites à l'upload y sont aussi enregistrées (la limite notée plus haut est levée).
  Le fichier EPUB et son nom ne sont pas modifiés.
- **Fusion d'auteurs** : `POST /api/admin/authors/merge` `{from, into}` = une correction par livre concerné ; boutons
  « Tout regrouper sous » dans Admin → Santé. `into` peut être un nouveau nom (renommage).
- **Suppression** : `DELETE /api/admin/books/:id` déplace le fichier vers `RCLONE_TRASH` (défaut : `_corbeille` à côté de
  la bibliothèque, soit `mega:_corbeille`) par `rclone moveto`, puis retire la copie locale et la fiche. Sans remote, le
  fichier va dans `DATA_DIR/trash/`. Si rclone échoue, rien ne change. Jamais lancé contre le vrai MEGA.
- Front : fiche livre (série, étagère « Série », panneau « Administration » pour les admins), filtre `?series=`.

## Panneau admin — livres manquants (fait le 2026-11-21)

- Admin → Livres manquants. On **suit** un auteur de la bibliothèque : recherche du nom sur Wikidata, choix de la bonne
  personne (homonymes), puis récupération de sa bibliographie. Tables `followed_authors` et `author_works` (migration 8).
- Sources (`server/src/missing/bibliography-sources.ts`) : **API Action de Wikidata** (`haswbstatement:P50=…` puis
  `wbgetentities`), qui donne titres français, séries (P179) et numéros (P1545) ; on écarte éditions, items de série,
  nouvelles, poèmes, listes. **Open Library** (`search.json?author_key=…`, clé lue dans P648) complète avec les œuvres
  d'au moins 5 éditions que Wikidata n'a pas — bruité, étiqueté comme tel. Le service de requêtes SPARQL de Wikidata est
  à éviter : il a bloqué ce poste 1000 s après trois requêtes. Une requête à la fois par hôte, 300 ms d'écart.
- Rapprochement par titre (`title-key.ts`), côté bibliothèque volontairement strict : titre entier, ou ce qui suit un
  numéro de tome (« L'Assassin Royal-10-Serments et Deuils », « Dune, 03. Les enfants de Dune »). Les auteurs sont
  rapprochés par `authorIdentityKey`, donc les variantes non fusionnées comptent. Boutons « Je l'ai déjà » / « Ignorer »,
  conservés à l'actualisation.
- Essai réel sur une copie de la base : Robin Hobb 88 œuvres, 16 reconnues ; Frank Herbert 69 œuvres, 18 reconnues.
  Limites vues : les livres co-signés mal saisis (« Herbert,Frank-Ransom,Bill ») ne sont pas rattachés ; Wikidata
  liste à la fois le volume original et chaque tome du découpage français (doublons à ignorer à la main).
- **Trous dans les séries** : calculés localement sur `books.series` / `series_index` (séries de plus de 60 tomes
  ignorées). Sur la vraie base, beaucoup de faux trous viennent de numéros de série faux dans les EPUB.

## Panneau admin — demandes de livres et tableau de bord (fait le 2026-11-21)

- **Demandes** (migration 9, `server/src/requests/book-requests.ts`, page `/requests` ouverte à tous) : titre, auteur
  et précision facultatifs ; tout le monde voit toutes les demandes ; refus d'un doublon (même titre et auteur
  normalisés) ; 30 demandes ouvertes au plus par membre. Une demande passe à « ajouté » toute seule dès qu'un livre de
  même titre (et même auteur si précisé) est dans la bibliothèque, qu'il arrive par upload ou par synchro
  (`closeFulfilled`, appelé à chaque lecture de la liste). Bouton « À trouver » sur chaque œuvre manquante.
- **Tableau de bord** (`server/src/admin/library-stats.ts`, `GET /api/admin/stats`, page d'accueil de `/admin`) :
  tuiles (livres, auteurs, téléchargements sur 30 jours, jamais téléchargés, envois à valider, demandes, fichiers
  illisibles, comptes), ajouts par mois sur 12 mois, livres les plus téléchargés, téléchargements par compte, langues.
  Les téléchargements viennent du journal d'activité, donc limités à sa durée de conservation. L'activité est passée
  à `/admin/activity`. Couleur des graphiques : `--color-chart`, validée avec le script du skill dataviz.
- Le plan du panneau admin est terminé. Reste hors plan : nom de domaine et HTTPS réel, vérification visuelle de
  toutes les pages, essai de la suppression contre le vrai MEGA.

## Qualité des fiches (fait le 2026-11-21)

- Page « Santé » : livres sans auteur (ou « Unknown ») avec l'auteur lu dans le dossier du fichier
  (`authorFromFilePath`), livres en double probable (même `titleKey` + un auteur en commun), séries à renseigner,
  livres sans langue à classer en lot (`POST /api/admin/books/language`, gardé dans `book_overrides.language`).
- Séries : `seriesFromTitle` lit série, tome et titre propre dans les titres (64 livres sur 702 sur les vraies
  données) ; les œuvres Wikidata des auteurs suivis servent de repli. `GET /api/admin/series-suggestions`.
- Langues : `fre`/`fra`/`eng`… ramenés au code à deux lettres, `und` = pas de langue (migration 10 + indexeur).
- Résumés automatiques abandonnés : Open Library en a pour 2 livres sur 14 testés, aucun en français ; Google Books
  répond 429 sans clé d'API. À reprendre seulement avec une clé Google Books.
- Vérifié dans Chrome headless sur une copie de la base, via un proxy de test qui ajoute le cookie de session.
- Reste : envoi vers Kindle (attend un compte SMTP), couvertures manquantes (10 livres).

## Genres, PWA, sauvegardes, réparations (2026-11-22)

- **Genres** : `dc:subject` → étagères fixes (`server/src/library/genres.ts`, synonymes + tests). Tables `genres` /
  `book_genres`, colonne `books.genres_checked` pour le rattrapage à l'indexation (comme `series_checked`). Filtre
  `genre` sur `/api/books`, facette `genres`, puces sur la fiche, étagères par genre sur l'accueil (≥ 6 livres, 4 max).
  État : 323 livres sur 712 ont un genre ; les autres n'ont pas de sujets exploitables dans l'EPUB.
- **PWA** : `web/public/manifest.webmanifest` + icônes 192/512 (rendues avec Chrome headless depuis `data/shots/icon.html`).
- **Sauvegarde** : `server/src/backup/` — copie SQLite quotidienne (`BACKUP_CRON`, `BACKUP_KEEP`), miroir rclone vers
  `<remote>:_sauvegardes`, `npm run backup -w server` à la demande. Restauration décrite dans le README.
- **Réparations de fichiers** (scripts jetables, pas dans le dépôt) : `LE_BAL` de Némirovsky avait une entrée zip
  `OPS/../cover.jpg` refusée par yauzl → réécrit sans cette entrée ; les deux EPUB de `_À identifier` ont reçu
  titre/auteur dans leur OPF (Valentin Gendrot, *Flic* ; Jean-Pierre Levain, *Les femmes ne plaisantent pas avec
  l'amour*) puis ont été rangés. **Incident** : le rangement a écrasé un autre *Le Bal* déjà présent au chemin cible
  (71 050 o, hash `903ad96b…`), parce que `apply-layout-plan` ne vérifiait pas l'existence de la cible — corrigé
  (refus d'écraser, en local comme sur MEGA ; le plan garde le nom du fichier déjà en place). Le fichier écrasé est
  probablement dans la corbeille MEGA ; il reste un *Le Bal* (édition réparée, avec couverture).

## Plus tard

- Phase 2 : demandes de livres (formulaire, liste, statut) — intégrée au plan du panneau admin ci-dessus.
- Thème clair à vérifier visuellement (les captures headless sortent en sombre).
- Réécrire l'OPF dans l'EPUB quand titre/auteurs sont corrigés à l'upload (aujourd'hui la correction ne vit que dans la base).
