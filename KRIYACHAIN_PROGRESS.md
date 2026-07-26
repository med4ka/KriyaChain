# PROGRESS.md — Status Rework KriyaChain

> Update SETIAP kali satu fase/task selesai. Baca ini dulu sebelum lanjut kerja kalau sesi terputus.

**Terakhir update:** 25 Juli 2026
**Fase aktif sekarang:** ✅ Fase 1-3 selesai — STOP, tunggu review untuk lanjut Fase 4

---

## Ringkasan Fase (dari KRIYACHAIN_SPEC.md Bagian 8)

| # | Fase | Status | Tanggal Mulai | Tanggal Selesai | Catatan |
|---|---|---|---|---|---|
| 1 | Auth backend (artisan + owner) | ✅ Selesai | 25 Jul 2026 | 25 Jul 2026 | 6 file baru di internal/, 2 model baru, JWT access+refresh |
| 2 | Model kepemilikan (claim code + transfer) | ✅ Selesai | 25 Jul 2026 | 25 Jul 2026 | 3 file baru internal/product, rewrite claim & transfer 2-sisi
| 3 | Fix keamanan dasar (CORS, validasi, DB_URL) | ✅ Selesai | 25 Jul 2026 | 25 Jul 2026 | CORS origin spesifik, validasi input, crypto/rand, no silent failures
| 4 | Penyimpanan gambar | ⬜ Belum mulai | | | |
| 5 | Frontend (auth UI, env var, toast, claim code form) | ⬜ Belum mulai | | | |
| 6 | PWA (manifest, service worker, test install) | ⬜ Belum mulai | | | |
| 7 | Testing (unit, integration, manual) | ⬜ Belum mulai | | | |
| 8 | Definition of Done check final | ⬜ Belum mulai | | | |

Status: ⬜ Belum mulai · 🟡 Sedang dikerjakan · ✅ Selesai · 🔴 Blocked

---

## Log Detail

### Fase 1 — Auth backend ✅

**Tujuan:** Membuat sistem autentikasi untuk dua jenis akun (artisan/pengrajin dan owner/pemilik) dengan JWT.

**Keputusan yang dikunci:**
- Dua tabel terpisah (`artisans`, `owners`) — tidak dicampur di satu tabel `users` generik (SPEC 3.1)
- Access token: 15 menit, Refresh token: 7 hari (pola Absensi)
- Middleware auth terpisah untuk artisan vs owner (tidak dicampur)

**File baru:**
| File | Isi |
|---|---|
| `internal/utils/hash.go` | bcrypt: HashPassword, CheckPassword, HashClaimCode, CheckClaimCode |
| `internal/utils/jwt.go` | GenerateAccessToken, GenerateRefreshToken, ValidateToken — HS256, Claims{UserID, Role} |
| `models/artisan.go` | Artisan struct: id(UUID), name, username(unique), password_hash, is_verified, timestamps |
| `models/owner.go` | Owner struct: id(UUID), name, username(unique), password_hash, timestamps |
| `internal/auth/repository.go` | DB operations: CRUD artisans & owners, UsernameExists |
| `internal/auth/service.go` | Business logic: register + login for both roles, return AuthResponse{tokens, user info} |
| `internal/auth/handler.go` | HTTP handlers: RegisterArtisan, LoginArtisan, RegisterOwner, LoginOwner, RefreshToken |
| `internal/middleware/artisan.go` | Gin middleware — verifikasi Bearer token, cek role="artisan", set user_id & role di context |
| `internal/middleware/owner.go` | Gin middleware — verifikasi Bearer token, cek role="owner", set user_id & role di context |

**File diubah:**
| File | Perubahan |
|---|---|
| `backend/main.go` | Tambah import internal/auth, AutoMigrate artisan & owner, init handler, route group `/api/auth/...` |
| `backend/.env` | Tambah `JWT_SECRET`, ubah `dbname=finance_ai` → `dbname=kriyachain` |
| `backend/go.mod` | Tambah `github.com/golang-jwt/jwt/v5`, upgrade `golang.org/x/crypto` ke direct dependency |

