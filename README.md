# Arsip Tugas

Website HTML/CSS/JS dengan Supabase. Semua orang bisa melihat dan mengunduh. Hanya admin yang bisa upload.

## Setup
1. Buat project di https://supabase.com.
2. **Authentication > Sign In / Providers**: matikan "Allow new users to sign up".
3. **Authentication > Users > Add user**: buat akun admin (email + kata sandi, centang auto-confirm).
4. Buka `supabase/schema.sql`, ganti `GANTI_DENGAN_EMAIL_ANDA@example.com` dengan email admin, lalu jalankan di **SQL Editor**.
5. **Project Settings > API**: salin Project URL dan anon key ke `js/config.js`.
6. Jalankan lokal: `python3 -m http.server 8000`, buka http://localhost:8000. Masuk lewat `/admin.html`.
7. Deploy: upload folder ini ke Netlify, Vercel, atau GitHub Pages.

Anon key aman berada di frontend. Keamanan ditegakkan oleh aturan RLS di `schema.sql`.
