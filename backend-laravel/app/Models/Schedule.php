<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Schedule extends Model
{
    protected $fillable = [
        'uid', 'travel_uid', 'driver_uid', 'origin', 'destination',
        'depart_date', 'depart_time', 'price', 'total_seats', 'vehicle',
    ];

    protected $hidden = ['id'];

    protected $casts = [
        'price'       => 'integer',
        'total_seats' => 'integer',
        'depart_date' => 'date:Y-m-d',
    ];

    protected static function booted(): void
    {
        static::creating(function (Schedule $s) {
            if (empty($s->uid)) {
                $s->uid = (string) Str::uuid();
            }
        });
    }

    public function travel(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Travel::class, 'travel_uid', 'uid');
    }

    public function bookedSeats(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Booking::class, 'schedule_uid', 'uid')
                    ->where('status', '!=', 'cancelled');
    }

    public function toApiArray(?Travel $travel = null, ?int $seatsAvailable = null, ?array $driver = null): array
    {
        return [
            'id'              => $this->uid,
            'travel_id'       => $this->travel_uid,
            'driver_uid'      => $this->driver_uid,
            'driver'          => $driver,
            'origin'          => $this->origin,
            'destination'     => $this->destination,
            'depart_date'     => $this->depart_date instanceof \Carbon\Carbon
                                    ? $this->depart_date->format('Y-m-d')
                                    : $this->depart_date,
            'depart_time'     => $this->depart_time,
            'price'           => (int) $this->price,
            'total_seats'     => (int) $this->total_seats,
            'vehicle'         => $this->vehicle,
            'travel'          => $travel?->toApiArray(),
            'seats_available' => $seatsAvailable,
            'created_at'      => $this->created_at?->toISOString(),
        ];
    }
}
