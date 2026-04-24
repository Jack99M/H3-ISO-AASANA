<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Airport extends Model
{
    protected $fillable = [
        'code',
        'name',
        'city',
        'department',
    ];

    public function departuresAsOrigin(): HasMany
    {
        return $this->hasMany(Flight::class, 'origin_airport_id');
    }

    public function arrivalsAsDestination(): HasMany
    {
        return $this->hasMany(Flight::class, 'destination_airport_id');
    }
}
