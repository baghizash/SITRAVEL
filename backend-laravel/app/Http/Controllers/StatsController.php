<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Schedule;
use App\Models\Travel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'admin_app') {
            $revenue = Booking::where('status', '!=', 'cancelled')->sum('price');
            return response()->json([
                'total_users'     => User::count(),
                'total_travels'   => Travel::count(),
                'total_schedules' => Schedule::count(),
                'total_bookings'  => Booking::where('status', '!=', 'cancelled')->count(),
                'revenue'         => (int) $revenue,
            ]);
        }

        if (in_array($user->role, ['travel', 'manager'])) {
            $travelUid = $user->travel_uid;
            $today     = now()->format('Y-m-d');
            $revenue   = Booking::where('travel_uid', $travelUid)
                ->where('status', '!=', 'cancelled')
                ->sum('price');

            return response()->json([
                'total_schedules' => Schedule::where('travel_uid', $travelUid)->count(),
                'total_bookings'  => Booking::where('travel_uid', $travelUid)
                    ->where('status', '!=', 'cancelled')->count(),
                'revenue'         => (int) $revenue,
                'today_bookings'  => Booking::where('travel_uid', $travelUid)
                    ->where('status', '!=', 'cancelled')
                    ->where('depart_date', $today)
                    ->count(),
            ]);
        }

        // pengguna
        $today = now()->format('Y-m-d');
        return response()->json([
            'my_bookings' => Booking::where('user_uid', $user->uid)->count(),
            'upcoming'    => Booking::where('user_uid', $user->uid)
                ->where('depart_date', '>=', $today)
                ->where('status', '!=', 'cancelled')
                ->count(),
        ]);
    }
}
