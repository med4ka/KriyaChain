# KRIYACHAIN — SPEC REWORK

> Rework dari project existing (Go/Gin + Next.js), bukan bangun dari nol. Baca bareng `DESIGN.md` (bahasa desain yang SUDAH ADA — dipertahankan, bukan diganti) dan `PROGRESS.md`.
>
> Sumber: README lama + audit kode lengkap (lihat referensi "Known Limitations" di README existing) + *Portfolio Review Lessons* — project ini adalah salah satu dari 10 project yang ditemukan CORS wildcard + tanpa autentikasi di audit itu.

---

## 0. Status Saat Ini (Ringkasan dari Audit)

**Yang sudah solid (jangan dirombak):**
- Model data inti (`Product`, `TransferHistory`) — konsepnya benar, cuma perlu diperkuat
- Alur registrasi → QR → scan → lihat histori — sudah lengkap end-to-end
- Rate limiter token bucket per-IP — cukup untuk skala sekarang
- Desain frontend (tema coklat wastra, Geist font, timeline, parallax tilt) — SUDAH bagus, bukan AI slop generic, dipertahankan

**Yang harus dirework (urutan prioritas):**
1. **Klaim/transfer kepemilikan bisa dipalsukan siapa saja** — cuma modal ngetik nama, gak ada akun/verifikasi
2. Tidak ada autentikasi sama sekali (siapa saja bisa register/edit/transfer produk manapun)
3. CORS wildcard (`*`)
4. Gambar disimpan base64 di database (`IMGBB_API_KEY` ada di `.env` tapi gak pernah dipakai — niatan awal yang gak selesai)
5. `DB_URL` masih pakai nama database `finance_ai` (sisa project lain)
6. Frontend hardcode `http://localhost:8080` (gak bisa dipakai pas deploy beneran)
7. Error handling di frontend cuma `console.error` — user gak tau kalau ada yang gagal

---

## 0.1 Keputusan Teknis Rework (Usulan — Perlu Dikonfirmasi/Dipilih)

| Area | Usulan | Alasan |
|---|---|---|
| Auth pengrajin (admin portal) | Akun login (username+password, JWT) — cuma pengrajin terverifikasi yang bisa register produk | Cegah spam registrasi produk palsu |
| Auth pemilik (claim/transfer) | Akun login WAJIB, bukan lagi input nama bebas | Ini fix utama — lihat Bagian 2 |
| Verifikasi klaim fisik | **Claim code** — kode rahasia dicetak bareng QR (di label fisik/sertifikat), dibutuhkan saat klaim pertama | Mencegah orang yang cuma lihat foto QR (bukan pegang fisik kainnya) ikut klaim — QR publik bisa difoto, claim code enggak |
| Transfer kepemilikan | **Opsi A — 2 sisi (FINAL, dipilih)** — lihat Bagian 2.2 | Kepercayaan adalah value utama project ini, worth kerjaan ekstra |
| Penyimpanan gambar | **Default: disk lokal server** (pola sama seperti Absensi) — asumsi sementara sambil hosting belum diputuskan. Gampang diganti ke ImgBB/object storage nanti kalau ternyata hosting-nya ephemeral (tinggal ganti implementasi di satu service, gak nyentuh yang lain) | Biar rework gak nge-block nunggu keputusan hosting |
| Arsitektur backend | Refactor bertahap ke layered (handler→service→repository) SAAT nambah fitur baru, bukan rewrite total sekaligus | App yang sekarang jalan, gak perlu dibongkar semua — resiko lebih kecil |

---

## 1. Skema Database (Revisi)

### `artisans` *(baru — akun pengrajin)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | PK |
| name, username, password_hash | string | |
| is_verified | bool | opsional: admin approve pengrajin baru sebelum bisa register produk |

### `owners` *(baru — akun pemilik/pembeli)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | PK |
| name, username/email, password_hash | string | |

