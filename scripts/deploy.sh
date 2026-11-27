#!/usr/bin/env bash
# Ships the committed code to the NAS over SSH, then rebuilds and restarts the container there.
# data/, books/, rclone/ and .env on the NAS are not tracked by git, so a deploy never touches them.
#
# Settings come from the environment or from deploy.env at the repo root (git-ignored):
#   DEPLOY_HOST  SSH target, e.g. user@192.168.1.10 (required)
#   DEPLOY_DIR   project folder on the NAS (default /volume1/docker/kyle-lib)
#   DEPLOY_PORT  port the catalog listens on, used for the final check (default 3000)
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f deploy.env ]]; then
  # shellcheck source=/dev/null
  source deploy.env
fi

: "${DEPLOY_HOST:?set DEPLOY_HOST (e.g. user@192.168.1.10) in deploy.env or the environment}"
deploy_dir="${DEPLOY_DIR:-/volume1/docker/kyle-lib}"
deploy_port="${DEPLOY_PORT:-3000}"
app_url="http://${DEPLOY_HOST#*@}:${deploy_port}/"
archive="/tmp/kyle-lib-deploy.tar"

# Deploying uncommitted work would leave the NAS running code that exists nowhere else.
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Uncommitted changes: commit or stash them before deploying." >&2
  git status --short --untracked-files=no >&2
  exit 1
fi

commit="$(git rev-parse --short HEAD)"
echo "Deploying ${commit} ($(git log -1 --format=%s)) to ${DEPLOY_HOST}:${deploy_dir}"

git archive --format=tar HEAD | ssh "$DEPLOY_HOST" "cat > '${archive}'"

# One terminal session so sudo asks for the password once. Rebuilding restarts the container, which would cut
# short whatever rclone is doing (sync, upload push, backup), so the files are only replaced when it is idle.
# sudo's secure_path leaves out /usr/local/bin, where Synology's Container Manager installs docker.
ssh -t "$DEPLOY_HOST" "
  set -e
  cd '${deploy_dir}'
  docker_bin=\$(command -v docker || echo /usr/local/bin/docker)
  if [ ! -x \"\$docker_bin\" ]; then
    rm -f '${archive}'
    echo 'docker not found on the NAS (looked in PATH and /usr/local/bin).' >&2
    exit 2
  fi
  if sudo \"\$docker_bin\" compose exec -T kyle-lib sh -c 'grep -qx rclone /proc/[0-9]*/comm' 2>/dev/null; then
    rm -f '${archive}'
    echo 'rclone is running in the container (sync, upload or backup): try again once it has finished.' >&2
    exit 3
  fi
  tar -xf '${archive}' && rm -f '${archive}'
  printf '%s\n' '${commit}' > .deployed-commit
  sudo \"\$docker_bin\" compose up -d --build
"

echo "Waiting for the catalog to answer on ${app_url}"
for _ in $(seq 1 30); do
  if curl --silent --fail --max-time 5 --output /dev/null "$app_url"; then
    echo "Deployed ${commit}: the catalog is up."
    exit 0
  fi
  sleep 2
done
echo "The catalog did not answer within 60 s. Check: ssh -t ${DEPLOY_HOST} 'cd ${deploy_dir} && sudo docker compose logs --tail 30 kyle-lib'" >&2
exit 1
