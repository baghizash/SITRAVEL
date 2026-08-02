<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Generate jadwal otomatis setiap hari tengah malam
// Selalu generate 14 hari ke depan agar tidak pernah kosong
Schedule::command('schedules:generate --days=14')->dailyAt('00:05');

// Bersihkan seat locks yang expired setiap 10 menit
Schedule::command('seat-locks:purge')->everyTenMinutes();
