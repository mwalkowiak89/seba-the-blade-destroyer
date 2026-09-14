#!/usr/bin/env bash
# Jedno polecenie do wrzutki na GitHub Pages: assets → build:prod → test → commit → push.
# Użycie: npm run deploy [-- "opis commita"]
set -euo pipefail
cd "$(dirname "$0")/.."
MSG="${1:-deploy: aktualizacja gry}"
npm run --silent assets
npm run --silent build:prod
npm test --silent >/dev/null && echo "smoke test OK"
if git status --porcelain | grep -q .; then
  git add -A
  git -c user.name="$(git config user.name || echo deck)" -c user.email="$(git config user.email || echo pickerr@gmail.com)" \
    commit -q -m "$MSG" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
fi
git push -q origin main
echo "OK → https://mwalkowiak89.github.io/seba-the-blade-destroyer/ (Pages odświeży się w ~1 min)"
