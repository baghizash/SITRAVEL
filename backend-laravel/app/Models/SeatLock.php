<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeatLock extends Model
{
    public $timestamps = false;

    protected $fillable = ['schedule_uid', 'seat_number', 'session_id', 'expires_at', 'locked_at'];

    protected $casts = [
        'seat_number' => 'integer',
        'expires_at'  => 'datetime',
        'locked_at'   => 'datetime',
    ];

    /** Hapus semua lock yang sudah expired. */
    public static function purgeExpired(): void
    {
        static::where('expires_at', '<', now())->delete();
    }

    /** Apakah lock ini masih aktif? */
    public function isActive(): bool
    {
        return $this->expires_at > now();
    }
}
