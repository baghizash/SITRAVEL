<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; background:#F5F2EC; color:#14281F; font-size:12px; }

  .ticket { width:520px; margin:20px auto; background:#fff; border-radius:12px; overflow:hidden; border:2px solid #1E3A2F; }

  .header { background:#1E3A2F; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
  .header-left h1 { color:#F2D06B; font-size:18px; letter-spacing:0.05em; }
  .header-left p  { color:#A8C5B5; font-size:10px; margin-top:2px; }
  .header-right   { text-align:right; }
  .status-badge   { background:#F2D06B; color:#14281F; padding:3px 10px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; }

  .route-bar { background:#F5F2EC; padding:14px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:2px dashed #E6E2D8; }
  .city { font-size:20px; font-weight:700; }
  .arrow { font-size:20px; color:#E6B325; }
  .date-time { text-align:right; font-size:11px; color:#4A5257; }
  .date-time strong { font-size:14px; color:#14281F; display:block; }

  .body { padding:16px 24px; display:flex; gap:20px; }
  .info-col { flex:1; }
  .info-row { margin-bottom:10px; }
  .info-label { font-size:9px; text-transform:uppercase; letter-spacing:0.15em; color:#7C8489; margin-bottom:2px; }
  .info-value { font-size:13px; font-weight:600; color:#14281F; }

  .qr-col { width:100px; text-align:center; }
  .qr-box { width:90px; height:90px; border:2px solid #1E3A2F; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#F5F2EC; }
  .qr-code { font-size:8px; color:#4A5257; word-break:break-all; text-align:center; padding:4px; font-family:monospace; }
  .qr-label { font-size:8px; color:#7C8489; margin-top:4px; }

  .code-bar { background:#1E3A2F; padding:10px 24px; display:flex; justify-content:space-between; align-items:center; }
  .booking-code { font-family:monospace; font-size:18px; font-weight:700; color:#F2D06B; letter-spacing:0.2em; }
  .seat-badge { background:#F2D06B; color:#14281F; padding:4px 14px; border-radius:999px; font-weight:700; font-size:13px; }

  .footer { background:#F5F2EC; padding:8px 24px; font-size:9px; color:#7C8489; text-align:center; border-top:1px solid #E6E2D8; }
</style>
</head>
<body>
<div class="ticket">

  {{-- Header --}}
  <div class="header">
    <div class="header-left">
      <h1>Si-Travel Riau</h1>
      <p>E-Tiket Perjalanan</p>
    </div>
    <div class="header-right">
      <span class="status-badge">CONFIRMED</span>
    </div>
  </div>

  {{-- Route Bar --}}
  <div class="route-bar">
    <div>
      <div style="font-size:9px;color:#7C8489;text-transform:uppercase;letter-spacing:0.1em;">Asal</div>
      <div class="city">{{ $booking->origin }}</div>
    </div>
    <div class="arrow">→</div>
    <div style="text-align:right;">
      <div style="font-size:9px;color:#7C8489;text-transform:uppercase;letter-spacing:0.1em;">Tujuan</div>
      <div class="city">{{ $booking->destination }}</div>
    </div>
    <div class="date-time">
      <strong>{{ $booking->depart_time }} WIB</strong>
      {{ \Carbon\Carbon::parse($booking->depart_date)->format('d M Y') }}
    </div>
  </div>

  {{-- Body --}}
  <div class="body">
    <div class="info-col">
      <div class="info-row">
        <div class="info-label">Penumpang</div>
        <div class="info-value">{{ $booking->passenger_name }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">No. HP</div>
        <div class="info-value">{{ $booking->passenger_phone }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Travel</div>
        <div class="info-value">{{ $travel?->name ?? '-' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Armada</div>
        <div class="info-value">{{ $schedule->vehicle ?? 'Minibus' }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Harga</div>
        <div class="info-value" style="color:#8B2520;">Rp{{ number_format($booking->price, 0, ',', '.') }}</div>
      </div>
      @if($booking->notes)
      <div class="info-row">
        <div class="info-label">Catatan</div>
        <div class="info-value">{{ $booking->notes }}</div>
      </div>
      @endif
    </div>

    {{-- QR Code area --}}
    <div class="qr-col">
      <div class="qr-box">
        <div class="qr-code">{{ $booking->booking_code }}</div>
      </div>
      <div class="qr-label">Tunjukkan ke petugas</div>
    </div>
  </div>

  {{-- Code Bar --}}
  <div class="code-bar">
    <span class="booking-code">{{ $booking->booking_code }}</span>
    <span class="seat-badge">Kursi #{{ $booking->seat_number }}</span>
  </div>

  {{-- Footer --}}
  <div class="footer">
    Harap tiba 15 menit sebelum jam keberangkatan &bull;
    Diterbitkan {{ now()->format('d M Y H:i') }} WIB &bull;
    Si-Travel Riau &copy; {{ now()->year }}
  </div>

</div>
</body>
</html>