### `products` (revisi dari `Product` existing)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | ganti dari `uint` — lebih aman dari enumerasi (nebak ID berurutan) |
| name, origin, description | string/text | tetap |
| artisan_id | UUID | FK ke `artisans` — ganti dari field teks bebas |
| image_path | string | path file di disk (atau URL eksternal kalau pakai object storage) — ganti dari base64 |
| qr_code_hash | UUID (unique) | tetap, tapi generate pakai native UUID Postgres, bukan string manual |
| claim_code_hash | string | **baru** — hash dari kode rahasia, dicetak terpisah dari QR publik |
| is_claimed | bool | tetap |
| owner_id | UUID nullable | FK ke `owners` — ganti dari `owner_name` teks bebas |

### `transfer_histories` (revisi)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK |
| from_owner_id | UUID nullable | FK ke `owners` (null untuk klaim pertama) |
| to_owner_id | UUID | FK ke `owners` — ganti dari `to_owner` teks bebas |
| status | enum(`pending`, `accepted`, `rejected`) | **baru** — mendukung alur transfer 2-sisi (lihat Bagian 2.2 opsi A) |
| initiated_at, completed_at | timestamp | |

---

## 2. Model Kepemilikan yang Bisa Dipercaya (FIX UTAMA)

### 2.0 Revisi UX — Signup/Login Owner Inline (Bukan Halaman Terpisah)

**Koreksi penting dari review desain:** akun Owner WAJIB tetap ada (ini bukan scope creep — ini fix keamanan utama dari Bagian 0). Tapi implementasinya JANGAN jadi halaman `/owner/auth` yang berdiri sendiri terpisah dari alur utama. Sebagai gantinya:

- Signup/login Owner ditaruh **langsung di dalam `QrScannerModal.tsx`**, sebagai step tambahan di alur yang sudah ada — BUKAN redirect ke halaman lain.
- Alur: scan QR → produk belum diklaim → tampil form kecil di modal yang sama: nama, username, password singkat, claim_code → submit sekali → langsung register akun Owner + langsung klaim, satu aksi.
- Kalau Owner udah pernah punya akun (mau klaim produk lain), tampil toggle kecil "Sudah punya akun? Login" di modal yang sama — tetap gak pindah halaman.
- Halaman `/owner/auth` terpisah **dihapus** dari rencana — gantikan dengan pola inline ini.
- Halaman `/admin/auth` (Artisan) **tetap terpisah dan boleh jadi halaman sendiri** — karena itu portal kerja pengrajin yang emang beda konteks dari flow publik pembeli, bukan bagian dari perjalanan scan-QR.

### 2.1 Klaim Pertama
```
Terima klaim produk (dari form inline di modal — register+klaim jadi 1 request):
  1. Kalau belum punya akun: buat akun owner baru (name, username, password)
     Kalau sudah: validasi JWT owner yang login
  2. Cek is_claimed == true → TOLAK 409 (sudah diklaim orang lain)
  3. Cek claim_code yang dikirim user cocok dengan claim_code_hash produk
     → salah → TOLAK 403 "kode klaim tidak sesuai"
     (claim_code ini yang membuktikan user MEMEGANG FISIK kainnya,
     bukan cuma tau UUID dari foto QR yang beredar — ini juga yang
     bikin pembeli ONLINE tetap bisa klaim: kode dicetak di label fisik
     yang IKUT DIKIRIM bareng barangnya, jadi gak perlu datang langsung)
  4. Set is_claimed = true, owner_id = current user
  5. Catat transfer_histories: from_owner_id = null, to_owner_id = current
     user, status = accepted
```

### 2.2 Transfer Kepemilikan — Opsi A (FINAL, direvisi: target boleh belum punya akun)

Mirip pola yang sudah terbukti bagus di project Pilah Anda (pickup 2 sisi). Owner sekarang inisiasi transfer ke username/email owner baru → status `pending` → owner baru harus login dan **accept** dulu sebelum kepemilikan resmi pindah. Mencegah orang iseng "transfer" barang ke akun orang lain tanpa sepengetahuan mereka.

