Puppet Catalog Diff Viewer
===========================

A viewer for json reports produced by [the puppet-catalog-diff tool](https://github.com/acidprime/puppet-catalog-diff)

The interface can be tried online at http://camptocamp.github.io/puppet-catalog-diff-viewer.

Acking diffs
------------

This interface allows to ack differences in order to ease the report review. Differences are acked on all nodes that have the same resource with the same diff.

A global acking button is available for sections which allows to ack all diffs in the section at once.

Starring diffs
--------------

When using the global acking button, you might want to exclude some diffs from the global acking. Starring diffs does just that. Just as for acks, stars are cross-nodes.

S3 storage
----------

The viewer can automatically retrieve catalogs from an S3 bucket. In order to use this feature, create a `s3_credentials.js` file with the following variables:

```javascript
var s3_bucketName = 'your-bucket-name';
var s3_access_key = 'your-access-key';
var s3_secret_key = 'your-secret-key';
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


