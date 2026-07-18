#!/usr/bin/env bash
# pre-push-audit.sh
# Audit rapide avant "git push" ou deploiement (Render, etc.)

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES=0

section () {
  echo ""
  echo "==================================================================="
  echo "  $1"
  echo "==================================================================="
}

ok () { echo -e "${GREEN}[OK]${NC} $1"; }
warn () { echo -e "${YELLOW}[ATTENTION]${NC} $1"; ISSUES=$((ISSUES+1)); }
fail () { echo -e "${RED}[PROBLEME]${NC} $1"; ISSUES=$((ISSUES+1)); }

if [ ! -d ".git" ]; then
  fail "Ce dossier n'est pas encore un depot git (pas de .git/). Lance 'git init' d'abord."
fi

section "1. Fichiers sensibles trackes par git"

SENSITIVE_PATTERNS=(".env" ".env.production" "db.sqlite3" "*.pem" "*.key" "id_rsa")
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  tracked=$(git ls-files | grep -F "$pattern" 2>/dev/null || true)
  if [ -n "$tracked" ]; then
    fail "Fichier(s) sensible(s) traque(s) par git correspondant a '$pattern' :"
    echo "$tracked" | sed 's/^/    /'
  else
    ok "Aucun fichier tracke ne correspond a '$pattern'"
  fi
done

section "2. Recherche de secrets dans les fichiers traques"

PATTERNS_REGEX='(SECRET_KEY|API_KEY|PASSWORD|GEMINI_API_KEY|OPENROUTER_API_KEY|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{20,})\s*=\s*[^=\s]{6,}'
found_secrets=$(git ls-files -z | xargs -0 grep -EnH "$PATTERNS_REGEX" 2>/dev/null | grep -v -E '\.example|\.sample|CHANGE_ME|change-me|your_key_here|xxx|placeholder' || true)

if [ -n "$found_secrets" ]; then
  fail "Valeurs ressemblant a des secrets trouvees dans des fichiers traques :"
  echo "$found_secrets" | sed 's/^/    /'
else
  ok "Aucun secret evident trouve dans les fichiers traques par git"
fi

section "3. Verification du .gitignore"

REQUIRED_IGNORES=(".env" "venv" "__pycache__" "node_modules" "dist" "db.sqlite3" "media" "staticfiles" "*.pyc")
if [ -f ".gitignore" ]; then
  for entry in "${REQUIRED_IGNORES[@]}"; do
    if grep -qF "$entry" .gitignore; then
      ok ".gitignore contient '$entry'"
    else
      warn ".gitignore ne contient pas explicitement '$entry' — verifie qu'il est bien ignore autrement"
    fi
  done
else
  fail "Aucun fichier .gitignore trouve a la racine"
fi

section "4. Fichiers volumineux (>5 Mo) traques par git"

big_files=$(git ls-files -z 2>/dev/null | xargs -0 du -h 2>/dev/null | awk '$1 ~ /[0-9]+M/ { if ($1+0 > 5) print }' || true)
if [ -n "$big_files" ]; then
  warn "Fichiers volumineux traques (verifie s'ils devraient etre ignores) :"
  echo "$big_files" | sed 's/^/    /'
else
  ok "Aucun fichier volumineux suspect detecte parmi les fichiers traques"
fi

section "5. Backend Django"

if [ -d "backend" ]; then
  if [ -f "backend/manage.py" ]; then
    ok "backend/manage.py present"
    (
      cd backend || exit 1
      if [ -d "venv" ]; then
        source venv/bin/activate 2>/dev/null
      fi
      echo "  -> python manage.py check"
      python manage.py check 2>&1 | sed 's/^/    /'
      echo "  -> python manage.py check --deploy (avertissements prod)"
      python manage.py check --deploy 2>&1 | sed 's/^/    /'
      echo "  -> python manage.py makemigrations --check --dry-run (migrations manquantes ?)"
      python manage.py makemigrations --check --dry-run 2>&1 | sed 's/^/    /'
    )
  else
    fail "backend/manage.py introuvable"
  fi

  if [ -f "backend/requirements.txt" ]; then
    ok "backend/requirements.txt present"
  else
    fail "backend/requirements.txt introuvable"
  fi

  if [ -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
    keys_env=$(grep -oE '^[A-Z_]+=' backend/.env | sort -u)
    keys_example=$(grep -oE '^[A-Z_]+=' backend/.env.example | sort -u)
    missing_in_example=$(comm -23 <(echo "$keys_env") <(echo "$keys_example"))
    if [ -n "$missing_in_example" ]; then
      warn "Variables presentes dans .env mais absentes de .env.example (a ajouter, sans les vraies valeurs) :"
      echo "$missing_in_example" | sed 's/^/    /'
    else
      ok ".env.example couvre les memes variables que .env"
    fi
  fi
else
  warn "Dossier backend/ introuvable a la racine"
fi

section "6. Frontend"

if [ -d "frontend" ]; then
  if [ -f "frontend/package.json" ] && [ -f "frontend/package-lock.json" ]; then
    ok "package.json et package-lock.json presents"
  else
    warn "package-lock.json manquant : les versions de dependances ne seront pas figees"
  fi

  if [ -d "frontend/node_modules" ]; then
    if git ls-files frontend/node_modules | grep -q .; then
      fail "frontend/node_modules semble traque par git (verifie .gitignore)"
    else
      ok "frontend/node_modules present localement mais non traque par git"
    fi
  fi

  if [ -d "frontend/dist" ]; then
    if git ls-files frontend/dist | grep -q .; then
      warn "frontend/dist (build) semble traque par git — a ignorer normalement"
    else
      ok "frontend/dist present localement mais non traque par git"
    fi
  fi
else
  warn "Dossier frontend/ introuvable a la racine"
fi

section "Resume"

if [ "$ISSUES" -eq 0 ]; then
  echo -e "${GREEN}Aucun probleme detecte. Pret pour un git add/commit/push.${NC}"
else
  echo -e "${YELLOW}$ISSUES point(s) a verifier avant de pousser sur GitHub ou de deployer.${NC}"
fi
