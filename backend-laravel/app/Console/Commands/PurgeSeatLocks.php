<?php

namespace App\Console\Commands;

use App\Models\SeatLock;
use Illuminate\Console\Command;

class PurgeSeatLocks extends Command
{
    protected $signature   = 'seat-locks:purge';
    protected $description = 'Hapus semua seat lock yang sudah expired';

    public function handle(): int
    {
        $deleted = SeatLock::where('expires_at', '<', now())->delete();
        $this->info("✅ {$deleted} seat lock expired dihapus.");
        return 0;
    }
}
