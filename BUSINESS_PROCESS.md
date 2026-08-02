# 📊 Alur Proses Bisnis SI-Travel

## 1️⃣ ALUR BOOKING PENUMPANG

```
┌─────────────────────────────────────────────────────────────────┐
│                    PENGGUNA (Calon Penumpang)                   │
└──────────────┬────────────────────────────────────────────────────┘
               │
               ▼
    ┌────────────────────────┐
    │  1. Cari Jadwal Travel │
    │  - Pilih Asal/Tujuan   │
    │  - Pilih Tanggal       │
    │  - Lihat Harga         │
    └────────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  2. Pilih Kursi        │
    │  - Sistem Lock 5 menit │
    │  - Lihat Layout        │
    │  - Kursi yang tersedia │
    └────────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  3. Isi Data Penumpang │
    │  - Nama Penumpang      │
    │  - No. HP              │
    │  - Lokasi Jemput ✨    │
    │  - Lokasi Turun ✨     │
    │  (Wajib jemput, opt turun)
    └────────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  4. Konfirmasi Booking │
    │  - Review Data         │
    │  - Total Harga         │
    │  - Kode Booking        │
    └────────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  ✅ BOOKING CONFIRMED  │
    │  - Email Konfirmasi    │
    │  - E-Ticket            │
    │  - PDF Tiket           │
    └────────────┬───────────┘
                 │
                 └──► Status: CONFIRMED
```

---

## 2️⃣ ALUR RESCHEDULE PERJALANAN

```
┌──────────────────────────────────────────────────────────┐
│  Penumpang ingin ubah jadwal perjalanan (Max 2x)         │
└───────────────┬──────────────────────────────────────────┘
                │
    ╔═══════════════════════════════════════════════════╗
    ║  VALIDASI BATAS WAKTU RESCHEDULE (H-48)          ║
    ║  ❌ Jika < 48 jam ke keberangkatan saat ini      ║
    ║  → BLOKIR! Minta bantuan loket                    ║
    ║                                                   ║
    ║  ✅ Jika >= 48 jam                               ║
    ║  → Lanjutkan reschedule                           ║
    ╚═════════════┬═══════════════════════════════════════╝
                  │
                  ▼
    ┌────────────────────────────────────┐
    │  1. Pilih Tanggal Baru             │
    │  2. Pilih Jadwal Baru              │
    │  3. Pilih Kursi Baru               │
    │  4. Update Lokasi Jemput/Turun ✨  │
    └────────────┬─────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │  CEK SELISIH HARGA ✨              │
    │  ┌──────────────────────────────┐  │
    │  │ Harga Lama: Rp 90.000        │  │
    │  │ Harga Baru: Rp 110.000       │  │
    │  │ Selisih   : +Rp 20.000 ⬆️    │  │
    │  │ (Surcharge / Refund)         │  │
    │  └──────────────────────────────┘  │
    └────────────┬─────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │  Update Booking                    │
    │  - Jadwal baru                     │
    │  - Kursi baru                      │
    │  - Lokasi jemput/turun baru        │
    │  - Harga baru                      │
    │  - Catat di reschedule_history     │
    └────────────┬─────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │  📧 Notifikasi                     │
    │  - Email Penumpang (Reschedule)    │
    │  - Email Loket (Notif Perubahan)   │
    └────────────┬─────────────────────────┘
                 │
                 └──► Status: CONFIRMED (dengan jadwal baru)
```

---

## 3️⃣ ALUR PEMBATALAN BOOKING

```
┌──────────────────────────────────────────────────────────┐
│  Penumpang ingin membatalkan perjalanan                  │
└───────────────┬──────────────────────────────────────────┘
                │
    ╔═══════════════════════════════════════════════════╗
    ║  VALIDASI BATAS WAKTU CANCEL (H-24)              ║
    ║  ❌ Jika < 24 jam ke keberangkatan saat ini      ║
    ║  → BLOKIR! Hubungi loket untuk bantuan           ║
    ║                                                   ║
    ║  ✅ Jika >= 24 jam                               ║
    ║  → Proses pembatalan                              ║
    ╚═════════════┬═══════════════════════════════════════╝
                  │
                  ▼
    ┌────────────────────────────────────┐
    │  1. Konfirmasi Pembatalan          │
    │  2. Update Status ke CANCELLED     │
    │  3. Catat tanggal pembatalan       │
    └────────────┬─────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │  📧 Notifikasi                     │
    │  - Email Penumpang (Cancel)        │
    │  - Email Loket (Notif Cancel)      │
    └────────────┬─────────────────────────┘
                 │
                 └──► Status: CANCELLED
```

---

## 4️⃣ ALUR MANAJEMEN JADWAL LOKET