**Endpoint baru:**
| Method | Path | Auth | Fungsi |
|---|---|---|---|
| POST | `/api/auth/artisan/register` | Publik | Daftar akun pengrajin baru |
| POST | `/api/auth/artisan/login` | Publik | Login pengrajin, dapat token |
| POST | `/api/auth/owner/register` | Publik | Daftar akun pemilik baru |
| POST | `/api/auth/owner/login` | Publik | Login pemilik, dapat token |
| POST | `/api/auth/refresh` | Publik (dengan refresh token) | Dapat access+refresh token baru |

**Definisi of Done checklist (Fase 1):**
- [x] `POST /api/auth/artisan/register` — validasi input, hash password, return JWT
- [x] `POST /api/auth/artisan/login` — verifikasi password, return access+refresh token
- [x] `POST /api/auth/owner/register` — sama pola artisan
- [x] `POST /api/auth/owner/login` — sama pola artisan
- [x] `POST /api/auth/refresh` — validasi refresh token, return token pair baru
- [x] Middleware ArtisanAuth — tolak jika bukan token artisan (403 Forbidden)
- [x] Middleware OwnerAuth — tolak jika bukan token owner (403 Forbidden)
- [x] Semua compile (`go build ./...` sukses)
- [x] `DB_URL` sudah pakai dbname `kriyachain` (bukan `finance_ai`)

### Fase 2 — Model kepemilikan ✅

**Tujuan:** Menambahkan claim_code_hash, merewrite claim dengan verifikasi claim_code + auth owner, dan transfer 2-sisi (initiate → pending → accept/reject).

**Keputusan yang dikunci:**
- Transfer Opsi A (2-sisi): inisiasi → pending → accept/reject oleh owner tujuan (SPEC 2.2)
- Claim code: 8 karakter alfanumerik (tanpa vokal/angka mudah bingung: 0/O/1/I), di-hash bcrypt, ditampilkan sekali saat registrasi
- JWT claims sekarang include `Name` (untuk display name di context)
- Artisan name tidak lagi diambil dari input body — diambil dari JWT claims (setelah middleware)

**File baru:**
| File | Isi |
|---|---|
| `internal/product/repository.go` | DB: GetProductByQR, UpdateProduct, CreateTransferHistory, GetTransferHistoryByID, UpdateTransferHistory, GetPendingTransfersByOwner, GetProductHistory, GetOwnerByID, GetOwnerByUsername, GetArtisanByID |
| `internal/product/service.go` | Business logic: ClaimProduct (with claim_code check), InitiateTransfer, AcceptTransfer, RejectTransfer, GetPendingTransfers |
| `internal/product/handler.go` | HTTP: ClaimProduct (PUT /api/products/claim/:qr_code), InitiateTransfer (POST /api/products/transfer/:qr_code), AcceptTransfer (PATCH /api/transfers/accept), RejectTransfer (PATCH /api/transfers/reject), GetPendingTransfers (GET /api/transfers/pending) |

**File diubah:**
| File | Perubahan |
|---|---|
| `backend/models/product.go` | Tambah `ArtisanID uuid.UUID`, `ClaimCodeHash string`, `OwnerID *uuid.UUID`; TransferHistory: tambah `FromOwnerID`, `ToOwnerID`, `Status`, `InitiatedAt`, `CompletedAt` |
| `backend/controllers/product_controller.go` | CreateProduct: pakai artisan dari JWT, generate claim_code + hash, return claim_code; EditProduct: pakai artisan dari JWT, cek kepemilikan artisan; Hapus `Artisan` dari input body |
| `backend/internal/auth/service.go` | Pass name ke GenerateAccessToken/GenerateRefreshToken |
| `backend/internal/utils/jwt.go` | Claims tambah field `Name`, semua generator include name |
| `backend/internal/middleware/artisan.go` | Set `user_name` di context dari claims |
| `backend/internal/middleware/owner.go` | Set `user_name` di context dari claims |
| `backend/main.go` | Register: ArtisanAuth untuk POST /api/products & PATCH edit; OwnerAuth untuk claim, transfer, pending, accept, reject; Init product handler |

