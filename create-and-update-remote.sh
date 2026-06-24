#!/usr/bin/env sh

set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
title_file="$root/TITLE"

if [ ! -s "$title_file" ]; then
  echo "TITLE is missing or empty." >&2
  echo "Write the presentation title to TITLE, then run this script again." >&2
  exit 1
fi

title=$(cat "$title_file")

cd "$root"
exec npm run create-deck -- --title "$title" "$@"
