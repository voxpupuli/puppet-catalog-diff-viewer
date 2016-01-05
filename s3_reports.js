AWS.config.update({accessKeyId: s3_access_key, secretAccessKey: s3_secret_key});

var s3Bucket = new AWS.S3({
    params: {
      Bucket: s3_bucketName
    }
});

var sites = new Object();

function listS3Reports() {
  s3Bucket.listObjects(function(err, data) {
    if (err) {
      console.log(err);
    } else {
      for (i=0; i<data.Contents.length; i++) {
        var report = data.Contents[i].Key;
        var split = report.split('/');
        var site = split[0];
        sites[site] = sites[site] || {};
        var reportName = split[1].replace(/\.[^/.]+$/, "")
        sites[site][reportName] = report;
      }

      generateReportsMenu(sites);
    }
  });
}

function generateReportsMenu(sites) {
  siteNames = Object.keys(sites).sort();
  reportsList = $('#reports-list');
  reportsList.html('');
  for (i=0; i<siteNames.length; i++) {
    var site = siteNames[i];
    var reports = Object.keys(sites[site]).sort();
    for (j=0; j<reports.length; j++) {
      var reportName = reports[j];
      var report = sites[site][reportName];
      reportsList.append($('<li>').append($('<a>', {
        id: report,
        href: "javascript:loadS3Report('"+reportName+"', '"+report+"')",
        html: "<span class='badge'>"+site+"</span> "+reportName
      })));
    }
  }
}

function loadS3Report(name, key) {
  console.log("Loading "+name);
  s3Bucket.getObject({ Key: key }, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      var json = $.parseJSON(data.Body.toString());
      loadReportData(name, json);
    }
  });
}