**Endpoint baru/diubah:**
| Method | Path | Auth | Fungsi |
|---|---|---|---|
| POST | `/api/products` | ArtisanAuth | Register produk — otomatis set artisan dari JWT, generate claim code |
| PATCH | `/api/products/edit/:qr_code` | ArtisanAuth (sama artisan) | Edit produk — hanya artisan pendaftar |
| PUT | `/api/products/claim/:qr_code` | OwnerAuth | Klaim — wajib login owner + claim_code fisik |
| POST | `/api/products/transfer/:qr_code` | OwnerAuth | Inisiasi transfer — owner saat ini ke username tujuan → pending |
| GET | `/api/transfers/pending` | OwnerAuth | Daftar transfer pending untuk owner yang login |
| PATCH | `/api/transfers/accept` | OwnerAuth (to_owner) | Terima transfer → ownership pindah |
| PATCH | `/api/transfers/reject` | OwnerAuth (to_owner) | Tolak transfer → ownership tetap |

**Definisi of Done checklist (Fase 2):**
- [x] `claim_code_hash` di products — bcrypt hash, tidak pernah diekspos
- [x] Claim tanpa claim_code benar → ditolak (403/400)
- [x] Claim produk sudah diklaim → 409 Conflict
- [x] Transfer inisiasi: owner sekarang → pending, target by username
- [x] Transfer accept: to_owner terima → kepemilikan resmi pindah
- [x] Transfer reject: to_owner tolak → ownership tetap
- [x] Hanya owner produk yang bisa initiate transfer
- [x] `EditProduct` validasi artisan yang sama (from JWT)
- [x] Semua compile (`go build ./...` sukses)

### Fase 3 — Keamanan dasar ✅

**Tujuan:** CORS dari wildcard ke origin spesifik, validasi input semua field required di backend, fix DB_URL, no silent failures.

**Perubahan:**

| Area | Detail |
|---|---|
| **CORS** | Ganti `Access-Control-Allow-Origin: *` → origin dari env `ALLOWED_ORIGIN` (default `http://localhost:3000`). Hanya set header jika Origin request cocok. |
| **Validasi input** | Semua field required di struct sudah pakai `binding:"required"` Gin; tambah explicit empty-string check di `CreateProduct` & `EditProduct` |
| **DB_URL** | Di Fase 1 sudah diubah dari `dbname=finance_ai` ke `dbname=kriyachain` |
| **crypto/rand** | `generateClaimCode` ganti dari `math/rand` (predictable) ke `crypto/rand` (secure random) |
| **No silent failures** | `EditProduct`: `Save` error sekarang dicek; `GetStats`: error semua query `.Count()` dicek; `ExportProductsCSV`: error `writer.Write()` dicek; semua kode internal (auth, product) sudah proper error handling |
| **ALLOWED_ORIGIN** | Ditambahkan ke `.env` untuk dokumentasi |

**Definisi of Done checklist (Fase 3):**
- [x] CORS bukan wildcard — pakai env `ALLOWED_ORIGIN` + fallback localhost:3000
- [x] `DB_URL` sudah pakai `dbname=kriyachain`, bukan `finance_ai`
- [x] Tidak ada error dibuang diam-diam (backend): `EditProduct`, `GetStats`, `ExportProductsCSV` diperbaiki; kode baru di internal/ sudah proper
- [x] Claim code generation pakai `crypto/rand` (secure)
- [x] Semua field required divalidasi di backend (binding + empty check)
- [x] Semua compile (`go build ./...` sukses)

### Fase 4 — Penyimpanan gambar
- Belum ada progress.

### Fase 5 — Frontend
- Belum ada progress.

### Fase 6 — PWA
- Belum ada progress.

### Fase 7 — Testing
- Belum ada progress.

### Fase 8 — Definition of Done final
- Belum ada progress.

---

## Blocker / Keputusan yang Masih Nunggu

- **Claim code cetak fisik** (SPEC 9) — perlu dikonfirmasi pengrajin: dicetak di stiker terpisah, label belakang, atau sertifikat. Sementara implementasi teknis sudah siap, keputusan fisik ini tidak nge-block kode.
- **Artisan verification** (SPEC 9) — saat ini `is_verified` default false, tapi register langsung bisa. Perlu keputusan: admin approve dulu atau self-serve? Asumsi sementara: self-serve untuk development.
- **Rencana hosting backend final** — belum perlu sekarang, tapi akan pengaruh ke Fase 4 (gambar disk lokal vs object storage).

