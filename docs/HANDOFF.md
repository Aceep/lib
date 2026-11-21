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
- Restes à trier à la main : `Books/_À identifier/` (2 EPUB sans métadonnées), les ~600 fichiers `.jpg`/`.opf`
  (fiches Calibre) toujours sous leurs anciens noms dans `Books/`, inutiles pour l'appli.
- Rappel : la barre de recherche de l'appli lit titre/auteurs/description des métadonnées, pas les noms de fichiers.
- Bug repéré à corriger : le lecteur OPF ne décode pas les entités HTML (`Tr&#xE9;vidic`), ce qui pollue la recherche.
  `decodeEntities` dans `file-naming.ts` est un palliatif local au nommage ; la vraie correction est dans `server/src/epub/opf.ts`.

- `rclone sync mega:Library books/` signale `Graphics/Invincible intégrale` et `Graphics/zzImpénétrable` en
  « Duplicate directory found in source » (deux dossiers de même nom sur MEGA) : sans effet sur les EPUB, à nettoyer
  dans l'interface MEGA si ça gêne.
- Au passage : `Books/I/Nemirovsky Irene/IRENE_NEMIROVSKY__LE_BAL.epub` est refusé par notre lecteur zip
  (`invalid relative path: OPS/../cover.jpg`) ; l'indexeur l'ignorera aussi. À voir si on assouplit ou si on répare le fichier.
- Attention : le quota de transfert du compte MEGA gratuit limite la synchro complète.

## Plus tard

- Étape 7 : Dockerfile + compose (rclone dans l'image, build de prod du serveur au lieu de `tsx`).
- Phase 2 : demandes de livres (formulaire, liste, statut).
