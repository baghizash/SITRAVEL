<?php

namespace App\Mail;

use App\Models\Booking;
use App\Models\Travel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Notifikasi ke pihak travel/loket saat ada perubahan booking.
 */
class BookingNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Booking $booking,
        public Travel $travel,
        public string $action, // 'created', 'rescheduled', 'cancelled'
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->action) {
            'created'     => "📋 Booking Baru: {$this->booking->booking_code}",
            'rescheduled' => "🔄 Booking Direscheduled: {$this->booking->booking_code}",
            'cancelled'   => "❌ Booking Dibatalkan: {$this->booking->booking_code}",
            default       => "Notifikasi Booking",
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.booking-notification');
    }

    public function attachments(): array
    {
        return [];
    }
}
