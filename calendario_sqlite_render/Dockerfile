FROM php:8.3-apache

# Habilita SQLite via PDO.
RUN docker-php-ext-install pdo_sqlite

# Render fornece a porta em PORT; usamos 10000 como padrão.
ENV PORT=10000

RUN sed -ri -e 's!/var/www/html!/var/www/html!g' /etc/apache2/sites-available/000-default.conf \
    && sed -ri -e 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf \
    && sed -ri -e 's/:80>/:10000>/' /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

COPY index.html style.css app.js api.php ./

# Pasta padrão para desenvolvimento local; no Render, monte o Persistent Disk em /var/data.
RUN mkdir -p /var/www/html/data && chown -R www-data:www-data /var/www/html/data

EXPOSE 10000
