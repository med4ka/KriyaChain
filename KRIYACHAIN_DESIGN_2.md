# DESIGN.md — Bahasa Desain KriyaChain (Existing, Didokumentasikan)

> Beda dengan Absensi: ini BUKAN desain dari nol. Frontend KriyaChain sudah punya identitas visual yang jelas dan bagus (bukan AI slop generic) — file ini mendokumentasikan itu supaya konsisten dipakai untuk komponen baru (auth, claim code, dst), bukan menggantinya.

---

## 1. Yang Sudah Ada (Pertahankan)

### Palet Warna
- Warna utama: **coklat tua `#4A2E1B`** (tema wastra/batik — earthy, sesuai konteks budaya, bukan default AI purple-gradient)
- Background terang: `#F8F7F4` (custom scrollbar track)
- Aksen: `#D4C3B3` (coklat muda, scrollbar thumb)

### Tipografi
- **Geist** (sans) + **Geist Mono** dari `next/font/google` — sudah konsisten dipakai

### Pola Interaksi yang Sudah Established
- Framer Motion untuk transisi halaman (fade + slide, 0.6s) via `template.tsx` — otomatis ke semua route
- Parallax tilt cards (`react-parallax-tilt`) untuk kartu produk/fitur
- Toast notification via `sonner` (posisi top-center, rich colors) — **pakai ini konsisten untuk semua feedback baru** (login gagal, klaim gagal, dst), jangan bikin sistem notifikasi baru
- Status badge existing: "Dimiliki" (hijau) / "Tersedia" (kuning) — pola ini yang diikuti untuk status baru (misal transfer pending)
- Custom scrollbar, background pattern SVG segitiga opacity rendah — detail kecil yang sudah menambah karakter, jangan dihapus

### Copy/Tone
- Bahasa Indonesia dengan sentuhan puitis/budaya ("Sertifikasi Mahakarya, Dalam Setiap Helai", manifesto section) — cocok untuk landing/explorer
- Tapi untuk pesan error/validasi teknis (contoh: "AWAS! Data Wastra tidak ditemukan") — tetap jelas dan actionable, jangan sampai puitis mengorbankan kejelasan pesan error

---

## 2. Komponen Baru yang Perlu Ditambah — Ikuti Bahasa di Atas

### Form Login/Register (Artisan & Owner)
- **Revisi setelah review:** form Owner (login/signup/claim) HARUS berada di dalam `QrScannerModal.tsx` yang sudah ada — bukan halaman terpisah dengan style sendiri. Kalau dibangun sebagai halaman baru, dia gampang keluar dari bahasa desain existing (itu yang kejadian — warnanya "kurang sesuai"). Reuse persis komponen modal, warna, dan font yang sudah ada, cuma tambah 1 form step baru di dalamnya.
- Form Artisan (`/admin/auth`) boleh tetap halaman terpisah (portal kerja, bukan bagian flow publik) — tapi tetap pakai palet coklat existing, bukan style default form generic (jangan sampai kelihatan beda "kelas" dari halaman lain di app ini)
- Pakai palet coklat existing untuk tombol primer, bukan warna baru

### Input Claim Code
- Perlakukan seperti field sensitif (mirip input password) — bisa pakai style monospace mengikuti gaya UUID yang sudah ditampilkan truncated di explorer
- Pesan error saat kode salah: jelas dan actionable ("Kode klaim tidak cocok — cek label fisik pada kain"), bukan generic "Error"

### Status Transfer (kalau Opsi A/2-sisi dipilih)
- Tambah 1 badge baru "Menunggu Konfirmasi" (misal warna amber) — ikuti pola 2 badge existing (hijau/kuning), jangan bikin skema warna status baru yang beda

### PWA Install Prompt
- Kalau dibuat banner custom (bukan browser default), samakan gaya dengan card existing (rounded besar, warna coklat/cream), bukan komponen generic Material Design

---

## 3. Checklist Sebelum Anggap Selesai

- [ ] Komponen baru pakai warna dari palet existing (`#4A2E1B`, `#D4C3B3`, `#F8F7F4`), bukan warna baru yang gak nyambung
- [ ] Semua notifikasi/error pakai `sonner` toast yang sudah terpasang, bukan `alert()` atau sistem baru
- [ ] Font tetap Geist — gak nambah font lain untuk halaman baru (auth, dst)
- [ ] Copy pesan error tetap jelas walau di halaman dengan tone puitis (Bagian 1)
