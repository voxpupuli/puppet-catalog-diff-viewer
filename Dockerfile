FROM nginx:latest

LABEL org.opencontainers.image.authors="voxpupuli@groups.io"

COPY entrypoint.sh /
COPY . /usr/share/nginx/html/

ENTRYPOINT [ "/entrypoint.sh" ]
