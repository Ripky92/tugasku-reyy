# Portofolio Tugas: Design Doc

## Tujuan
Website publik untuk menampilkan tugas (file dan foto). Semua orang bisa melihat dan mengunduh. Hanya pemilik yang bisa upload, edit, dan hapus lewat halaman admin.

## Arsitektur
- Frontend: HTML, CSS, JS murni (ES modules), tanpa build step.
- Backend: Supabase (Auth, Postgres, Storage), diakses lewat `@supabase/supabase-js` via CDN.
- Hosting: statis (Netlify / Vercel / GitHub Pages).

## Halaman
- `index.html`: galeri publik. Hero singkat, pencarian, filter kategori, grid kartu. Foto dibuka di lightbox, file lewat tombol Unduh.
- `admin.html`: login email + password, lalu form upload (judul, deskripsi, kategori, tanggal, banyak file), daftar tugas dengan hapus dan edit.

## Fitur download (publik)
- Setiap file punya tombol Unduh yang bisa dipakai siapa saja tanpa login. Unduhan dipaksa menjadi file (bukan dibuka di tab) dengan nama asli.
- Foto: tombol Unduh juga ada di lightbox.
- Tugas dengan banyak file punya tombol "Unduh semua" (ZIP, dibuat di browser dengan JSZip).
- Nama file dan ukuran ditampilkan sebelum diunduh.
uju
## Data
Tabel `tasks`: id, title, description, category, task_date, created_at.
Tabel `task_files`: id, task_id, path, name, mime, size.
Bucket Storage `tasks` (publik untuk baca).

## Keamanan
- Row Level Security: SELECT terbuka untuk semua. INSERT/UPDATE/DELETE hanya untuk user dengan UUID pemilik.
- Storage policy: baca publik, tulis hanya pemilik.
- Pendaftaran akun baru dimatikan di dashboard Supabase.
- Hanya anon key yang ada di frontend. Service key tidak pernah dipakai.
- Batas ukuran dan tipe file divalidasi di klien dan di bucket.

## Desain visual
- Tema terang dengan dark mode otomatis (`prefers-color-scheme`), satu warna aksen (indigo-teal), tipografi Bricolage Grotesque (judul) + Inter (isi).
- Kartu dengan thumbnail besar, ikon tipe file untuk dokumen, badge kategori.
- Mobile-first: 1 kolom di HP, 2 di tablet, 3-4 di desktop. Tap target minimal 44px.
- Motion halus (hover, fade-in), menghormati `prefers-reduced-motion`.
- Kontras AA, fokus keyboard terlihat, alt text dan label pada semua kontrol.

## Di luar cakupan
Komentar, multi-user, pembayaran.

## Setup yang Anda lakukan
Buat project Supabase, jalankan `supabase/schema.sql`, buat akun admin, isi URL dan anon key di `js/config.js`. README memandu langkahnya.

