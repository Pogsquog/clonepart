#!/usr/bin/env bash
# Launch the original DOS Rampart in DOSBox for reference.
#
# Expects dos_version/Rampart_DOS_EN.zip (git-ignored; supply your own copy).
# Unpacks it on first run into dos_version/rampart/, then mounts that as C:.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dos_dir="$root/dos_version"
zip="$dos_dir/Rampart_DOS_EN.zip"
game_dir="$dos_dir/rampart"

dosbox_bin="${DOSBOX:-}"
if [[ -z "$dosbox_bin" ]]; then
  for candidate in dosbox-staging dosbox-x dosbox; do
    if command -v "$candidate" >/dev/null 2>&1; then
      dosbox_bin="$candidate"
      break
    fi
  done
fi
if [[ -z "$dosbox_bin" ]]; then
  echo "No DOSBox found. Install dosbox (or set DOSBOX=/path/to/binary)." >&2
  exit 1
fi

if [[ ! -f "$game_dir/RAMPART.EXE" ]]; then
  if [[ ! -f "$zip" ]]; then
    echo "Missing $zip - place your copy of the DOS release there." >&2
    exit 1
  fi
  echo "Unpacking $zip ..."
  unzip -q -o "$zip" -d "$dos_dir"
  if [[ ! -f "$game_dir/RAMPART.EXE" ]]; then
    echo "Unpacked, but $game_dir/RAMPART.EXE not found - check the archive layout." >&2
    exit 1
  fi
fi

exec "$dosbox_bin" \
  -c "mount c \"$game_dir\"" \
  -c "c:" \
  -c "cycles 6000" \
  -c "RAMPART.EXE" \
  -c "exit" \
  "$@"
