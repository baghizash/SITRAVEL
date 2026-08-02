<?php

namespace App\Http\Controllers;

use App\Mail\BookingCancelled;
use App\Mail\BookingConfirmed;
use App\Mail\BookingRescheduled;
use App\Models\Booking;
use App\Models\Schedule;
use App\Models\SeatLock;
use App\Models\Travel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'schedule_id'      => 'required|string',
            'seat_number'      => 'required|integer|min:1',
            'passenger_name'   => 'required|string',
            'passenger_phone'  => 'required|string',
            'notes'            => 'nullable|string',
            'pickup_location'  => 'required|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
        ]);

        $schedule = Schedule::where('uid', $data['schedule_id'])->first();
        if (! $schedule) {
            return response()->json(['detail' => 'Jadwal tidak ditemukan'], 404);
        }

        // Validasi: tidak boleh booking jadwal yang sudah lewat
        $departDate = Carbon::parse($schedule->depart_date)->startOfDay();
        if ($departDate->lt(Carbon::today())) {
            return response()->json(['detail' => 'Tidak dapat memesan jadwal yang sudah lewat'], 400);
        }

        if ($data['seat_number'] < 1 || $data['seat_number'] > $schedule->total_seats) {
            return response()->json(['detail' => 'Nomor kursi tidak valid'], 400);
        }

        $taken = Booking::where('schedule_uid', $data['schedule_id'])
            ->where('seat_number', $data['seat_number'])
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($taken) {
            return response()->json(['detail' => "Kursi {$data['seat_number']} sudah dipesan"], 400);
        }

        $travel  = Travel::where('uid', $schedule->travel_uid)->first();
        $booking = Booking::create([
            'user_uid'        => $user->uid,
            'schedule_uid'    => $schedule->uid,
            'travel_uid'      => $schedule->travel_uid,
            'origin'          => $schedule->origin,
            'destination'     => $schedule->destination,
            'depart_date'     => $schedule->depart_date,
            'depart_time'     => $schedule->depart_time,
            'price'           => $schedule->price,
            'seat_number'     => $data['seat_number'],
            'passenger_name'  => $data['passenger_name'],
            'passenger_phone' => $data['passenger_phone'],
            'notes'           => $data['notes'] ?? '',
            'pickup_location' => $data['pickup_location'],
            'dropoff_location'=> $data['dropoff_location'] ?? $schedule->destination,
            'status'          => 'confirmed',
        ]);

        // Lepas semua lock pada kursi yang baru dipesan
        SeatLock::where('schedule_uid', $data['schedule_id'])
            ->where('seat_number', $data['seat_number'])
            ->delete();

        // Kirim email konfirmasi (silent — tidak gagalkan request jika mail error)
        try {
            $owner = User::where('uid', $user->uid)->first();
            if ($owner?->email) {
                Mail::to($owner->email)->send(new BookingConfirmed($booking, $travel));
            }
        } catch (\Exception) {}

        return response()->json($booking->toApiArray($travel), 201);
    }

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = Booking::where('user_uid', $request->user()->uid)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(
            $bookings->map(fn($b) => $b->toApiArray())->values()
        );
    }

    public function listAll(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Booking::query();

        if (in_array($user->role, ['travel', 'manager']) && $user->travel_uid) {
            $query->where('travel_uid', $user->travel_uid);
        }

        // Supir tidak bisa akses endpoint ini — mereka pakai /driver/schedules/{id}/manifest
        $bookings = $query->orderBy('created_at', 'desc')->get();

        return response()->json(
            $bookings->map(fn($b) => $b->toApiArray())->values()
        );
    }

    public function show(Request $request, string $bookingId): JsonResponse
    {
        $user    = $request->user();
        $booking = Booking::where('uid', $bookingId)->first();

        if (! $booking) {
            return response()->json(['detail' => 'Booking tidak ditemukan'], 404);
        }

        if ($user->role === 'pengguna' && $booking->user_uid !== $user->uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if (in_array($user->role, ['travel', 'manager']) && $booking->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        $travel = Travel::where('uid', $booking->travel_uid)->first();

        return response()->json($booking->toApiArray($travel));
    }

    // ── Konstanta kebijakan ──────────────────────────────────────────────────
    private const MAX_RESCHEDULE        = 2;    // maks berapa kali reschedule
    private const RESCHEDULE_DEADLINE_H = 48;   // jam sebelum keberangkatan SAAT INI
    private const CANCEL_DEADLINE_H     = 24;   // jam sebelum keberangkatan SAAT INI

    public function reschedule(Request $request, string $bookingId): JsonResponse
    {
        $user    = $request->user();
        $booking = Booking::where('uid', $bookingId)->first();

        if (! $booking) {
            return response()->json(['detail' => 'Booking tidak ditemukan'], 404);
        }

        if ($user->role === 'pengguna' && $booking->user_uid !== $user->uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if (in_array($user->role, ['travel', 'manager']) && $booking->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['detail' => 'Booking sudah dibatalkan, tidak bisa dijadwalkan ulang'], 400);
        }

        // ── Batas jumlah reschedule ──────────────────────────────────────────
        $rescheduleCount = count($booking->reschedule_history ?? []);
        if ($rescheduleCount >= self::MAX_RESCHEDULE) {
            return response()->json([
                'detail' => "Reschedule sudah mencapai batas maksimum (" . self::MAX_RESCHEDULE . "x). Hubungi loket untuk bantuan lebih lanjut.",
            ], 400);
        }

        // ── Batas waktu reschedule (H-48 dari keberangkatan saat ini) ────────
        // Pengguna biasa terikat batas waktu; travel/manager boleh override
        if ($user->role === 'pengguna') {
            $departAt  = Carbon::parse($booking->depart_date->format('Y-m-d') . ' ' . $booking->depart_time);
            $hoursLeft = now()->diffInHours($departAt, false); // negatif jika sudah lewat
            if ($hoursLeft < self::RESCHEDULE_DEADLINE_H) {
                return response()->json([
                    'detail' => "Reschedule hanya bisa dilakukan minimal " . self::RESCHEDULE_DEADLINE_H . " jam sebelum keberangkatan. Keberangkatan Anda pada {$departAt->format('d M Y H:i')}.",
                ], 400);
            }
        }

        $data = $request->validate([
            'new_schedule_id'  => 'required|string',
            'new_seat_number'  => 'required|integer|min:1',
            'pickup_location'  => 'nullable|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
        ]);

        $newSched = Schedule::where('uid', $data['new_schedule_id'])->first();
        if (! $newSched) {
            return response()->json(['detail' => 'Jadwal baru tidak ditemukan'], 404);
        }

        // Validasi: jadwal baru tidak boleh sudah lewat
        $newDepartDate = Carbon::parse($newSched->depart_date)->startOfDay();
        if ($newDepartDate->lt(Carbon::today())) {
            return response()->json(['detail' => 'Tidak dapat reschedule ke jadwal yang sudah lewat'], 400);
        }

        if ($newSched->origin !== $booking->origin || $newSched->destination !== $booking->destination) {
            return response()->json(['detail' => 'Rute jadwal baru harus sama dengan booking asli'], 400);
        }

        if ($data['new_seat_number'] < 1 || $data['new_seat_number'] > $newSched->total_seats) {
            return response()->json(['detail' => 'Nomor kursi tidak valid'], 400);
        }

        $origDate    = $booking->depart_date instanceof \Carbon\Carbon
            ? $booking->depart_date->format('Y-m-d') : $booking->depart_date;
        $newDate     = $newSched->depart_date instanceof \Carbon\Carbon
            ? $newSched->depart_date->format('Y-m-d') : $newSched->depart_date;
        $sameSchedule = $newSched->uid === $booking->schedule_uid;
        $sameSeat     = $data['new_seat_number'] === (int) $booking->seat_number;

        if ($sameSchedule && $sameSeat) {
            return response()->json(['detail' => 'Jadwal & kursi tujuan sama dengan booking saat ini'], 400);
        }

        $taken = Booking::where('schedule_uid', $data['new_schedule_id'])
            ->where('seat_number', $data['new_seat_number'])
            ->where('status', '!=', 'cancelled')
            ->where('uid', '!=', $bookingId)
            ->exists();

        if ($taken) {
            return response()->json(['detail' => "Kursi {$data['new_seat_number']} sudah dipesan"], 400);
        }

        // Simpan history — catat juga harga lama untuk selisih
        $oldPrice  = (int) $booking->price;
        $history   = $booking->reschedule_history ?? [];
        $history[] = [
            'schedule_id'  => $booking->schedule_uid,
            'depart_date'  => $origDate,
            'depart_time'  => $booking->depart_time,
            'seat_number'  => (int) $booking->seat_number,
            'price'        => $oldPrice,
            'changed_at'   => now()->toISOString(),
        ];

        $booking->update([
            'schedule_uid'        => $newSched->uid,
            'travel_uid'          => $newSched->travel_uid,
            'depart_date'         => $newDate,
            'depart_time'         => $newSched->depart_time,
            'seat_number'         => $data['new_seat_number'],
            'price'               => $newSched->price,
            'pickup_location'     => $data['pickup_location'] ?? $booking->pickup_location,
            'dropoff_location'    => $data['dropoff_location'] ?? $booking->dropoff_location,
            'rescheduled_at'      => now(),
            'reschedule_history'  => $history,
        ]);

        // Lepas lock pada kursi baru
        SeatLock::where('schedule_uid', $data['new_schedule_id'])
            ->where('seat_number', $data['new_seat_number'])
            ->delete();

        $booking->refresh();
        $travel = Travel::where('uid', $booking->travel_uid)->first();

        // Kirim email reschedule
        try {
            $owner = User::where('uid', $booking->user_uid)->first();
            if ($owner?->email) {
                Mail::to($owner->email)->send(new BookingRescheduled($booking, $travel));
            }
        } catch (\Exception) {}

        $result               = $booking->toApiArray($travel);
        $result['price_diff'] = $newSched->price - $oldPrice;

        return response()->json($result);
    }

    public function cancel(Request $request, string $bookingId): JsonResponse
    {
        $user    = $request->user();
        $booking = Booking::where('uid', $bookingId)->first();

        if (! $booking) {
            return response()->json(['detail' => 'Booking tidak ditemukan'], 404);
        }

        if ($user->role === 'pengguna' && $booking->user_uid !== $user->uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if (in_array($user->role, ['travel', 'manager']) && $booking->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['detail' => 'Booking sudah dibatalkan'], 400);
        }

        // ── Batas waktu pembatalan (H-24 dari keberangkatan) ────────────────
        // Pengguna biasa terikat batas waktu; travel/manager boleh override
        if ($user->role === 'pengguna') {
            $departAt  = Carbon::parse($booking->depart_date->format('Y-m-d') . ' ' . $booking->depart_time);
            $hoursLeft = now()->diffInHours($departAt, false);
            if ($hoursLeft < self::CANCEL_DEADLINE_H) {
                return response()->json([
                    'detail' => "Pembatalan hanya bisa dilakukan minimal " . self::CANCEL_DEADLINE_H . " jam sebelum keberangkatan. Keberangkatan Anda pada {$departAt->format('d M Y H:i')}.",
                ], 400);
            }
        }

        $booking->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $booking->refresh();

        // Kirim email pembatalan
        try {
            $owner = User::where('uid', $booking->user_uid)->first();
            if ($owner?->email) {
                Mail::to($owner->email)->send(new BookingCancelled($booking));
            }
        } catch (\Exception) {}

        return response()->json($booking->toApiArray());
    }

    /**
     * Tandai booking sebagai selesai (hanya loket/manager/admin).
     */
    public function complete(Request $request, string $bookingId): JsonResponse
    {
        $user    = $request->user();
        $booking = Booking::where('uid', $bookingId)->first();

        if (! $booking) {
            return response()->json(['detail' => 'Booking tidak ditemukan'], 404);
        }

        if (in_array($user->role, ['travel', 'manager']) && $booking->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if ($booking->status !== 'confirmed') {
            return response()->json(['detail' => "Booking berstatus '{$booking->status}', tidak bisa ditandai selesai"], 400);
        }

        $booking->update(['status' => 'completed']);
        $booking->refresh();

        return response()->json($booking->toApiArray());
    }

    /**
     * Tandai booking sebagai no-show (hanya loket/manager/admin).
     */
    public function markNoShow(Request $request, string $bookingId): JsonResponse
    {
        $user    = $request->user();
        $booking = Booking::where('uid', $bookingId)->first();

        if (! $booking) {
            return response()->json(['detail' => 'Booking tidak ditemukan'], 404);
        }

        if (in_array($user->role, ['travel', 'manager']) && $booking->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if ($booking->status !== 'confirmed') {
            return response()->json(['detail' => "Booking berstatus '{$booking->status}', tidak bisa ditandai no-show"], 400);
        }

        $booking->update(['status' => 'no_show']);
        $booking->refresh();

        return response()->json($booking->toApiArray());
    }
}
