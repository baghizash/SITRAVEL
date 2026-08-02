<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Travel extends Model
{
    protected $table    = 'travels';
    protected $fillable = ['uid', 'name', 'code', 'description', 'contact'];
    protected $hidden   = ['id'];

    protected static function booted(): void
    {
        static::creating(function (Travel $t) {
            if (empty($t->uid)) {
                $t->uid = (string) Str::uuid();
            }
        });
    }

    public function toApiArray(): array
    {
        return [
            'id'          => $this->uid,
            'name'        => $this->name,
            'code'        => $this->code,
            'description' => $this->description ?? '',
            'contact'     => $this->contact ?? '',
            'created_at'  => $this->created_at?->toISOString(),
        ];
    }
}
