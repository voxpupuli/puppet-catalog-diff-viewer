FROM nginx

MAINTAINER raphael.pinson@camptocamp.com

RUN apt-get update \
  && apt-get install -y git \
  && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/camptocamp/puppet-catalog-diff-viewer.git /usr/share/nginx/html/catalog_diff
RUN mv /usr/share/nginx/html/catalog_diff/data /data
RUN ln -sf /data /usr/share/nginx/html/catalog_diff/data
RUN ln -sf /data/reportlist.json /usr/share/nginx/html/catalog_diff/reportlist.json

ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
