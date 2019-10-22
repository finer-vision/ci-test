FROM node:12.13

WORKDIR /var/www

ADD package.json /var/www

RUN npm install --no-progress --ignore-optional

ADD . /var/www