**Revisi (biar gak "ribet"):** target transfer TIDAK WAJIB udah punya akun duluan. Kalau target belum terdaftar, sistem generate link undangan (token sekali pakai) — link itu dibagikan (WhatsApp/apa saja, di luar app) ke calon penerima, dan penerima **bikin akun SAAT accept**, bukan harus daftar dulu sebelum bisa menerima. Signup + accept jadi 1 aksi, sama seperti pola klaim pertama di atas.

```
Inisiasi (owner sekarang):
  1. Validasi JWT, cek dia beneran owner_id produk ini
  2. Input: username/email owner baru
  3. Buat transfer_histories: status = pending, from_owner_id = current,
     to_owner_id = target
  4. product.owner_id BELUM berubah sampai di-accept

Konfirmasi (owner baru):
  1. Login, lihat daftar transfer pending buat dirinya
     (GET /api/transfers/pending)
  2. Accept → status = accepted, completed_at = now,
     product.owner_id = dirinya
     Reject → status = rejected, product.owner_id tidak berubah
```

## 2.3 Batas Tanggung Jawab Aplikasi — Bukan Toko Online

Pertanyaan yang sering muncul: "kalau pembeli online gak bisa datang langsung, gimana caranya beli/pesan?"

**Jawaban: itu memang di luar tanggung jawab KriyaChain, dan itu keputusan yang benar, bukan celah.** KriyaChain adalah lapisan **verifikasi keaslian & kepemilikan**, bukan platform transaksi. Sama seperti sertifikat keaslian barang mewah tidak pernah mengurus pembayarannya:

- Proses jual-beli (nego harga, pembayaran, pengiriman) terjadi **di luar app** — WhatsApp, Instagram, marketplace, atau langsung ke pengrajin
- Tugas KriyaChain **mulai** begitu kain fisik + label claim code sampai ke tangan pembeli (diambil langsung ATAU dikirim paket — dua-duanya sama-sama valid, karena yang dibutuhkan cuma kode fisiknya, bukan kehadiran fisik pembeli di tempat pengrajin)
- Pembeli remote scan QR + masukkan claim code dari HP sendiri kapan saja setelah barang diterima — alur klaim di Bagian 2.1 sudah cukup untuk skenario ini, TIDAK perlu fitur toko/checkout baru

**Jangan tergoda menambah fitur e-commerce (cart, payment gateway) ke project ini sekarang** — itu proyek terpisah dengan scope jauh lebih besar. Kalau nanti benar-benar dibutuhkan, itu keputusan sadar di masa depan, bukan sesuatu yang harus diselesaikan sekarang.

---

## 3. Keamanan

### 3.1 Autentikasi
- JWT, sama pola dengan Absensi: access token pendek + refresh token
- Dua jenis akun terpisah (artisan vs owner) — JANGAN dicampur di satu tabel `users` generik, karena hak aksesnya beda total (artisan cuma boleh kelola produk yang dia daftarkan, owner cuma boleh klaim/transfer produk yang dia miliki)

### 3.2 Otorisasi per Endpoint
| Endpoint | Auth |
|---|---|
| `POST /api/products` (register) | Artisan login |
| `PATCH /api/products/edit/:qr` | Artisan login, DAN harus artisan yang sama yang daftarin produk itu |
| `GET /api/products`, `/scan/:qr`, `/history/:qr` | Publik (ini memang tujuannya — siapa saja boleh verifikasi keaslian) |
| `POST /api/products/claim/:qr` | Owner login + claim_code |
| `PATCH /api/products/transfer/:qr` | Owner login, harus owner_id produk itu (inisiasi, status jadi pending) |
| `GET /api/transfers/pending` | Owner login (lihat transfer yang nunggu dikonfirmasi dirinya) |
| `PATCH /api/transfers/:id/accept` atau `/reject` | Owner login, harus jadi to_owner_id di transfer itu |
| `GET /api/products/export` | Artisan login (data pengrajin sendiri) |

### 3.3 CORS
- Ganti dari `*` ke origin spesifik (domain frontend production)
- Kalau dev lokal butuh akses dari HP buat testing PWA, tambahkan origin dev network IP secara eksplisit, bukan wildcard

