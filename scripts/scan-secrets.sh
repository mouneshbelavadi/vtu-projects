#!/usr/bin/env bash
set -euo pipefail

if command -v gitleaks >/dev/null 2>&1; then
  echo "Running gitleaks detect on repository and git history..."
  gitleaks detect --source . --verbose --redact
  echo "Secret scan passed with zero leaks detected."
else
  echo "WARNING: gitleaks is not installed on this system."
  echo "To install gitleaks:"
  echo "  - macOS: brew install gitleaks"
  echo "  - Windows: winget install Gitleaks.Gitleaks or choco install gitleaks"
  echo "  - Linux: download binary from https://github.com/gitleaks/gitleaks/releases"
  echo "Continuing without secret scan in local environment."
  exit 0
fi
