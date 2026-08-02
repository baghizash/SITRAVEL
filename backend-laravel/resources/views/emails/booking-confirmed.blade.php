@extends('emails.layout')

@section('content')
<span class="badge">✅ Booking Dikonfirmasi</span>
<h2>Perjalanan Anda telah berhasil dipesan!</h2>

<div class="code">{{ $booking->booking_code }}</div>

<table class="info">
  <tr><td>Penumpang</td><td>{{ $booking->passenger_name }}</td></tr>
  <tr><td>Rute</td><td>{{ $booking->origin }} → {{ $booking->destination }}</td></tr>
  <tr><td>Tanggal</td><td>{{ \Carbon\Carbon::parse($booking->depart_date)->translatedFormat('l, d F Y') }}</td></tr>
  <tr><td>Jam Berangkat</td><td>{{ $booking->depart_time }} WIB</td></tr>
  <tr><td>Nomor Kursi</td><td>#{{ $booking->seat_number }}</td></tr>
  <tr><td>Travel</td><td>{{ $travel?->name ?? '-' }}</td></tr>
  <tr><td>Total Bayar</td><td>Rp{{ number_format($booking->price, 0, ',', '.') }}</td></tr>
  <tr><td>Status</td><td><strong style="color:#1E3A2F">CONFIRMED</strong></td></tr>
</table>

<p style="font-size:13px;color:#4A5257;">
  Harap tiba di titik penjemputan <strong>15 menit sebelum</strong> jam keberangkatan.
  Tunjukkan kode booking ini kepada petugas.
</p>
@endsection