### 3.4 Penyimpanan Gambar
- **Default rework ini: disk lokal**, pola sama seperti Absensi — validasi content-type, limit ukuran, rename UUID
- Kalau nanti ternyata hosting-nya ephemeral, ganti ke ImgBB (env var `IMGBB_API_KEY` sudah ada, tinggal disambungkan) — cukup ganti implementasi di satu service (`internal/service/image_service.go` atau sejenis), gak perlu bongkar bagian lain

### 3.5 Validasi Input
- Semua field required (name, artisan, dst) divalidasi tidak boleh string kosong di level backend, bukan cuma di form frontend
- `DB_URL` diganti nama database yang sesuai (bukan `finance_ai`)

### 3.6 No Silent Failures
Sama aturan seperti Absensi — ini project yang literally ditemukan pola `res, _ := db.Exec(...)`-style silent error di audit sebelumnya (walau bukan persis di project ini, pola umumnya perlu dicegah). Semua error backend WAJIB di-log/di-propagate. Frontend: ganti semua `console.error`-only catch block dengan feedback nyata ke user (toast — `sonner` sudah terpasang, tinggal dipakai konsisten di semua request yang gagal).

---

## 4. Arsitektur Backend

Struktur sekarang (`config/`, `controllers/`, `models/`) sudah jalan — **jangan buru-buru rewrite total**. Rework bertahap:
- Fitur BARU (auth, claim code, transfer 2-sisi) ditulis dengan pola layered (`handler → service → repository`) seperti Absensi, ditaruh folder baru `internal/`
- Fitur LAMA yang cuma butuh fix kecil (CORS, validasi) — cukup diperbaiki di tempat, gak perlu dipindah strukturnya sekarang
- Kalau nanti stabil dan ada waktu luang, baru migrasi penuh — bukan prioritas rework kali ini

---

## 5. PWA Setup

Fondasi sudah ada (`manifest.json`, `appleWebApp` meta di `layout.tsx`). Yang perlu ditambah:
- Lengkapi `manifest.json`: icon berbagai ukuran (192x192, 512x512), `display: "standalone"`, `theme_color` samain dengan `#4A2E1B` yang udah dipakai
- Service worker sederhana buat caching asset statis + fallback offline (explorer page sudah punya logic offline/localStorage — service worker melengkapi ini biar app-nya bisa dibuka walau sinyal lemah, bukan cuma pas benar-benar offline penuh)
- Test "Add to Home Screen" di HP Android (Chrome) dan iOS (Safari) — perilakunya beda dikit, keduanya perlu dicek manual
- **Tidak perlu React Native / app store** — kamera scan udah jalan di browser mobile, dan target user (pembeli/wisatawan yang scan sekali-dua kali) gak akan mau install app cuma buat ini

---

## 6. Rework Frontend

- `NEXT_PUBLIC_API_URL` sebagai env var, ganti semua hardcode `http://localhost:8080`
- Halaman login/register terpisah untuk Artisan (portal pengrajin) dan Owner (buat klaim/transfer) — ikuti bahasa desain existing di `DESIGN.md`
- Form klaim di `QrScannerModal.tsx`: tambah field claim code, tampilkan pesan jelas kalau salah (bukan cuma gagal diam)
- Ganti semua `console.error`-only catch jadi toast pakai `sonner` (sudah terpasang)
- Admin portal (`app/admin/page.tsx`): tab Register/Edit cuma bisa diakses setelah login artisan; tab Transfer disesuaikan sama alur yang dipilih di Bagian 2.2

---

## 7. Testing Strategy

### 7.1 Unit Test (Backend)
- Claim dengan claim_code salah → harus 403, bukan keterima
- Claim produk yang udah `is_claimed = true` → 409
- Transfer oleh user yang BUKAN owner produk itu → harus ditolak
- (Kalau Opsi A dipilih) transfer status `pending` tidak mengubah `owner_id` sampai di-accept
- **WAJIB (belum tervalidasi dari test manual Fase 1-3):** Artisan B coba edit produk milik Artisan A → harus ditolak 401/403, `product.name` TIDAK berubah. Kalau test ini gagal (edit berhasil), STOP, jangan lanjut ke Fase 8 — itu bug otorisasi.
- **WAJIB (belum tervalidasi dari test manual Fase 1-3):** Owner tujuan REJECT transfer pending → status jadi `rejected`, `product.owner_id` TETAP owner lama, tidak pindah

