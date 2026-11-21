# kyle-lib

Catalogue web d'EPUB pour deux personnes : recherche, filtres, téléchargement, ajout de livres avec détection des
doublons. La bibliothèque vit sur MEGA ; l'appli en garde un miroir local via rclone et n'y touche jamais directement.

## Lancer en production (Docker)

Prérequis sur le serveur : Docker avec le plugin compose, et un remote rclone configuré (`rclone config`, mot de passe
MEGA saisi par vous ; le fichier `~/.config/rclone/rclone.conf` est monté en lecture seule dans le conteneur).

```sh
cp .env.example .env      # RCLONE_REMOTE=mega:Library, port, cron
docker compose up -d --build
```

L'appli écoute sur `http://<serveur>:3000`. Au premier démarrage, lancer une synchro depuis l'en-tête (ou attendre le
cron) pour remplir `./books` et l'index. `./data` contient la base SQLite, les couvertures et la zone de transit des
uploads : à sauvegarder si l'on tient aux corrections de métadonnées faites depuis l'appli.

| Variable        | Rôle                                                        | Défaut (image)            |
|-----------------|-------------------------------------------------------------|---------------------------|
| `RCLONE_REMOTE` | Source rclone miroirée dans `/books` (seuls les `.epub`)    | vide : pas de synchro     |
| `SYNC_CRON`     | Cron des synchros automatiques, `off` pour désactiver       | `0 4 * * *`               |
| `PORT`          | Port publié sur l'hôte (compose)                            | `3000`                    |
| `HOST`          | Interface d'écoute                                          | `0.0.0.0` dans l'image    |

Mise à jour : `git pull && docker compose up -d --build`.

## Développer

```sh
npm install
npm run dev -w server      # API sur :3000 (tsx watch)
npm run dev -w web         # Vite sur :5173, proxy /api vers :3000
npm test && npm run typecheck
```

Variables utiles en dev : `BOOKS_DIR` (défaut `books`), `DATA_DIR` (défaut `data`), `RCLONE_REMOTE`, `SYNC_CRON=off`.
Pour servir le front depuis Fastify en dev (`npm run build -w web` puis le serveur seul), redémarrer le serveur après
chaque build : les fichiers statiques sont enregistrés au démarrage.
Sans `RCLONE_REMOTE`, les uploads restent locaux. Outils ponctuels : `npm run index -w server`,
`npm run duplicates -w server -- <dossier>`, `npm run plan-layout -w server -- …` (voir `docs/HANDOFF.md`).
