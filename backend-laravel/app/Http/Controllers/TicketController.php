<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Schedule;
use App\Models\Travel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TicketController extends Controller
{
    /**
     * Generate PDF e-tiket untuk booking tertentu.
     * GET /api/bookings/{bookingId}/ticket.pdf
     */
    public function download(Request $request, string $bookingId): Response|\Illuminate\Http\JsonResponse
    {
        $user    = $request->user();
        $booking = Booking::where('uid', $bookingId)->first();

        if (! $booking) {
            return response()->json(['detail' => 'Booking tidak ditemukan'], 404);
        }

        // Hanya pemilik atau admin/travel yang boleh download
        if ($user->role === 'pengguna' && $booking->user_uid !== $user->uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if (in_array($user->role, ['travel', 'manager']) && $booking->travel_uid !== $user->travel_uid) {
            return response()->json(['detail' => 'Akses ditolak'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['detail' => 'Tiket sudah dibatalkan'], 400);
        }

        $travel   = Travel::where('uid', $booking->travel_uid)->first();
        $schedule = Schedule::where('uid', $booking->schedule_uid)->first();

        $pdf = Pdf::loadView('pdf.eticket', compact('booking', 'travel', 'schedule'))
            ->setPaper([0, 0, 595, 320], 'landscape')  // custom ukuran tiket
            ->setOptions([
                'defaultFont'       => 'DejaVu Sans',
                'isRemoteEnabled'   => false,
                'isFontSubsettingEnabled' => true,
            ]);

        $filename = "etiket-{$booking->booking_code}.pdf";

        return $pdf->download($filename);
    }
}
