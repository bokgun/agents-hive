#!/bin/bash
# ============================================================================
# agents-hive installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/user/agents-hive/main/install.sh | bash
#
# Or clone and run:
#   git clone https://github.com/user/agents-hive.git
#   cd agents-hive && ./install.sh
# ============================================================================

set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; NC='\033[0m'; DIM='\033[2m'

REPO_URL="https://github.com/user/agents-hive"

echo -e "${CYAN}"
cat << 'LOGO'
    _                    _          _   _ _
   / \   __ _  ___ _ __ | |_ ___   | | | (_)_   _____
  / _ \ / _` |/ _ \ '_ \| __/ __|  | |_| | \ \ / / _ \
 / ___ \ (_| |  __/ | | | |_\__ \  |  _  | |\ V /  __/
/_/   \_\__, |\___|_| |_|\__|___/  |_| |_|_| \_/ \___|
        |___/
LOGO
echo -e "${NC}"

echo -e "Installing agents-hive..."
echo ""

# --- Check dependencies ---
MISSING=()
command -v git &>/dev/null || MISSING+=("git")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${RED}[!]${NC} Missing dependencies: ${MISSING[*]}"
  echo ""
  echo "  Install them first:"
  echo "    macOS:  brew install ${MISSING[*]}"
  echo "    Ubuntu: sudo apt install ${MISSING[*]}"
  exit 1
fi

# --- Check bun ---
if ! command -v bun &>/dev/null; then
  echo -e "${YELLOW}[!]${NC} bun is not installed."
  echo ""
  echo "  Install bun first:"
  echo -e "  ${CYAN}curl -fsSL https://bun.sh/install | bash${NC}"
  exit 1
fi

# --- Check at least one agent CLI ---
HAS_AGENT=0
command -v claude &>/dev/null && HAS_AGENT=1
command -v gemini &>/dev/null && HAS_AGENT=1
command -v codex &>/dev/null  && HAS_AGENT=1

if [ "$HAS_AGENT" -eq 0 ]; then
  echo -e "${YELLOW}[!]${NC} No agent CLI found. Install at least one:"
  echo ""
  echo "  Claude Code: npm install -g @anthropic-ai/claude-code"
  echo "  Codex CLI:   npm install -g @openai/codex"
  echo "  Gemini CLI:  npm install -g @anthropic-ai/gemini-cli  (or via Google)"
  echo ""
  echo -e "${DIM}Continuing anyway — you can install agents later.${NC}"
  echo ""
fi

# --- Install ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/package.json" ]; then
  # Running from cloned repo
  cd "$SCRIPT_DIR"
  echo "Installing dependencies..."
  bun install
  echo "Building..."
  bun run build
  echo "Linking globally..."
  bun link
else
  # Clone and install
  CLONE_DIR="${HIVE_INSTALL_DIR:-$HOME/.agents-hive}"
  echo "Cloning from $REPO_URL..."
  git clone "$REPO_URL" "$CLONE_DIR"
  cd "$CLONE_DIR"
  bun install
  bun run build
  bun link
fi

# --- Done ---
echo ""
echo -e "${GREEN}[✓]${NC} Installed: ${CYAN}hive${NC}"
echo ""
echo -e "  Get started:"
echo -e "  ${CYAN}hive init${NC}                                Initialize workspace"
echo -e "  ${CYAN}hive project create my-app claude \"desc\"${NC}  Create a project"
echo -e "  ${CYAN}hive help${NC}                                Show all commands"
echo ""
echo -e "  ${DIM}Docs: $REPO_URL${NC}"
