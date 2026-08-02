<?php

namespace App\Mail;

use App\Models\Booking;
use App\Models\Travel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Booking $booking,
        public readonly ?Travel $travel = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "✅ Booking Dikonfirmasi — {$this->booking->booking_code}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-confirmed',
        );
    }
}
