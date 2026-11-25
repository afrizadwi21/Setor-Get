# Setor-Get

Fullstack application with **Next.js** (Frontend), **Golang Fiber** (Backend), and **PostgreSQL** (Database).

---

## 📁 Struktur Direktori

```text
Setor-Get/
├── frontend/             # Next.js (App Router, TypeScript, Tailwind CSS)
│   ├── src/
│   │   └── app/
│   ├── package.json
│   └── ...
├── backend/              # Go Fiber API
│   ├── cmd/api/          # Entry point (main.go)
│   ├── internal/
│   │   ├── config/       # Environment configuration (.env)
│   │   ├── database/     # GORM + PostgreSQL connection & migrations
│   │   ├── handlers/     # API route handlers
│   │   ├── models/       # Database models
│   │   └── routes/       # Route registrations
│   ├── go.mod
│   ├── go.sum
│   └── .env
├── docker-compose.yml    # PostgreSQL container service
└── README.md
```

---

## 🚀 Cara Menjalankan

### 1. Jalankan PostgreSQL (Docker)

Pastikan Docker sudah aktif, lalu jalankan:

```bash
docker compose up -d
```

Ini akan menjalankan PostgreSQL di port `5432` dengan database `setorget_db`.

---

### 2. Jalankan Backend (Golang Fiber)

Pindah ke folder `backend`:

```bash
cd backend
go run cmd/api/main.go
```

Backend API akan berjalan di: `http://localhost:8080`

Endpoints yang tersedia:
- `GET http://localhost:8080/api/v1/health` - Health check status
- `GET http://localhost:8080/api/v1/items` - List items
- `POST http://localhost:8080/api/v1/items` - Tambah item baru

---

### 3. Jalankan Frontend (Next.js)

Pindah ke folder `frontend`:

```bash
cd frontend
npm run dev
```

Frontend Next.js akan berjalan di: `http://localhost:3000`
