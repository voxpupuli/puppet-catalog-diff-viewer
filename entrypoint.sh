#!/bin/sh

if test -n "$S3_BUCKET" ; then
  cat << EOF > /usr/share/nginx/html/s3_credentials.js
const s3_bucketName = '${S3_BUCKET}';
const s3_access_key = '${S3_ACCESS_KEY}';
const s3_secret_key = '${S3_SECRET_KEY}';
const s3_endpoint   = '${S3_ENDPOINT}'; // S3 host/endpoint
const s3_bucketPathPrefix = '${S3_BUCKET_PATH_PREFIX}'; // S3 bucket path prefix
const s3_ForcePathStyle   = ${S3_FORCE_PATH_STYLE}; // true or false
EOF
fi

exec "$@"
