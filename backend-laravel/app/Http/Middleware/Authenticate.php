<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Selalu kembalikan null agar tidak pernah redirect ke route 'login',
     * sehingga AuthenticationException dilempar dan ditangani oleh exception handler
     * sebagai JSON 401.
     */
    protected function redirectTo(Request $request): ?string
    {
        return null;
    }
}
