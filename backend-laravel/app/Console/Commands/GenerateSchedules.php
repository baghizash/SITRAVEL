<?php

namespace App\Console\Commands;

use App\Models\Schedule;
use App\Models\Travel;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateSchedules extends Command
{
    protected $signature   = 'schedules:generate {--days=14 : Jumlah hari ke depan yang di-generate}';
    protected $description = 'Generate jadwal otomatis untuk N hari ke depan';

    private const ROUTES = [
        ['origin' => 'Pekanbaru',    'dest' => 'Dumai',          'slots' => [['07:00', 90000], ['10:00', 90000], ['13:00', 95000], ['16:00', 95000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Duri',           'slots' => [['08:00', 75000], ['14:00', 75000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Bagansiapiapi',  'slots' => [['06:00', 150000], ['12:00', 155000], ['18:00', 160000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Rengat',         'slots' => [['09:00', 110000], ['15:00', 115000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Bengkalis',      'slots' => [['07:30', 130000], ['13:30', 135000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Selatpanjang',   'slots' => [['08:30', 160000]]],
        ['origin' => 'Pekanbaru',    'dest' => 'Tembilahan',     'slots' => [['07:00', 170000], ['14:00', 175000]]],
        ['origin' => 'Dumai',        'dest' => 'Pekanbaru',      'slots' => [['07:00', 90000], ['11:00', 90000], ['15:00', 95000]]],
        ['origin' => 'Duri',         'dest' => 'Pekanbaru',      'slots' => [['06:00', 75000], ['13:00', 75000]]],
        ['origin' => 'Bagansiapiapi','dest' => 'Pekanbaru',      'slots' => [['06:00', 150000], ['13:00', 155000]]],
        ['origin' => 'Dumai',        'dest' => 'Bagansiapiapi',  'slots' => [['08:00', 80000], ['14:00', 85000]]],
    ];

    public function handle(): int
    {
        $days    = (int) $this->option('days');
        $today   = Carbon::today();
        $travels = Travel::all();

        if ($travels->isEmpty()) {
            $this->error('Tidak ada travel partner. Jalankan seeder dulu.');
            return 1;
        }

        $travelCodes = $travels->pluck('uid')->values()->toArray();
        $created     = 0;
        $skipped     = 0;

        for ($i = 0; $i < $days; $i++) {
            $date = $today->copy()->addDays($i)->format('Y-m-d');

            foreach (self::ROUTES as $routeIdx => $route) {
                foreach ($route['slots'] as $slotIdx => [$time, $price]) {
                    $codeIdx   = abs((crc32($route['origin'] . $route['dest']) + $slotIdx) % count($travelCodes));
                    $travelUid = $travelCodes[$codeIdx];

                    $exists = Schedule::where('travel_uid',  $travelUid)
                        ->where('origin',      $route['origin'])
                        ->where('destination', $route['dest'])
                        ->where('depart_date', $date)
                        ->where('depart_time', $time)
                        ->exists();

                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    Schedule::create([
                        'uid'         => (string) Str::uuid(),
                        'travel_uid'  => $travelUid,
                        'origin'      => $route['origin'],
                        'destination' => $route['dest'],
                        'depart_date' => $date,
                        'depart_time' => $time,
                        'price'       => $price,
                        'total_seats' => 16,
                        'vehicle'     => 'Minibus 16 Seat',
                    ]);
                    $created++;
                }
            }
        }

        $this->info("✅ Generate selesai: {$created} jadwal baru, {$skipped} sudah ada.");
        return 0;
    }
}
