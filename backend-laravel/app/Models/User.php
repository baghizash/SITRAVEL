<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    protected $fillable = [
        'uid', 'name', 'email', 'password', 'role', 'phone', 'travel_uid',
    ];

    protected $hidden = ['password', 'id'];

    protected $casts = ['email_verified_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->uid)) {
                $user->uid = (string) Str::uuid();
            }
        });
    }

    // JWTSubject
    public function getJWTIdentifier(): mixed
    {
        return $this->uid;
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'email' => $this->email,
            'role'  => $this->role,
        ];
    }

    /**
     * Override: JWT guard akan mencari user berdasarkan kolom ini.
     * Kita pakai 'uid' bukan 'id' (integer PK).
     */
    public function getAuthIdentifierName(): string
    {
        return 'uid';
    }

    public function getAuthIdentifier(): mixed
    {
        return $this->uid;
    }

    // Helpers
    public function travel(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Travel::class, 'travel_uid', 'uid');
    }

    public function toApiArray(): array
    {
        return [
            'id'         => $this->uid,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role,
            'phone'      => $this->phone ?? '',
            'travel_id'  => $this->travel_uid,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
