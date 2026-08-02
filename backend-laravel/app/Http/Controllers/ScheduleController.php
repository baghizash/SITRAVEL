<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Schedule;
use App\Models\Travel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Schedule::query();

        if (in_array($user->role, ['travel', 'manager']) && $user->travel_uid) {
            $query->where('travel_uid', $user->travel_uid);
        }

        $schedules = $query->orderBy('depart_date')->orderBy('depart_time')->get();
        $travelMap = Travel::whereIn('uid', $schedules->pluck('travel_uid')->unique())
            ->get()->keyBy('uid');

        $results = $schedules->map(function (Schedule $s) use ($travelMap) {
            $booked = Booking::where('schedule_uid', $s->uid)
                ->where('status', '!=', 'cancelled')->count();
            $arr          = $s->toApiArray($travelMap[$s->travel_uid] ?? null);
            $arr['booked'] = $booked;
            return $arr;
        });

        return response()->json($results->values());
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'travel_id'   => 'required|string',
            'origin'      => 'required|string',
            'destination' => 'required|string',
            'depart_date' => 'required|date_format:Y-m-d',
            'depart_time' => 'required|string',
            'price'       => 'required|integer|min:0',
            'total_seats' => 'nullable|integer|min:1',
            'vehicle'     => 'nullable|string',
        ]);

        if ($user->role === 'travel') {
            if (!$user->travel_uid || $user->travel_uid !== $data['travel_id']) {
                return response()->json(['detail' => 'Hanya bisa membuat jadwal untuk travel Anda'], 403);
            }
        }

        $travel = Travel::where('uid', $data['travel_id'])->first();
        if (! $travel) {
            return response()->json(['detail' => 'Travel tidak ditemukan'], 404);
        }

        $schedule = Schedule::create([
            'travel_uid'  => $data['travel_id'],
            'origin'      => $data['origin'],
            'destination' => $data['destination'],
            'depart_date' => $data['depart_date'],
            'depart_time' => $data['depart_time'],
            'price'       => $data['price'],
            'total_seats' => $data['total_seats'] ?? 20,
            'vehicle'     => $data['vehicle'] ?? 'Minibus',
        ]);

        return response()->json($schedule->toApiArray($travel), 201);
    }

    public function destroy(Request $request, string $scheduleId): JsonResponse
    {
        $user     = $request->user();
        $schedule = Schedule::where('uid', $scheduleId)->first();

        if (! $schedule) {
            return response()->json(['detail' => 'Jadwal tidak ditemukan'], 404);
        }

        if ($user->role === 'travel' && $schedule->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Bukan jadwal Anda'], 403);
        }

        $schedule->delete();

        return response()->json(['ok' => true]);
    }
}
