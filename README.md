# Promemoria Aziendali

Sistema web completo per la gestione di eventi e promemoria dei collaboratori aziendali.

## Funzionalità

- **Autenticazione JWT** con ruoli admin/utente
- **Dashboard** con statistiche e grafici
- **Calendario** mensile, settimanale e giornaliero
- **CRUD eventi** con filtri e ricerca
- **Promemoria email automatici** via cron job (ogni minuto)
- **Template email HTML** professionali
- **Gestione utenti** (admin)
- **Log attività** utenti
- **Storico email** inviate
- **Esportazione Excel**
- **Backup database** JSON
- **Tema chiaro/scuro**
- **Notifiche interne**
- **Responsive** mobile/desktop

## Stack tecnologico

| Layer | Tecnologie |
|-------|-----------|
| Frontend | React 18, TypeScript, Material UI 5, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT + bcrypt |
| Email | Nodemailer |
| Scheduler | node-cron |
| Container | Docker + docker-compose |

## Struttura progetto

```
promemoria-aziendali/
├── backend/
│   ├── src/
│   │   ├── config/          # database.ts
│   │   ├── controllers/     # auth, events, users, notifications, stats
│   │   ├── middleware/      # auth JWT, logger, error handler, activity log
│   │   ├── models/          # migrate.ts, seed.ts
│   │   ├── routes/          # auth, events, users, notifications, stats, activity, backup
│   │   ├── services/        # emailService, schedulerService, exportService
│   │   ├── utils/           # logger (winston)
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, EventDialog, StatCard
│   │   ├── pages/           # Login, Dashboard, Events, Calendar, Users,
│   │   │                    # Notifications, Activity, EmailLogs, Profile
│   │   ├── services/        # api.ts (axios)
│   │   ├── store/           # AuthContext, ThemeContext
│   │   ├── types/           # index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── install.sh           # Linux/macOS
│   └── install.ps1          # Windows
├── docker-compose.yml
├── .env.example
└── README.md
```

## Database — Schema

```sql
users           -- Utenti del sistema
events          -- Eventi/promemoria
email_logs      -- Storico email inviate
activity_logs   -- Log attività utenti
notifications   -- Notifiche interne
```

## Installazione rapida

### Prerequisiti
- Node.js >= 18
- PostgreSQL 16
- npm

### 1. Clona/copia il progetto

### 2. Configura l'ambiente

```bash
cp .env.example backend/.env
# Modifica backend/.env con le tue credenziali
```

### 3. Installa e configura

**Linux/macOS:**
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1
```

**Manuale:**
```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run db:seed

# Frontend
cd ../frontend
npm install
```

### 4. Avvia l'applicazione

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Apri: **http://localhost:5173**

### Credenziali demo
| Ruolo | Username | Password |
|-------|----------|----------|
| Admin | admin | Admin@2024! |
| Utente | marco | User@2024! |

## Deploy con Docker

```bash
# 1. Crea il file .env nella root
cp .env.example .env
# Modifica .env con i tuoi valori

# 2. Build e avvio
docker-compose up -d

# 3. Prima esecuzione: migrazione e seed
docker-compose exec backend node dist/models/migrate.js
docker-compose exec backend node dist/models/seed.js
```

L'app sarà disponibile su **http://localhost**

## API REST

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Profilo corrente |
| PUT | /api/auth/change-password | Cambio password |
| GET | /api/events | Lista eventi (con filtri) |
| POST | /api/events | Crea evento |
| PUT | /api/events/:id | Modifica evento |
| DELETE | /api/events/:id | Elimina evento |
| GET | /api/events/upcoming | Eventi imminenti |
| GET | /api/events/export | Esporta Excel |
| GET | /api/users | Lista utenti (admin) |
| POST | /api/users | Crea utente (admin) |
| GET | /api/stats | Statistiche dashboard |
| GET | /api/notifications | Notifiche utente |
| GET | /api/notifications/email-logs | Log email (admin) |
| GET | /api/activity | Log attività (admin) |
| GET | /api/backup/download | Backup JSON (admin) |

## Configurazione email (SMTP)

Nel file `backend/.env`:

```env
# Gmail (usa App Password, non la password account)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tua@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx  # App Password Google
SMTP_FROM_NAME=Promemoria Aziendali
SMTP_FROM_EMAIL=tua@gmail.com
```

Per Gmail: abilita 2FA → Google Account → Sicurezza → App password

## Scheduler promemoria

Il cron job si avvia automaticamente con il backend e controlla ogni minuto se ci sono promemoria da inviare. Funziona anche senza utenti collegati.

Log scheduler visibili in `backend/logs/combined.log`.

## Sicurezza

- Password hashate con bcrypt (12 rounds)
- Token JWT con scadenza configurabile
- Rate limiting su tutte le API
- Helmet.js per header HTTP sicuri
- CORS configurato
- Validazione input
- Protezione SQL injection (query parametrizzate)
