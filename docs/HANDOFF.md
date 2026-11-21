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
  3. Rapport groupe par groupe avec une proposition de fichier à garder ; aucune modification sans ma validation.
     Déplacer les doublons dans un dossier `_doublons` sur MEGA plutôt que les supprimer (à faire : à partir du `--json`).
- Attention : le quota de transfert du compte MEGA gratuit limite la synchro complète.

## Plus tard

- Étape 7 : Dockerfile + compose (rclone dans l'image, build de prod du serveur au lieu de `tsx`).
- Phase 2 : demandes de livres (formulaire, liste, statut).
