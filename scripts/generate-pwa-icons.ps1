# Backwards-compatible entry point; all icons now share original SVG geometry.
node (Join-Path $PSScriptRoot 'generate-branding.cjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
