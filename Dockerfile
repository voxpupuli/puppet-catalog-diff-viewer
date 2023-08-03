FROM nginx:latest

LABEL org.opencontainers.image.authors="pmc@voxpupuli.org"

COPY entrypoint.sh /
COPY . /usr/share/nginx/html/

ENTRYPOINT [ "/entrypoint.sh" ]