```
┌──────────────────────────────────────────────┐
│         ADMIN LOKET / TRAVEL MANAGER         │
└───────────────┬──────────────────────────────┘
                │
                ▼
    ┌────────────────────────────┐
    │  1. BUAT JADWAL BARU       │
    │  - Pilih Asal/Tujuan       │
    │  - Tanggal + Jam           │
    │  - Harga                   │
    │  - Total Kursi             │
    │  - Jenis Kendaraan         │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  2. ASSIGN SUPIR 👨‍✈️       │
    │  - Pilih Supir dari list   │
    │  - Supir melihat jadwalnya  │
    │  - (Opsional - bisa assign  │
    │     langsung/nanti)         │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  3. MONITOR BOOKING        │
    │  - Lihat penumpang         │
    │  - Lihat lokasi jemput     │
    │  - Lihat lokasi turun      │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  4. LIHAT MANIFEST         │
    │  - Daftar penumpang per    │
    │    jadwal                  │
    │  - Nomor kursi + nama      │
    │  - Kontak penumpang        │
    │  - Lokasi jemput/turun     │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  5. TANDAI STATUS BOOKING  │
    │  - COMPLETED (selesai)     │
    │  - NO_SHOW (tidak datang)  │
    └────────────┬────────────────┘
                 │
                 └──► Dashboard stats updated
```

---

## 5️⃣ ALUR SUPIR (DRIVER)

```
┌──────────────────────────────────────────────┐
│              DRIVER / SUPIR                  │
└───────────────┬──────────────────────────────┘
                │
                ▼
    ┌────────────────────────────┐
    │  1. LIHAT JADWAL SAYA      │
    │  - Jadwal hari ini         │
    │  - Jadwal 7 hari ke depan  │
    │  - Rute + Jam              │
    │  - Jumlah penumpang        │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  2. LIHAT MANIFEST 📋      │
    │  - Daftar penumpang        │
    │  - Nomor kursi             │
    │  - Nama & kontak           │
    │  - Lokasi jemput 🏠        │
    │  - Lokasi turun 🏁         │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  3. PERSIAPKAN PERJALANAN  │
    │  - Review manifest         │
    │  - Panggil penumpang       │
    │  - Jemput sesuai alamat    │
    │  - Drop sesuai lokasi turun│
    └────────────┬────────────────┘
                 │
                 └──► Selesai perjalanan
```

---

## 6️⃣ ALUR ADMIN APLIKASI

```
┌────────────────────────────────────┐
│   ADMIN APLIKASI (Master User)     │
└──────────────┬─────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌──────────────┐   ┌──────────────────┐
│  MANAJEMEN   │   │  MANAJEMEN       │
│  TRAVEL      │   │  PENGGUNA        │
│  PARTNERS    │   │  & ADMIN         │
├──────────────┤   ├──────────────────┤
│- Buat Travel │   │- Buat Admin      │
│- Edit Data   │   │- Buat Loket      │
│- Hapus Travel│   │- Buat Manager    │
│- List Travel │   │- Buat Driver 👨‍✈️ │
└──────────────┘   │- Buat Pengguna   │
                   └──────────────────┘
```

---

## 📈 DATABASE SCHEMA RELATIONSHIP

```
┌──────────────┐
│  TRAVELS     │ (Partner Travel)
│  - uid       │ PK: fa981222...
│  - name      │
│  - code      │
└────────┬─────┘
         │ 1:N
         │
    ┌────▼─────────────┐
    │  USERS           │ (Staff: Loket, Manager, Driver)
    │  - uid (PK)      │
    │  - email         │
    │  - role          │
    │  - travel_uid FK │
    └──────────────────┘

┌──────────────────┐
│  SCHEDULES       │ (Jadwal Perjalanan)
│  - uid (PK)      │
│  - travel_uid FK │
│  - driver_uid FK │ ✨ (Baru: Supir)
│  - origin        │
│  - destination   │
│  - depart_date   │
│  - depart_time   │
│  - price         │
│  - total_seats   │
└────────┬─────────┘
         │ 1:N
         │
    ┌────▼──────────────────────┐
    │  BOOKINGS                  │
    │  - uid (PK)                │
    │  - user_uid FK             │
    │  - schedule_uid FK         │
    │  - seat_number             │
    │  - passenger_name          │
    │  - passenger_phone         │
    │  - pickup_location ✨      │ (Baru: Lokasi Jemput)
    │  - dropoff_location ✨     │ (Baru: Lokasi Turun)
    │  - status (enum) ✨        │ (Baru: confirmed/cancelled/completed/no_show)
    │  - reschedule_history (JSON)
    │  - reschedule_count        │ (Baru: Hitung reschedule)
    │  - price                   │
    │  - created_at              │
    │  - cancelled_at            │
    │  - rescheduled_at          │
    └────────────────────────────┘

┌──────────────┐
│  SEAT_LOCKS  │
│  - schedule_uid FK
│  - seat_number
│  - session_id
│  - expires_at (5 menit TTL)
│  - UNIQUE(schedule_uid, seat_number) ✨
└──────────────┘
```

