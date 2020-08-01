Puppet Catalog Diff Viewer
===========================

[![Docker Pulls](https://img.shields.io/docker/pulls/camptocamp/puppet-catalog-diff-viewer.svg)](https://hub.docker.com/r/camptocamp/puppet-catalog-diff-viewer/)
[![Build Status](https://img.shields.io/travis/camptocamp/puppet-catalog-diff-viewer/master.svg)](https://travis-ci.org/camptocamp/puppet-catalog-diff-viewer)
[![By Camptocamp](https://img.shields.io/badge/by-camptocamp-fb7047.svg)](http://www.camptocamp.com)


A viewer for json reports produced by [the puppet-catalog-diff tool](https://github.com/camptocamp/puppet-catalog-diff)

The interface can be tried online at http://camptocamp.github.io/puppet-catalog-diff-viewer.

Acking diffs
------------

This interface allows to ack differences in order to ease the report review. Differences are acked on all nodes that have the same resource with the same diff.

A global acking button is available for sections which allows to ack all diffs in the section at once.

Starring diffs
--------------

When using the global acking button, you might want to exclude some diffs from the global acking. Starring diffs does just that. Just as for acks, stars are cross-nodes.

Using with Docker
-----------------

```shell
$ docker run -ti -p 8080:8080 camptocamp/puppet-catalog-diff-viewer
```

will let you access the catalog diff viewer at [http://localhost:8080](http://localhost:8080).

Server Side storage
-------------------

The will automatically populate the drop-down list of available reports, if they can be read from `reportlist.json`.
This file contains a record of the json files in `data`.
Assuming you have
```
data/
  file1.json
  file2.json
```
the `reportlist.json` should have the format
```json
{
  "First Report": "file1",
  "Second Report": "file2"
}
```
The python script `generate_reportlist.py` will autopopulate it with all `data/*.json` using the filename also as key.

With the docker image, you can put everything in `/data`:

```shell
$ docker run -ti \
   -v ./data:/data \
   -p 8080:8080 \
   camptocamp/puppet-catalog-diff-viewer
```


S3 storage
----------

The viewer can automatically retrieve catalogs from an S3 bucket. In order to use this feature, create a `s3_credentials.js` file with the following variables:

```javascript
var s3_bucketName = 'your-bucket-name';
var s3_access_key = 'your-access-key';
var s3_secret_key = 'your-secret-key';
```

With the docker image, you can use:

```shell
$ docker run -ti \
   -v ./s3_credentials.js:/data/s3_credentials.js:ro \
   -p 8080:8080 \
   camptocamp/puppet-catalog-diff-viewer
```

or using environment variables:

```shell
$ docker run -ti \
   -e S3_BUCKET=your-bucket-name \
   -e S3_ACCESS_KEY=your-access-key \
   -e S3_SECRET_KEY=your-secret-key \
   -p 8080:8080 \
   camptocamp/puppet-catalog-diff-viewer
```

Make sure the access key belongs to a user that can perform actions `s3:GetObject` and `s3:ListBucket` on the bucket. Here is an example bucket policy you can use to upload files from the catalog-diff machine and retrieve them in the viewer:

```json
{
  "Version": "2012-10-17",
  "Id": "Policy1451988974568",
  "Statement": [
    {
      "Sid": "Upload",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789:user/uploader"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::bucket-id/my-site/*"
    },
    {
      "Sid": "ViewerList",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789:user/viewer"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::bucket-id"
    },
    {
      "Sid": "ViewerGet",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789:user/viewer"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bucket-id/*"
    }
  ]
}
```