## Penyesuaian di Luar Spec

- UUID untuk ID di tabel `artisans` dan `owners` dibuat di Go (`uuid.New()`) bukan di PostgreSQL (`gen_random_uuid()`), karena ekstensi uuid mungkin belum ter-install.
- Refresh token endpoint menerima refresh_token di body JSON, bukan header khusus. Pola sederhana.

### Fase 5 (UX Revision) — 26 Jul 2026 ✅

**Tujuan:** Revisi UX flow sesuai SPEC 2.0, 2.2 (revisi), 2.3, dan DESIGN.md.

**Perubahan:**

**1. HAPUS halaman `/owner/auth` terpisah (SPEC 2.0)**
- Folder `frontend/app/owner/auth/` dihapus
- Route `/owner/auth` tidak lagi muncul di build output
- Owner flow sekarang hanya via QrScannerModal inline

**2. Owner signup/login inline di QrScannerModal (SPEC 2.0)**
- `QrScannerModal.tsx` direwrite: saat produk ditemukan & belum diklaim:
  - Jika belum login owner: tampil form **Daftar & Klaim** (name, username, password, claim_code)
  - Toggle "Sudah punya akun? Login" → form **Masuk & Klaim** (username, password, claim_code)
  - Jika sudah login (owner_token di localStorage): hanya field claim_code
  - Submit: register/login owner → langsung claim wastra, satu aksi
- Nama/username/password dikirim ke `/api/auth/owner/register` (atau login), lalu token dipakai untuk `PUT /api/products/claim/:qr_code`

**3. Revisi endpoint transfer (SPEC 2.2)**
- `ToOwnerID` di `TransferHistory` model: `uuid.UUID` → `*uuid.UUID` (nullable)
- Tambah field `InviteToken *string` di `TransferHistory`
- `InitiateTransfer`: jika `target_username` belum terdaftar, generate token undangan (16 byte crypto/rand → hex 32 char), simpan di `InviteToken`, `ToOwnerID` dibiarkan nil
- Endpoint baru:
  - `GET /api/transfers/invite/:token` (publik) — lihat info undangan (nama produk, pengirim)
  - `POST /api/transfers/accept-with-register` (publik) — create owner + accept transfer, 1 aksi
- Admin page: tab transfer menampilkan token undangan + tombol salin jika target belum terdaftar
- QrScannerModal: deteksi token 32 karakter → coba fetch `/api/transfers/invite/:token` → tampil form register + accept

**4. Admin auth styling konsisten**
- `/admin/auth/page.tsx` sudah pakai palet `#4A2E1B` / `#D4C3B3` / `#F8F7F4` dan font Geist (global)
- Tidak ada perubahan karena sudah sesuai DESIGN.md

**5. Toast konsisten**
- Semua halaman (`QrScannerModal`, `admin/page.tsx`, `admin/auth/page.tsx`, `explorer/page.tsx`) pakai `sonner`
- Tema brown dari `globals.css` — semua notifikasi pakai style yang sama

**Definisi of Done checklist:**
- [x] Halaman /owner/auth dihapus, tidak ada link navigasi
- [x] Owner register inline di QrScannerModal: 3 field (name, username, password) + claim_code
- [x] Owner login inline di QrScannerModal: 2 field (username, password) + claim_code
- [x] Submit register → AuthRequest ke `/api/auth/owner/register` → token → claim
- [x] Submit login → AuthRequest ke `/api/auth/owner/login` → token → claim
- [x] Transfer ke username belum terdaftar → generate invite token
- [x] Endpoint `GET /api/transfers/invite/:token` — info publik
- [x] Endpoint `POST /api/transfers/accept-with-register` — register + accept 1 aksi
- [x] Admin page tampilkan invite token + tombol salin
- [x] QrScannerModal terima token undangan 32 karakter
- [x] Semua compile (`go build ./...`, `npm run build` sukses)