---

## 🔄 ALUR NOTIFIKASI EMAIL ✨

```
EVENT                    PENGIRIM EMAIL KE:
─────────────────────────────────────────────────
Booking Created    ──►   Penumpang (Konfirmasi)
                    └──► Loket (Notifikasi Baru)

Reschedule         ──►   Penumpang (Notif Ubah)
                    └──► Loket (Notif Ubah)

Cancel             ──►   Penumpang (Notif Batal)
                    └──► Loket (Notif Batal)
```

---

## ⏰ TIMELINE BOOKING (Contoh)

```
1 BULAN SEBELUM KEBERANGKATAN
├─ Penumpang bisa book ✅
├─ Bisa reschedule unlimited (diluar batas H-48)
└─ Bisa cancel unlimited (diluar batas H-24)

H-48 JAM (2 HARI SEBELUM)
├─ Cutoff reschedule! ❌
├─ Penumpang masih bisa cancel ✅
└─ Loket masih bisa reschedule (force)

H-24 JAM (1 HARI SEBELUM)
├─ Cutoff cancel untuk penumpang! ❌
├─ Loket bisa cancel (force)
└─ Loket dapat manifest lengkap

H-0 (HARI KEBERANGKATAN)
├─ Jadwal dimulai
├─ Supir lihat manifest
├─ Jemput penumpang
└─ Perjalanan dimulai

H+X (SETELAH PERJALANAN)
├─ Loket tandai COMPLETED
├─ Atau tandai NO_SHOW
└─ Booking archiv
```

---

## 👥 ROLE & PERMISSION MATRIX

```
FITUR                    PENGGUNA  LOKET   MANAGER  DRIVER  ADMIN
────────────────────────────────────────────────────────────────
Cari Jadwal              ✅        ✅      ✅       ✅      ✅
Booking Tiket            ✅        ✅      ✅       ❌      ✅
Lihat Tiket Saya         ✅        ✅      ✅       ❌      ✅
Reschedule               ✅        ✅      ✅       ❌      ✅
Cancel Booking           ✅        ✅      ✅       ❌      ✅
─────────────────────────────────────────────────────────────
Buat Jadwal              ❌        ✅      ❌       ❌      ✅
Kelola Jadwal            ❌        ✅      ✅       ❌      ✅
Assign Supir             ❌        ✅      ✅       ❌      ✅
Lihat Manifest           ❌        ✅      ✅       ✅      ✅
Tandai Completed         ❌        ✅      ✅       ❌      ✅
Tandai No-Show           ❌        ✅      ✅       ❌      ✅
─────────────────────────────────────────────────────────────
Lihat Jadwal Saya        ❌        ❌      ❌       ✅      ✅
Lihat Manifest Saya      ❌        ❌      ❌       ✅      ✅
─────────────────────────────────────────────────────────────
Kelola User              ❌        ❌      ❌       ❌      ✅
Kelola Travel            ❌        ❌      ❌       ❌      ✅
Buat Driver              ❌        ❌      ❌       ❌      ✅
```

---

## 💰 FINANCIAL FLOW

```
PENUMPANG
    │
    ├─ Book Tiket
    │  └─ Bayar: Rp 90.000 (langsung/tunda)
    │
    ├─ Reschedule (Harga naik)
    │  └─ Bayar tambahan: Rp 20.000 (surcharge)
    │
    ├─ Reschedule (Harga turun)
    │  └─ Refund: Rp 10.000 (potongan)
    │
    └─ Cancel (>H-24)
       └─ Refund: Rp 80.000 (full/sebagian sesuai policy)

TRAVEL (Revenue)
    ├─ Dari Booking: Rp 90.000
    ├─ Dari Surcharge: Rp 20.000
    └─ Dari Potongan: -Rp 10.000
       ───────────────────────
       TOTAL: Rp 100.000 / penumpang
```

---

## ✨ PERBAIKAN YANG SUDAH DIIMPLEMENTASIKAN

| # | Fitur | Status |
|---|-------|--------|
| 1 | Lokasi Jemput & Turun | ✅ Done |
| 2 | Batas Reschedule (Max 2x) | ✅ Done |
| 3 | Batas Waktu Reschedule (H-48) | ✅ Done |
| 4 | Batas Waktu Cancel (H-24) | ✅ Done |
| 5 | Aktor Supir (Driver) | ✅ Done |
| 6 | Status Booking Diperluas | ✅ Done |
| 7 | Manifest Penumpang | ✅ Done |
| 8 | Selisih Harga Reschedule | ✅ Done |
| 9 | DB Constraint Seat Lock | ✅ Done |
| 10 | Notifikasi Email Travel | ✅ Done |

