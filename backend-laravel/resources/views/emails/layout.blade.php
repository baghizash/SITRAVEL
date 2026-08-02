<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#F5F2EC; font-family:'Segoe UI',Arial,sans-serif; color:#14281F; }
  .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; border:1px solid #E6E2D8; }
  .header { background:#1E3A2F; padding:28px 32px; }
  .header h1 { margin:0; color:#F2D06B; font-size:22px; letter-spacing:0.05em; }
  .header p  { margin:4px 0 0; color:#A8C5B5; font-size:13px; }
  .body   { padding:28px 32px; }
  .badge  { display:inline-block; background:#1E3A2F; color:#F2D06B; border-radius:999px; padding:4px 14px; font-size:12px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:16px; }
  .badge.cancel { background:#8B2520; color:#fff; }
  .badge.reschedule { background:#B5871A; color:#fff; }
  h2 { margin:0 0 20px; font-size:20px; color:#14281F; }
  table.info { width:100%; border-collapse:collapse; margin-bottom:20px; }
  table.info td { padding:8px 0; font-size:14px; border-bottom:1px solid #F0EDE6; }
  table.info td:first-child { color:#7C8489; width:40%; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; }
  table.info td:last-child  { font-weight:600; color:#14281F; }
  .code { font-family:monospace; font-size:22px; font-weight:700; color:#1E3A2F; letter-spacing:0.15em; background:#F5F2EC; padding:12px 20px; border-radius:10px; display:inline-block; margin-bottom:20px; }
  .footer { background:#F5F2EC; padding:18px 32px; font-size:12px; color:#7C8489; border-top:1px solid #E6E2D8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Si-Travel Riau</h1>
    <p>Sistem Informasi Pemesanan Tiket Travel</p>
  </div>
  <div class="body">
    @yield('content')
  </div>
  <div class="footer">
    Email ini dikirim otomatis oleh sistem Si-Travel Riau. Jangan membalas email ini.
  </div>
</div>
</body>
</html>
