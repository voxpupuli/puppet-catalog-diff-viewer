Puppet Catalog Diff Viewer
===========================

[![License](https://img.shields.io/github/license/voxpupuli/puppet-catalog-diff-viewer.svg)](https://github.com/voxpupuli/puppet-catalog-diff-viewer/blob/master/LICENSE)
[![CI](https://github.com/voxpupuli/puppet-catalog-diff-viewer/actions/workflows/ci.yaml/badge.svg)](https://github.com/voxpupuli/puppet-catalog-diff-viewer/actions/workflows/ci.yaml)
[![Donated by Camptocamp](https://img.shields.io/badge/donated%20by-camptocamp-fb7047.svg)](#transfer-notice)


A viewer for json reports produced by [the puppet-catalog-diff tool](https://github.com/voxpupuli/puppet-catalog-diff)

The interface can be tried online at http://voxpupuli.org/puppet-catalog-diff-viewer.

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
$ docker run -it --rm -p 8080:8080 ghcr.io/voxpupuli/puppet-catalog-diff-viewer:development
```

will let you access the catalog diff viewer at [http://localhost:8080](http://localhost:8080).

Server Side storage
-------------------

The will automatically populate the drop-down list of available reports, if they can be read from `reportlist.json`.
This file contains a record of the json files in `data`.
Assuming you have

```text
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
   ghcr.io/voxpupuli/puppet-catalog-diff-viewer
```

S3 storage
----------

The viewer can automatically retrieve catalogs from an S3 bucket. In order to use this feature, create a `s3_credentials.js` file with the following variables:

```javascript
const s3_bucketName = 'your-bucket-name';
const s3_access_key = 'your-access-key';
const s3_secret_key = 'your-secret-key';
// something like this for standard s3 and the corresponding region
const s3_endpoint   = 's3.us-east-2.amazonaws.com';
// for self hosted s3
const s3_endpoint   = 'http://your.endpoint.example.com:9000';

// if you use a path within the bucket
const s3_bucketPathPrefix = 'your-prefix';
const s3_ForcePathStyle = true;
```

With the docker image, you can use:

```shell
$ docker run -it --rm \
   -v ./s3_credentials.js:/data/s3_credentials.js:ro \
   -p 8080:8080 \
   ghcr.io/voxpupuli/puppet-catalog-diff-viewer:development
```

or using environment variables:

```shell
$ docker run -it --rm \
   -e S3_BUCKET=your-bucket-name \
   -e S3_ACCESS_KEY=your-access-key \
   -e S3_SECRET_KEY=your-secret-key \
   -p 8080:8080 \
   ghcr.io/voxpupuli/puppet-catalog-diff-viewer:development
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

Transfer Notice
---------------

This project was originally authored by [Camptocamp](http://www.camptocamp.com).
The maintainer preferred that Vox Pupuli take ownership of the project for future improvement and maintenance.
Existing pull requests and issues were transferred over, please fork and continue to contribute here instead of Camptocamp.
