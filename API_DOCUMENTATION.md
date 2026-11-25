# 📖 Dokumentasi REST API Setor Gmail (Golang Fiber)

Base URL: `http://localhost:8080/api/v1`

---

## 🔐 1. Autentikasi & Akun (`/auth`)

### Register
- **URL**: `POST /api/v1/auth/register`
- **Body**:
  ```json
  {
    "username": "budi123",
    "password": "password123",
    "ref_code": "OPTIONAL_REF_CODE"
  }
  ```
- **Response (201 Created)**: Token JWT & Data User.

### Login
- **URL**: `POST /api/v1/auth/login`
- **Body**:
  ```json
  {
    "username": "budi123",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Login berhasil",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### Profile & Settings (Membutuhkan Header `Authorization: Bearer <token>`)
- **GET `/api/v1/auth/me`**: Mendapatkan detail profil & saldo user saat ini.
- **PUT `/api/v1/auth/username`**: Ganti username (Body: `{"username": "budi_baru"}`).
- **PUT `/api/v1/auth/password`**: Ganti password (Body: `{"old_password": "...", "new_password": "...", "confirm_password": "..."}`).
- **PUT `/api/v1/auth/avatar`**: Update foto avatar base64 / URL (Body: `{"avatar": "data:image/..."}`).
- **POST `/api/v1/auth/agree-tnc`**: Setujui Syarat & Ketentuan.

---

## 📊 2. Dashboard (`/dashboard`)
*Header: `Authorization: Bearer <token>`*

- **GET `/api/v1/dashboard/summary`**
  - Mengambil saldo saat ini, harga per Gmail (Rp2.500), batas harian (`limit`), sisa batas hari ini, status statistik:
  ```json
  {
    "balance": 25000,
    "price_per_gmail": 2500,
    "limit": 20,
    "today_count": 3,
    "limit_remaining": 17,
    "unread_notifs": 1,
    "stats": {
      "ok": 10,
      "pend": 2,
      "bad": 1,
      "chk": 1
    }
  }
  ```

---

## 📤 3. Setor Gmail (`/submissions`)
*Header: `Authorization: Bearer <token>`*

### Setor Gmail Baru
- **URL**: `POST /api/v1/submissions`
- **Body**:
  ```json
  {
    "email": "getbudi21@gmail.com",
    "password": "emailPassword123"
  }
  ```
- **Validasi**:
  1. Wajib sudah menyetujui S&K.
  2. Batas harian belum habis.
  3. Format wajib diawali `get` dan berakhiran `@gmail.com`.
  4. Password email min. 8 karakter.
  5. Email belum pernah disetor sebelumnya.
- **Proses**:
  Status awal `pend` (Pending), lalu sistem background memproses ke `chk` (Di cek), dan akhirnya `ok` (Diterima + Saldo Rp2.500) atau `bad` (Ditolak).

### Riwayat Setor Gmail
- **URL**: `GET /api/v1/submissions`
- **Response**: List semua Gmail yang pernah disetor user beserta statusnya.

---

## 🔍 4. Email Checker (`/checker`)
- **URL**: `POST /api/v1/checker`
- **Body**:
  ```json
  {
    "emails": [
      "getbudi21@gmail.com",
      "contoh@gmail.com"
    ]
  }
  ```
  *(Bisa juga menggunakan field `"raw": "email1@gmail.com\nemail2@gmail.com"`)*
- **Response (200 OK)**:
  ```json
  {
    "total": 2,
    "results": [
      {
        "email": "getbudi21@gmail.com",
        "status": "ok",
        "message": "Akun aktif"
      },
      {
        "email": "contoh@gmail.com",
        "status": "bad",
        "message": "Format tidak valid (harus diawali 'get' & akhiran @gmail.com)"
      }
    ]
  }
  ```

---

## 👛 5. Tarik Saldo (`/withdrawals`)
*Header: `Authorization: Bearer <token>`*

### Ajukan Penarikan
- **URL**: `POST /api/v1/withdrawals`
- **Body**:
  ```json
  {
    "method": "DANA",
    "account_number": "081234567890",
    "amount": 25000
  }
  ```
- **Validasi**:
  1. Minimal penarikan Rp25.000.
  2. Saldo mencukupi.

### Riwayat Penarikan
- **URL**: `GET /api/v1/withdrawals`

---

## 🎁 6. Sistem Referral (`/referrals`)
*Header: `Authorization: Bearer <token>`*

- **GET `/api/v1/referrals`**
  - Mengembalikan kode referral unik, link undangan, target misi (20 teman = bonus Rp15.000), daftar teman yang diundang, dan riwayat bonus yang diterima.

---

## 🏆 7. Leaderboard (`/leaderboard`)
*Header: `Authorization: Bearer <token>`*

- **GET `/api/v1/leaderboard`**
  - Mengembalikan 10 peringkat pengguna terbanyak yang Gmail-nya diterima (`ok`), serta penanda `is_me: true` untuk posisi user saat ini.

---

## 💬 8. Chat Support Admin (`/chat`)
*Header: `Authorization: Bearer <token>`*

- **GET `/api/v1/chat`**: Mengambil pesan riwayat percakapan dengan Admin.
- **POST `/api/v1/chat`**:
  ```json
  {
    "message": "Halo admin, ada kendala saat proses penarikan saldo."
  }
  ```
  *(Disertai sistem auto-reply konfirmasi dari Admin)*

---

## 🔔 9. Notifikasi (`/notifications`)
*Header: `Authorization: Bearer <token>`*

- **GET `/api/v1/notifications`**: List notifikasi user terbaru.
- **PUT `/api/v1/notifications/read-all`**: Menandai seluruh notifikasi sudah dibaca.
