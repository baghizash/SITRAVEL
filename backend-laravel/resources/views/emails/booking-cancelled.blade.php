@extends('emails.layout')

@section('content')
<span class="badge cancel">❌ Booking Dibatalkan</span>
<h2>Booking Anda telah dibatalkan.</h2>

<div class="code">{{ $booking->booking_code }}</div>

<table class="info">
  <tr><td>Penumpang</td><td>{{ $booking->passenger_name }}</td></tr>
  <tr><td>Rute</td><td>{{ $booking->origin }} → {{ $booking->destination }}</td></tr>
  <tr><td>Tanggal</td><td>{{ \Carbon\Carbon::parse($booking->depart_date)->translatedFormat('l, d F Y') }}</td></tr>
  <tr><td>Jam</td><td>{{ $booking->depart_time }} WIB</td></tr>
  <tr><td>Kursi</td><td>#{{ $booking->seat_number }}</td></tr>
  <tr><td>Dibatalkan</td><td>{{ now()->translatedFormat('d F Y, H:i') }} WIB</td></tr>
</table>

<p style="font-size:13px;color:#4A5257;">
  Jika Anda tidak merasa membatalkan booking ini, segera hubungi kami.
</p>
@endsection
