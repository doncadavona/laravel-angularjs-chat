<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', 'HomeController@index');

Route::get('users/me', 'UsersController@me');
Route::resource('/users', 'UsersController');

Route::resource('/conversations', 'ConversationsController');
Route::resource('/conversations/{conversation_id}/messages', 'MessagesController');
