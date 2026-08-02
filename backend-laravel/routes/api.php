<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SeatController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TravelPartnerController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ---------- Root ----------
Route::get('/', fn() => response()->json(['message' => 'Si-Travel Riau API', 'version' => '2.0']));

// ---------- Auth ----------
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('logout',   [AuthController::class, 'logout'])->middleware('auth:api');
    Route::get('me',        [AuthController::class, 'me'])->middleware('auth:api');

    // Profil & password
    Route::put('profile',         [AuthController::class, 'updateProfile'])->middleware('auth:api');
    Route::put('change-password', [AuthController::class, 'changePassword'])->middleware('auth:api');
});

// ---------- Public ----------
Route::get('cities',  [CityController::class,  'index']);
Route::get('travels', [SearchController::class, 'travels']);
Route::get('search',  [SearchController::class, 'search']);

// Seats (public, butuh session_id query param)
Route::get('schedules/{scheduleId}/seats',        [SeatController::class, 'seats']);
Route::post('schedules/{scheduleId}/lock-seat',   [SeatController::class, 'lockSeat']);
Route::post('schedules/{scheduleId}/release-seat',[SeatController::class, 'releaseSeat']);

// ---------- Authenticated ----------
Route::middleware('auth:api')->group(function () {

    // Stats
    Route::get('stats', [StatsController::class, 'stats']);

    // Schedules
    Route::get('schedules',                [ScheduleController::class, 'index'])
        ->middleware('role:admin_app,travel,manager,driver');
    Route::post('schedules',               [ScheduleController::class, 'store'])
        ->middleware('role:admin_app,travel');
    Route::delete('schedules/{scheduleId}',[ScheduleController::class, 'destroy'])
        ->middleware('role:admin_app,travel');

    // Assign supir ke jadwal (loket / admin_app)
    Route::post('schedules/{scheduleId}/assign-driver', [DriverController::class, 'assignDriver'])
        ->middleware('role:admin_app,travel');

    // Driver routes
    Route::prefix('driver')->middleware('role:admin_app,travel,manager,driver')->group(function () {
        Route::get('schedules',                    [DriverController::class, 'mySchedules']);
        Route::get('schedules/{scheduleId}/manifest', [DriverController::class, 'manifest']);
        Route::get('list',                         [DriverController::class, 'listDrivers']);
    });

    // Bookings
    Route::post('bookings',                          [BookingController::class, 'store']);
    Route::get('bookings/me',                        [BookingController::class, 'myBookings']);
    Route::get('bookings',                           [BookingController::class, 'listAll'])
        ->middleware('role:admin_app,travel,manager');
    Route::get('bookings/{bookingId}',               [BookingController::class, 'show']);
    Route::post('bookings/{bookingId}/reschedule',   [BookingController::class, 'reschedule']);
    Route::post('bookings/{bookingId}/cancel',       [BookingController::class, 'cancel']);
    Route::post('bookings/{bookingId}/complete',     [BookingController::class, 'complete'])
        ->middleware('role:admin_app,travel,manager');
    Route::post('bookings/{bookingId}/no-show',      [BookingController::class, 'markNoShow'])
        ->middleware('role:admin_app,travel,manager');
    Route::get('bookings/{bookingId}/ticket.pdf',    [TicketController::class,  'download']);

    // Travel Partners
    Route::get('travel-partners',  [TravelPartnerController::class, 'index'])
        ->middleware('role:admin_app');
    Route::post('travel-partners', [TravelPartnerController::class, 'store'])
        ->middleware('role:admin_app');

    // Users (admin only)
    Route::get('users',  [UserController::class, 'index'])->middleware('role:admin_app');
    Route::post('users', [UserController::class, 'store'])->middleware('role:admin_app');
});
