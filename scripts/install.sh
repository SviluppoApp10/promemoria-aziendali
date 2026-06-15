#!/bin/bash
set -e

echo "============================================"
echo "  PROMEMORIA AZIENDALI — Installazione"
echo "============================================"
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "ERRORE: Node.js non trovato. Installalo da https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERRORE: Node.js >= 18 richiesto (trovato: v$NODE_VERSION)"
    exit 1
fi

# Verifica PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "ATTENZIONE: psql non trovato. Assicurati che PostgreSQL sia in esecuzione."
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/5] Configurazione ambiente..."
if [ ! -f "$ROOT_DIR/.env" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/backend/.env"
    echo "  → Creato backend/.env da .env.example"
    echo "  → IMPORTANTE: modifica backend/.env con le tue credenziali!"
else
    echo "  → .env già esistente"
fi

echo ""
echo "[2/5] Installazione dipendenze backend..."
cd "$ROOT_DIR/backend"
npm install

echo ""
echo "[3/5] Installazione dipendenze frontend..."
cd "$ROOT_DIR/frontend"
npm install

echo ""
echo "[4/5] Migrazione database..."
cd "$ROOT_DIR/backend"
npm run db:migrate

echo ""
echo "[5/5] Seed dati iniziali..."
npm run db:seed

echo ""
echo "============================================"
echo "  Installazione completata!"
echo "============================================"
echo ""
echo "Per avviare l'applicazione:"
echo ""
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Credenziali demo:"
echo "  Admin:    admin / Admin@2024!"
echo "  Utente:   marco / User@2024!"
echo ""
echo "URL: http://localhost:5173"
echo ""
