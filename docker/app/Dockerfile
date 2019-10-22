FROM php:7.2-fpm

RUN apt-get update --fix-missing
RUN apt-get install -y git curl cron openssl zip unzip build-essential zlib1g-dev libpng-dev

RUN docker-php-ext-configure pdo_mysql
RUN docker-php-ext-install pdo_mysql mbstring zip gd

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www

ADD composer.json /var/www

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN composer install --no-interaction --no-progress --no-scripts --no-autoloader

ADD . /var/www

RUN composer dump-autoload

CMD ["php-fpm"]
