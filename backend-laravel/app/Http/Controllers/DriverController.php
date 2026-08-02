<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Schedule;
use App\Models\Travel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    /**
     * Jadwal yang ditugaskan ke supir ini.
     * Default: hanya hari ini; bisa query ?days=7 untuk seminggu ke depan.
     */
    public function mySchedules(Request $request): JsonResponse
    {
        $driver = $request->user();
        $days   = min((int) $request->query('days', 1), 30);
        $from   = Carbon::today();
        $to     = $from->copy()->addDays($days - 1)->endOfDay();

        $schedules = Schedule::where('driver_uid', $driver->uid)
            ->whereBetween('depart_date', [$from->format('Y-m-d'), $to->format('Y-m-d')])
            ->orderBy('depart_date')
            ->orderBy('depart_time')
            ->get();

        $travelMap = Travel::whereIn('uid', $schedules->pluck('travel_uid')->unique())
            ->get()->keyBy('uid');

        $result = $schedules->map(function (Schedule $s) use ($travelMap) {
            $booked = Booking::where('schedule_uid', $s->uid)
                ->where('status', '!=', 'cancelled')
                ->count();
            $arr           = $s->toApiArray($travelMap[$s->travel_uid] ?? null);
            $arr['booked'] = $booked;
            return $arr;
        });

        return response()->json($result->values());
    }

    /**
     * Manifest penumpang untuk jadwal tertentu — hanya jika supir ditugaskan.
     */
    public function manifest(Request $request, string $scheduleId): JsonResponse
    {
        $driver   = $request->user();
        $schedule = Schedule::where('uid', $scheduleId)->first();

        if (! $schedule) {
            return response()->json(['detail' => 'Jadwal tidak ditemukan'], 404);
        }

        // Supir hanya boleh lihat jadwal yang dia tangani
        if ($driver->role === 'driver' && $schedule->driver_uid !== $driver->uid) {
            return response()->json(['detail' => 'Anda tidak ditugaskan di jadwal ini'], 403);
        }

        $bookings = Booking::where('schedule_uid', $scheduleId)
            ->where('status', '!=', 'cancelled')
            ->orderBy('seat_number')
            ->get();

        $manifest = $bookings->map(fn($b) => [
            'seat_number'      => (int) $b->seat_number,
            'passenger_name'   => $b->passenger_name,
            'passenger_phone'  => $b->passenger_phone,
            'pickup_location'  => $b->pickup_location  ?? '-',
            'dropoff_location' => $b->dropoff_location ?? '-',
            'booking_code'     => $b->booking_code,
            'status'           => $b->status,
        ]);

        $travel = Travel::where('uid', $schedule->travel_uid)->first();

        return response()->json([
            'schedule' => $schedule->toApiArray($travel),
            'manifest' => $manifest->values(),
            'total'    => $manifest->count(),
        ]);
    }

    /**
     * Daftar semua supir milik travel yang sama (untuk loket/manager).
     */
    public function listDrivers(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = User::where('role', 'driver');

        // travel & manager hanya lihat supir milik travel mereka
        if (in_array($user->role, ['travel', 'manager']) && $user->travel_uid) {
            $query->where('travel_uid', $user->travel_uid);
        }

        $drivers = $query->orderBy('name')->get();

        return response()->json(
            $drivers->map(fn($d) => $d->toApiArray())->values()
        );
    }

    /**
     * Assign supir ke jadwal (hanya loket/travel atau admin_app).
     */
    public function assignDriver(Request $request, string $scheduleId): JsonResponse
    {
        $user     = $request->user();
        $schedule = Schedule::where('uid', $scheduleId)->first();

        if (! $schedule) {
            return response()->json(['detail' => 'Jadwal tidak ditemukan'], 404);
        }

        // Loket hanya boleh assign ke jadwal miliknya
        if ($user->role === 'travel' && $schedule->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Bukan jadwal Anda'], 403);
        }

        $data = $request->validate([
            'driver_uid' => 'nullable|string', // null = lepas assignment
        ]);

        // Jika driver_uid diisi, pastikan supir itu milik travel yang sama
        if (! empty($data['driver_uid'])) {
            $driver = User::where('uid', $data['driver_uid'])
                ->where('role', 'driver')
                ->first();

            if (! $driver) {
                return response()->json(['detail' => 'Supir tidak ditemukan'], 404);
            }

            if ($driver->travel_uid !== $schedule->travel_uid) {
                return response()->json(['detail' => 'Supir tidak terdaftar di travel ini'], 400);
            }
        }

        $schedule->update(['driver_uid' => $data['driver_uid'] ?? null]);
        $schedule->refresh();

        $travel = Travel::where('uid', $schedule->travel_uid)->first();
        $driverUser = ! empty($schedule->driver_uid)
            ? User::where('uid', $schedule->driver_uid)->first()
            : null;

        return response()->json($schedule->toApiArray(
            $travel,
            null,
            $driverUser ? $driverUser->toApiArray() : null
        ));
    }
}
