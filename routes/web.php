<?php

use Illuminate\Support\Facades\Route;

Route::get('{uri?}', 'AppController@app')->where(['uri' => '^(?!api).*$'])->name('app');
