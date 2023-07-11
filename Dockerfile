FROM nginx:latest

LABEL org.opencontainers.image.authors="pmc@voxpupuli.org"

COPY . /usr/share/nginx/html/
