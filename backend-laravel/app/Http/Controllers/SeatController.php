<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Schedule;
use App\Models\SeatLock;
use App\Models\Travel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    private const LOCK_TTL_SECONDS = 300; // 5 menit

    public function seats(Request $request, string $scheduleId): JsonResponse
    {
        $schedule = Schedule::where('uid', $scheduleId)->first();
        if (! $schedule) {
            return response()->json(['detail' => 'Jadwal tidak ditemukan'], 404);
        }

        // Hapus lock expired dulu
        SeatLock::purgeExpired();

        $sessionId  = $request->query('session_id');
        $travel     = Travel::where('uid', $schedule->travel_uid)->first();

        // Kursi yang sudah di-booking
        $takenSeats = Booking::where('schedule_uid', $scheduleId)
            ->where('status', '!=', 'cancelled')
            ->pluck('seat_number')
            ->map(fn($n) => (int) $n)
            ->values()
            ->toArray();

        // Kursi yang dikunci session lain (belum expired)
        $lockQuery = SeatLock::where('schedule_uid', $scheduleId)
            ->where('expires_at', '>', now());

        if ($sessionId) {
            $lockQuery->where('session_id', '!=', $sessionId);
        }

        $lockedByOthers = $lockQuery->pluck('seat_number')
            ->map(fn($n) => (int) $n)
            ->diff($takenSeats)   // jangan duplikat dengan taken
            ->values()
            ->toArray();

        return response()->json([
            'schedule'        => $schedule->toApiArray($travel),
            'travel'          => $travel?->toApiArray(),
            'taken_seats'     => $takenSeats,
            'locked_by_others'=> $lockedByOthers,
        ]);
    }

    public function lockSeat(Request $request, string $scheduleId): JsonResponse
    {
        $data = $request->validate([
            'seat_number' => 'required|integer|min:1',
            'session_id'  => 'required|string|min:6|max:64',
        ]);

        $schedule = Schedule::where('uid', $scheduleId)->first();
        if (! $schedule) {
            return response()->json(['detail' => 'Jadwal tidak ditemukan'], 404);
        }

        if ($data['seat_number'] < 1 || $data['seat_number'] > $schedule->total_seats) {
            return response()->json(['detail' => 'Nomor kursi tidak valid'], 400);
        }

        // Cek apakah sudah di-booking
        $booked = Booking::where('schedule_uid', $scheduleId)
            ->where('seat_number', $data['seat_number'])
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($booked) {
            return response()->json(['detail' => "Kursi {$data['seat_number']} sudah dipesan"], 400);
        }

        SeatLock::purgeExpired();

        // Cek lock dari session lain yang masih aktif
        $existingLock = SeatLock::where('schedule_uid', $scheduleId)
            ->where('seat_number', $data['seat_number'])
            ->where('session_id', '!=', $data['session_id'])
            ->where('expires_at', '>', now())
            ->first();

        if ($existingLock) {
            return response()->json(['detail' => "Kursi {$data['seat_number']} sedang dipilih pengguna lain"], 409);
        }

        $expiresAt = now()->addSeconds(self::LOCK_TTL_SECONDS);

        // Upsert lock milik session ini
        SeatLock::updateOrCreate(
            [
                'schedule_uid' => $scheduleId,
                'seat_number'  => $data['seat_number'],
                'session_id'   => $data['session_id'],
            ],
            [
                'expires_at' => $expiresAt,
                'locked_at'  => now(),
            ]
        );

        // Lepas lock lama milik session ini pada kursi lain di jadwal yang sama
        SeatLock::where('schedule_uid', $scheduleId)
            ->where('session_id', $data['session_id'])
            ->where('seat_number', '!=', $data['seat_number'])
            ->delete();

        return response()->json([
            'ok'          => true,
            'seat_number' => $data['seat_number'],
            'expires_at'  => $expiresAt->toISOString(),
        ]);
    }

    public function releaseSeat(Request $request, string $scheduleId): JsonResponse
    {
        $data = $request->validate([
            'seat_number' => 'required|integer|min:1',
            'session_id'  => 'required|string|min:6|max:64',
        ]);

        SeatLock::where('schedule_uid', $scheduleId)
            ->where('seat_number', $data['seat_number'])
            ->where('session_id', $data['session_id'])
            ->delete();

        return response()->json(['ok' => true]);
    }
}
