# kyle-lib

Catalogue web d'EPUB pour deux personnes : recherche, filtres, téléchargement, ajout de livres avec détection des
doublons. La bibliothèque vit sur MEGA ; l'appli en garde un miroir local via rclone et n'y touche jamais directement.

## Lancer en production (Docker)

Prérequis sur le serveur : Docker avec le plugin compose, et un remote rclone configuré (`rclone config`, mot de passe
MEGA saisi par vous ; le fichier `~/.config/rclone/rclone.conf` est monté en lecture seule dans le conteneur).

```sh
cp .env.example .env      # RCLONE_REMOTE, SITE_ADDRESS, ADMIN_USER, ADMIN_PASSWORD, cron
docker compose up -d --build
```

L'appli n'est joignable qu'à travers Caddy, en HTTPS, sur `https://<SITE_ADDRESS>` (ports 80 et 443 de l'hôte). Avec un
vrai nom de domaine pointant sur le serveur, Caddy obtient et renouvelle seul le certificat ; avec `localhost`, il sert
un certificat auto-signé que le navigateur signale.

Tout passe par un compte. Le premier administrateur est créé au démarrage depuis `ADMIN_USER` / `ADMIN_PASSWORD`
(12 caractères minimum) tant qu'aucun compte n'existe ; retirer ensuite `ADMIN_PASSWORD` du `.env`. Les autres comptes
se créent dans Admin → Utilisateurs. Mot de passe admin perdu : supprimer les lignes de la table `users` dans
`data/library.sqlite` et redémarrer avec les deux variables.

Au premier démarrage, lancer une synchro depuis l'en-tête (ou attendre le
cron) pour remplir `./books` et l'index. `./data` contient la base SQLite, les couvertures et la zone de transit des
uploads : à sauvegarder si l'on tient aux corrections de métadonnées faites depuis l'appli.

| Variable        | Rôle                                                        | Défaut (image)            |
|-----------------|-------------------------------------------------------------|---------------------------|
| `RCLONE_REMOTE` | Source rclone miroirée dans `/books` (seuls les `.epub`)    | vide : pas de synchro     |
| `SYNC_CRON`     | Cron des synchros automatiques, `off` pour désactiver       | `0 4 * * *`               |
| `SITE_ADDRESS`  | Nom de domaine servi par Caddy (compose)                    | `localhost`               |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Premier compte admin, lu seulement sans aucun compte | aucun                  |
| `ACTIVITY_RETENTION_DAYS` | Durée de conservation du journal d'activité, en jours | `365`                    |
| `TRUST_PROXY`   | `true` derrière un proxy : IP et protocole lus dans `X-Forwarded-*` | `true` dans compose |
| `HOST`          | Interface d'écoute                                          | `0.0.0.0` dans l'image    |

Mise à jour : `git pull && docker compose up -d --build`.

## Développer

```sh
npm install
npm run dev -w server      # API sur :3000 (tsx watch)
npm run dev -w web         # Vite sur :5173, proxy /api vers :3000
npm test && npm run typecheck
```

En dev, créer le premier compte avec `ADMIN_USER=moi ADMIN_PASSWORD='douze caractères au moins' npm run dev -w server`
(une seule fois). Variables utiles en dev : `BOOKS_DIR` (défaut `books`), `DATA_DIR` (défaut `data`), `RCLONE_REMOTE`, `SYNC_CRON=off`.
Pour servir le front depuis Fastify en dev (`npm run build -w web` puis le serveur seul), redémarrer le serveur après
chaque build : les fichiers statiques sont enregistrés au démarrage.
Sans `RCLONE_REMOTE`, les uploads restent locaux. Outils ponctuels : `npm run index -w server`,
`npm run duplicates -w server -- <dossier>`, `npm run plan-layout -w server -- …` (voir `docs/HANDOFF.md`).
