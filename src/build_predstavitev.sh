#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Gradim Reveal.js predstavitev..."
Rscript -e 'rmarkdown::render("predstavitev.Rmd", quiet = TRUE)'

echo "Izvažam PDF..."
node vaje/scripts/export-presentation-pdf.mjs

echo "Ustvarjena sta predstavitev.html in predstavitev.pdf."
