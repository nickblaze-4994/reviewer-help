#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Install Node.js 22 or newer, then reopen Start.command.'
  exit 1
fi
printf '%s\n' 'Open http://127.0.0.1:4173 in your browser. Keep this window open.'
export QC_MODEL="${QC_MODEL-qwen3.5:2b}"
exec node server.mjs
