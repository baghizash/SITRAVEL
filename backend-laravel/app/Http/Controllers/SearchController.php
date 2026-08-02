<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Schedule;
use App\Models\Travel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'origin'      => 'required|string',
            'destination' => 'required|string',
            'date'        => 'required|date_format:Y-m-d',
        ]);

        $schedules = Schedule::where('origin', $request->origin)
            ->where('destination', $request->destination)
            ->where('depart_date', $request->date)
            ->orderBy('depart_time')
            ->get();

        // Ambil semua travel sekaligus agar tidak N+1
        $travelMap = Travel::whereIn('uid', $schedules->pluck('travel_uid')->unique())
            ->get()->keyBy('uid');

        $results = $schedules->map(function (Schedule $s) use ($travelMap) {
            $booked = Booking::where('schedule_uid', $s->uid)
                ->where('status', '!=', 'cancelled')
                ->count();

            $travel = $travelMap[$s->travel_uid] ?? null;

            return array_merge(
                $s->toApiArray($travel, max(0, $s->total_seats - $booked)),
            );
        });

        return response()->json($results->values());
    }

    public function travels(): JsonResponse
    {
        $travels = Travel::orderBy('name')->get();
        return response()->json($travels->map->toApiArray()->values());
    }
}
