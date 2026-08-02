<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\City;
use App\Models\Schedule;
use App\Models\Travel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    // ── Kota-kota Riau ────────────────────────────────────────
    private const CITIES = [
        'Pekanbaru', 'Dumai', 'Duri', 'Bagansiapiapi', 'Rengat',
        'Bengkalis', 'Selatpanjang', 'Tembilahan', 'Bangkinang',
        'Pasir Pengaraian', 'Siak Sri Indrapura', 'Ujung Batu',
    ];

    // ── Travel Partners ───────────────────────────────────────
    private const TRAVELS = [
        ['code' => 'REX', 'name' => 'PO Riau Express',    'description' => 'Layanan travel andalan Pekanbaru - Dumai', 'contact' => '0761-11111'],
        ['code' => 'MLT', 'name' => 'Melayu Trans',        'description' => 'Nyaman ke pelosok Riau',                   'contact' => '0761-22222'],
        ['code' => 'SMP', 'name' => 'Sumatra Prima',       'description' => 'Armada baru, sopir berpengalaman',          'contact' => '0761-33333'],
        ['code' => 'BSA', 'name' => 'Bagansiapiapi Line',  'description' => 'Spesialis rute pesisir Rokan Hilir',        'contact' => '0762-44444'],
    ];

    // ── Rute + slot waktu + harga ─────────────────────────────
    private const ROUTES = [
        ['origin' => 'Pekanbaru',    'dest' => 'Dumai',           'slots' => [['07:00', 90000],  ['10:00', 90000],  ['13:00', 95000],  ['16:00', 95000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Duri',            'slots' => [['08:00', 75000],  ['14:00', 75000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Bagansiapiapi',   'slots' => [['06:00', 150000], ['12:00', 155000], ['18:00', 160000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Rengat',          'slots' => [['09:00', 110000], ['15:00', 115000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Bengkalis',       'slots' => [['07:30', 130000], ['13:30', 135000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Selatpanjang',    'slots' => [['08:30', 160000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Tembilahan',      'slots' => [['07:00', 170000], ['14:00', 175000]]],
        ['origin' => 'Dumai',        'dest' => 'Pekanbaru',       'slots' => [['07:00', 90000],  ['11:00', 90000],  ['15:00', 95000]]],
        ['origin' => 'Duri',         'dest' => 'Pekanbaru',       'slots' => [['06:00', 75000],  ['13:00', 75000]]],
        ['origin' => 'Bagansiapiapi','dest' => 'Pekanbaru',       'slots' => [['06:00', 150000], ['13:00', 155000]]],
        ['origin' => 'Dumai',        'dest' => 'Bagansiapiapi',   'slots' => [['08:00', 80000],  ['14:00', 85000]]],
    ];

    public function run(): void
    {
        // ── Cities ────────────────────────────────────────────
        foreach (self::CITIES as $name) {
            City::firstOrCreate(['name' => $name], ['province' => 'Riau']);
        }

        // ── Travel Partners ───────────────────────────────────
        $travelMap = [];
        foreach (self::TRAVELS as $t) {
            $travel = Travel::firstOrCreate(
                ['code' => $t['code']],
                ['uid' => (string) Str::uuid(), 'name' => $t['name'],
                 'description' => $t['description'], 'contact' => $t['contact']]
            );
            $travelMap[$t['code']] = $travel;
        }

        $travelCodes = array_keys($travelMap);

        // ── Users ─────────────────────────────────────────────
        $this->upsertUser(
            env('ADMIN_EMAIL', 'admin@sitravel.id'),
            'Admin Aplikasi',
            'admin_app',
            env('ADMIN_PASSWORD', 'Admin@2026')
        );

        $this->upsertUser('loket@sitravel.id',  'Admin Loket Riau Express', 'travel',   'Loket@2026',   $travelMap['REX']->uid);
        $this->upsertUser('loket2@sitravel.id', 'Admin Loket Melayu Trans', 'travel',   'Loket@2026',   $travelMap['MLT']->uid);
        $this->upsertUser('manager@sitravel.id','Kepala Riau Express',      'manager',  'Manager@2026', $travelMap['REX']->uid);
        $this->upsertUser('user@sitravel.id',   'Budi Santoso',             'pengguna', 'User@2026',    null, '081234567890');

        // ── Schedules: 14 hari ke depan ───────────────────────
        $today = Carbon::today();
        foreach (range(0, 13) as $i) {
            $date = $today->copy()->addDays($i)->format('Y-m-d');

            foreach (self::ROUTES as $routeIdx => $route) {
                foreach ($route['slots'] as $slotIdx => [$time, $price]) {
                    // Distribusi travel secara deterministik
                    $codeIdx    = (crc32($route['origin'] . $route['dest']) + $slotIdx) % count($travelCodes);
                    $travelCode = $travelCodes[abs($codeIdx)];
                    $travel     = $travelMap[$travelCode];

                    $exists = Schedule::where('travel_uid',  $travel->uid)
                        ->where('origin',      $route['origin'])
                        ->where('destination', $route['dest'])
                        ->where('depart_date', $date)
                        ->where('depart_time', $time)
                        ->exists();

                    if (! $exists) {
                        Schedule::create([
                            'travel_uid'  => $travel->uid,
                            'origin'      => $route['origin'],
                            'destination' => $route['dest'],
                            'depart_date' => $date,
                            'depart_time' => $time,
                            'price'       => $price,
                            'total_seats' => 16,
                            'vehicle'     => 'Minibus 16 Seat',
                        ]);
                    }
                }
            }
        }

        $this->command->info('✅ Seeder selesai: cities, travels, users, schedules.');
    }

    private function upsertUser(
        string $email, string $name, string $role, string $password,
        ?string $travelUid = null, string $phone = ''
    ): void {
        $existing = User::where('email', $email)->first();

        if ($existing) {
            // Refresh password jika berbeda
            if (! Hash::check($password, $existing->password)) {
                $existing->update(['password' => Hash::make($password)]);
            }
            return;
        }

        User::create([
            'uid'        => (string) Str::uuid(),
            'name'       => $name,
            'email'      => $email,
            'password'   => Hash::make($password),
            'role'       => $role,
            'phone'      => $phone,
            'travel_uid' => $travelUid,
        ]);
    }
}
