#!/usr/bin/env bash

set -euo pipefail

readonly cyan='\033[36m'
readonly green='\033[32m'
readonly yellow='\033[33m'
readonly bold='\033[1m'
readonly reset='\033[0m'
readonly rule='──────────────────────────────────────────────────────────────'

command_line() {
  printf '  %b%-14s%b %s\n' "$cyan" "$1" "$reset" "$2"
}

path_status() {
  local path="$1"

  if [[ -e "$path" ]]; then
    printf '%bready%b' "$green" "$reset"
  else
    printf '%bmissing%b' "$yellow" "$reset"
  fi
}

printf '\n%bGYM WEEK · local project helper%b\n%s\n' "$bold" "$reset" "$rule"

printf '\n%bStart developing%b\n' "$bold" "$reset"
command_line 'yarn dev' 'Build, then serve the Worker at http://localhost:8787.'
printf '  Edits under src/ rebuild automatically. Local dev uses a local copy of\n'
printf '  the GYM KV namespace (kept in .wrangler/), not production data.\n'

printf '\n%bBuild and ship%b\n' "$bold" "$reset"
command_line 'yarn build' 'Inline src/page/* into the Worker → dist/index.js.'
command_line 'yarn deploy' 'Build and deploy to Cloudflare.'
printf '  Live: %bhttps://gym-week.jakeforaker83.workers.dev%b\n' "$cyan" "$reset"

printf '\n%bLocal setup%b\n' "$bold" "$reset"
printf '  node_modules  %b\n' "$(path_status 'node_modules')"
if [[ ! -e node_modules ]]; then
  printf '  Run `yarn install` to install Wrangler.\n'
fi
printf '  dist/         %b\n' "$(path_status 'dist/index.js')"
if [[ ! -e dist/index.js ]]; then
  printf '  Run `yarn build` (yarn dev and yarn deploy also build first).\n'
fi

printf '\n%s\nTip: run %byarn helper%b whenever you return to this project.\n\n' "$rule" "$cyan" "$reset"
