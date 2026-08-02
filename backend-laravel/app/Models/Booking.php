<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    protected $fillable = [
        'uid', 'booking_code', 'user_uid', 'schedule_uid', 'travel_uid',
        'origin', 'destination', 'depart_date', 'depart_time',
        'price', 'seat_number', 'passenger_name', 'passenger_phone',
        'notes', 'status', 'reschedule_history', 'rescheduled_at', 'cancelled_at',
    ];

    protected $hidden = ['id'];

    protected $casts = [
        'price'               => 'integer',
        'seat_number'         => 'integer',
        'reschedule_history'  => 'array',
        'rescheduled_at'      => 'datetime',
        'cancelled_at'        => 'datetime',
        'depart_date'         => 'date:Y-m-d',
    ];

    protected static function booted(): void
    {
        static::creating(function (Booking $b) {
            if (empty($b->uid)) {
                $b->uid = (string) Str::uuid();
            }
            if (empty($b->booking_code)) {
                $b->booking_code = 'TR' . strtoupper(substr(str_replace('-', '', Str::uuid()), 0, 8));
            }
        });
    }

    public function travel(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Travel::class, 'travel_uid', 'uid');
    }

    public function toApiArray(?Travel $travel = null): array
    {
        return [
            'id'                 => $this->uid,
            'booking_code'       => $this->booking_code,
            'user_id'            => $this->user_uid,
            'schedule_id'        => $this->schedule_uid,
            'travel_id'          => $this->travel_uid,
            'origin'             => $this->origin,
            'destination'        => $this->destination,
            'depart_date'        => $this->depart_date instanceof \Carbon\Carbon
                                        ? $this->depart_date->format('Y-m-d')
                                        : $this->depart_date,
            'depart_time'        => $this->depart_time,
            'price'              => (int) $this->price,
            'seat_number'        => (int) $this->seat_number,
            'passenger_name'     => $this->passenger_name,
            'passenger_phone'    => $this->passenger_phone,
            'notes'              => $this->notes ?? '',
            'status'             => $this->status,
            'reschedule_history' => $this->reschedule_history ?? [],
            'rescheduled_at'     => $this->rescheduled_at?->toISOString(),
            'cancelled_at'       => $this->cancelled_at?->toISOString(),
            'travel'             => $travel?->toApiArray(),
            'created_at'         => $this->created_at?->toISOString(),
        ];
    }
}
