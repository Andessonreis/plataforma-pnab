#!/usr/bin/env bash
# Atualiza o staging direto na VPS, sem passar pelo GitHub Actions (não gasta minutos).
# Pré-requisito: a branch `dev` já está publicada no origin e no fork (a VPS lê do fork).
# Autenticação: chave SSH, ou senha na variável VPS_SSH_PASS (usa sshpass).
set -euo pipefail

HOST="${VPS_HOST:-76.13.169.180}"
USUARIO="${VPS_USER:-root}"
DIR="${VPS_STAGING_APP_DIR:-/opt/pnab-staging}"

ssh_cmd=(ssh -o ConnectTimeout=15 "$USUARIO@$HOST")
if [ -n "${VPS_SSH_PASS:-}" ]; then
  ssh_cmd=(sshpass -e "${ssh_cmd[@]}")
  export SSHPASS="$VPS_SSH_PASS"
fi

"${ssh_cmd[@]}" bash -s "$DIR" <<'REMOTO'
set -euo pipefail
cd "$1"
git fetch origin dev
git merge --ff-only origin/dev
docker network create pnab_pnab-network 2>/dev/null || true
docker compose -f docker-compose.staging.yml build
docker compose -f docker-compose.staging.yml run --rm app npx prisma db push --skip-generate || true
docker compose -f docker-compose.staging.yml up -d app
docker image prune -f >/dev/null
echo "Staging em: $(git log --oneline -1)"
REMOTO