### 7.2 Integration Test
- Full flow: artisan login → register produk → dapat QR + claim code → owner login → klaim pakai claim code → cek `is_claimed` & `owner_id` ter-update

### 7.3 Manual Test
- Coba akses `/api/products` (POST) tanpa token artisan → harus ditolak
- Coba klaim produk pakai UUID yang difoto dari QR orang lain TANPA claim code fisik → harus gagal
- Test PWA: buka di HP, coba "Add to Home Screen", coba scan QR pakai kamera HP langsung dari browser
- Cek CORS: coba fetch API dari origin lain (bukan domain frontend resmi) → harus ditolak browser

---

## 8. Urutan Kerja

1. **Auth backend** — tabel `artisans`, `owners`, endpoint login/register, JWT middleware
2. **Fix model kepemilikan** — `claim_code`, revisi claim/transfer sesuai Opsi yang dipilih (Bagian 2.2), migrasi `owner_name`/`to_owner` teks jadi FK ke akun
3. **Fix keamanan dasar** — CORS spesifik, validasi input, `DB_URL` dibenerin
4. **Penyimpanan gambar** — sesuai keputusan Bagian 3.4
5. **Frontend** — auth UI, env var API URL, toast error handling, form claim code
6. **PWA** — manifest lengkap, service worker, test install di HP
7. **Testing** — Bagian 7.1–7.3
8. **Definition of Done check** — Bagian 11, sebelum dianggap siap "dijual"

Update `PROGRESS.md` tiap fase selesai.

---

## 9. Yang Belum Diputuskan

- **Rencana hosting backend** — belum perlu diputuskan sekarang (default disk lokal dipakai dulu), tapi WAJIB dikonfirmasi sebelum deploy production, karena kalau ternyata hosting-nya ephemeral, gambar yang udah ke-upload bisa hilang tiap redeploy
- **Claim code:** dicetak di mana secara fisik? (stiker terpisah dari QR, bagian belakang label, dst) — ini soal proses fisik pengrajin, bukan cuma teknis
- **Artisan perlu verifikasi admin dulu sebelum bisa register produk**, atau langsung bisa daftar sendiri (self-serve)?

---

## 10. Instruksi Khusus untuk AI Agent (OpenCode / DeepSeek)

1. Baca `SPEC.md`, `DESIGN.md`, `PROGRESS.md` di awal sesi. **Untuk `DESIGN.md`: ini dokumentasi bahasa desain yang SUDAH ADA, bukan panduan bikin baru — jangan ubah warna/font/pola yang sudah berjalan.**
2. Kerjakan sesuai urutan Bagian 8, lanjut dari `PROGRESS.md`.
3. Fitur baru (auth, claim code, transfer) ditulis dengan pola layered di `internal/` (Bagian 4) — fitur lama diperbaiki di tempat.
4. Kalau nemu keputusan dari Bagian 9 yang blocking — STOP, tanya, jangan asumsi.
5. No Silent Failures (Bagian 3.6) — berlaku di backend DAN frontend.
6. Commit per task, update `PROGRESS.md` per fase.
7. Sebelum menandai fase selesai, jalankan checklist Bagian 11.

---

## 11. Definition of Done

- [ ] Setiap endpoint mutasi (POST/PUT/PATCH/DELETE) dilindungi auth yang sesuai (Bagian 3.2), kecuali yang memang didesain publik
- [ ] CORS bukan wildcard
- [ ] Klaim tanpa claim_code yang benar selalu ditolak (dites, bukan diasumsikan)
- [ ] Tidak ada error dibuang diam-diam (backend maupun frontend)
- [ ] Semua klaim di PROGRESS.md bisa ditunjuk baris kodenya
- [ ] `DB_URL` dan config lain gak ada sisa dari project lain
- [ ] PWA bisa di-"Add to Home Screen" dan dites di device asli
