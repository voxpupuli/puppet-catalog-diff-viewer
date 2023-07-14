#!/bin/sh

if test -n "$S3_BUCKET" ; then
  cat << EOF > /usr/share/nginx/html/s3_credentials.js
var s3_bucketName = '${S3_BUCKET}';
var s3_access_key = '${S3_ACCESS_KEY}';
var s3_secret_key = '${S3_SECRET_KEY}';
var s3_host = '${S3_HOST}'; // S3 host, when self hosting s3
var s3_bucketPathPrefix = '${S3_BUCKET_PATH_PREFIX}'; // S3 bucket path prefix
var s3_ForcePathStyle = ${S3_FORCE_PATH_STYLE}; // true or false
EOF
fi

nginx -g "daemon off;"
