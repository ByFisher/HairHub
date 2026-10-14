#!/bin/sh
set -eu

: "${APP_KEY:?Set APP_KEY in the Render service environment before starting the API}"
: "${DB_URL:?Set DB_URL to the Render PostgreSQL internal connection string}"

: "${PORT:=10000}"
sed -i "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \\*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

php artisan migrate --force
php artisan storage:link --force
php artisan config:cache

exec apache2-foreground
