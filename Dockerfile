# syntax=docker/dockerfile:1

# ---- Build: compile the server and bundle the web app -----------------------------------------
FROM node:22-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci
COPY tsconfig.base.json ./
COPY server/ server/
COPY web/ web/
RUN npm run build -w server && npm run build -w web

# ---- Production dependencies only (better-sqlite3 needs a compiler, hence the full image) ------
FROM node:22-bookworm AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --omit=dev

# ---- Runtime: node + rclone, nothing else ------------------------------------------------------
FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl unzip \
  && curl -fsSL https://downloads.rclone.org/rclone-current-linux-amd64.zip -o /tmp/rclone.zip \
  && unzip -q -j /tmp/rclone.zip '*/rclone' -d /usr/local/bin \
  && chmod 755 /usr/local/bin/rclone \
  && apt-get purge -y curl unzip && apt-get autoremove -y && rm -rf /var/lib/apt/lists/* /tmp/rclone.zip

WORKDIR /app
# npm workspaces hoist every dependency into the root node_modules.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server/package.json ./server/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/web/dist ./web/dist

# Data, books and the rclone config are volumes (see compose.yaml).
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    BOOKS_DIR=/books \
    DATA_DIR=/data \
    WEB_DIR=/app/web/dist \
    RCLONE_CONFIG=/config/rclone/rclone.conf
RUN mkdir -p /books /data /config/rclone && chown -R node:node /books /data /config
USER node
EXPOSE 3000
VOLUME ["/books", "/data"]
CMD ["node", "server/dist/main.js"]
