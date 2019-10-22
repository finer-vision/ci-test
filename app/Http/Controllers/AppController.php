<?php

namespace App\Http\Controllers;

class AppController extends Controller
{
    public function app()
    {
        $indexFile = public_path('build/index.html');
        if (!file_exists($indexFile)) {
            return abort(404, "File not found {$indexFile}");
        }
        return file_get_contents($indexFile);
    }
}
