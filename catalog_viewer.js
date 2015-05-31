var diff;

function loadFromSelect() {
  var idx = $('#fileselect')[0].selectedIndex;
  var opts = $('#fileselect')[0].options;
  loadReport(opts[idx].text);
}

function loadReport(r) {
  var bar = $('<div>', {
      class:"progress progress-striped active"
    })
    .append($('<div>', {
      class:"progress-bar",
      role:"progressbar",
      'aria-valuenow':"100",
      'aria-valuemin':"0",
      'aria-valuemax':"100",
      style:"width: 100%",
      html: 'Loading data...'
    }));
  $('#chart').html(bar);
  var success = false;
  $.getJSON('data/'+r+'.json', function(data) {
    success = true;
    diff = data;
    addPie(diff);
  });
  // Monitor JSONP request for 20 seconds
  setTimeout(function() {
    if (!success) {
      loadingAlert('Loading data from '+r+' seems to have failed', 'danger');
    }
  }, 20000);
}

function loadFile() {
  var file = $('#fileinput')[0].files[0];
  fr = new FileReader();
  fr.onload = receivedText;
  fr.readAsText(file);
}

function loadingAlert(message, level) {
  var alert_div = $('<div>', {
    class: 'alert alert-'+level,
    html: '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> '+message
  });
  $('#chart').html(alert_div);
}

function receivedText(e) {
  lines = e.target.result;
  try {
    diff = JSON.parse(lines);
  }
  catch(err) {
    loadingAlert('File does not seem to be in JSON format', 'danger');
    return;
  }
  addPie(diff);
}

function addPie(diff) {
  $('#chart').html('');
  try {
    var with_changes = diff.with_changes;
    var failed = diff.pull_output.failed_nodes_total;
    var no_changes = diff.pull_output.total_nodes - with_changes - failed;
  }
  catch(err) {
    loadingAlert('Failed to parse report: missing fields', 'danger');
    return;
  }
  var dataset = [
  { "label": "with changes", "value": with_changes, "color": "#DB843D" },
  { "label": "failed",       "value": failed,       "color": "#AA4643" },
  { "label": "no changes",   "value": no_changes,   "color": "#94AD5F" }
  ];

  var width = 350,
      height = 350,
      radius = Math.min(width, height) / 2;

  var pie = d3.layout.pie()
    .value(function(d) { return d.value })
    .sort(null);

  var arc = d3.svg.arc()
    .innerRadius(radius - 80)
    .outerRadius(radius - 50);

  var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var path = svg.selectAll("path")
    .data(pie(dataset))
    .enter().append("path")
    .attr("fill", function(d, i) { return d.data.color; })
    .attr("d", arc)
    .on("click", function(d) {
      listNodes(d.data.label);
    });

  var legendRectSize = 25;
  var legendSpacing = 10;

  var legend = svg.selectAll('.legend')
    .data(dataset)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', function(d, i) {
      var height = legendRectSize + legendSpacing;
      var offset =  height * dataset.length / 2;
      var horz = -2 * legendRectSize;
      var vert = i * height - offset;
      return 'translate(' + horz + ',' + vert + ')';
        });

      legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', function(d) { return d.color })
      .style('stroke', function(d) { return d.color });

      legend.append('text')
      .classed("data", true)
      .attr("x", function(d) { return legendRectSize/2; }) // Center text
      .attr("y", function(d) { return legendRectSize/2; }) // Center text
      .style({"font-size":"12px", "z-index": "999999999"})
      .style("text-anchor", "middle")
      .text(function(d) { return d.value })
      .on("click", function(d) {
        listNodes(d.label);
      });

  legend.append('text')
    .attr('x', legendRectSize + legendSpacing)
    .attr('y', legendRectSize - legendSpacing)
    .text(function(d) { return d.label; })
    .on("click", function(d) {
      listNodes(d.label);
    });
}


function makePanel(title, content, id, n, type, title_badge) {
  var title_h = $('<h4>', { class: 'panel-title' })
    .append($('<a>', { 'data-toggle': 'collapse', 'data-target': '#'+id, html: title }));
  if (title_badge !== null) {
    title_h.append($('<span>', { class: 'badge', html: title_badge}));
  }
  var heading = $('<div>', { class: 'panel-heading' })
    .append(title_h);

  var body = $('<div>', { id: id, class: 'panel-collapse collapse in' })
    .append($('<div>', { class: 'panel-body', html: content }));

  var panel = $('<div>', { class: 'panel panel-'+type, id: 'panel'+n })
    .append(heading)
    .append(body);

  return panel;
}

function listNodes(label) {
  var ul = $('<ul>', { id: 'nodeslist', class: 'list-group' });

  if (label === 'with changes') {
    var most_differences = diff.most_differences;
    for (var i=0; i < most_differences.length; i++) {
      // Weird data structure...
      var node = Object.keys(most_differences[i])[0];
      var nodeLine = $('<li>', { class: 'list-group-item', html: node })
        .append($('<span>', { class: 'badge', html: most_differences[i][node] }))
        .on("click", $.proxy(function(node) { displayNodeDiff(node) }, null, node) );
      ul.append(nodeLine);
    }
  } else if (label === 'failed') {
    var failed_panel = makePanel('Failed to compile files', failedFiles(), 'failed-files', 1, 'danger', diff.pull_output.failed_to_compile_files.length);
    var errs_panel = makePanel('Compile error examples', compileErrors(), 'compile-errors', 2, 'danger');
    var panels = $('<div>', { class: 'panel-group', id: 'accordion' })
                .append(failed_panel)
                .append(errs_panel);
    $('#node').html(panels);

    var failed = Object.keys(diff.pull_output.failed_nodes);
    for (var i=0; i < failed.length; i++) {
      var node = failed[i];
      var nodeLine = $('<li>', { class: 'list-group-item', html: node})
        .on("click", $.proxy(function(node) { displayNodeFail(node) }, null, node) );
      ul.append(nodeLine);
    }
  } else {
    ul.append($('<li>', { class: 'list-group-item', html: "Nothing to display for OK machines"} ));
  }
  $('#nodes').html(ul);
}

function displayNodeDiff(node) {
  var data = diff[node];

  $('#node').html($('<h2>', { html: node }));

  var stats_panel = makePanel('Diff stats', diffStats(data), 'diff-stats', 1, 'info');
  var content_panel = makePanel('Content differences', contentDiff(data), 'content-diff', 2, 'warning', Object.keys(data.content_differences).length);
  var differences_panel = makePanel('Differences as diff', differencesAsDiff(data), 'differences-as-diff', 4, 'warning', Object.keys(data.differences_as_diff).length);
  var only_in_old_panel = makePanel('Only in old', onlyInOld(data), 'only-in-old', 5, 'warning', data.only_in_old.length+' / '+data.total_resources_in_old);
  var only_in_new_panel = makePanel('Only in new', onlyInNew(data), 'only-in-new', 6, 'warning', data.only_in_new.length+' / '+data.total_resources_in_new);
  var panels = $('<div>', { class: 'panel-group', id: 'accordion' })
              .append(stats_panel)
              .append(content_panel)
              .append(differences_panel)
              .append(only_in_old_panel)
              .append(only_in_new_panel);

  $('#node').append(panels);
  sh_highlightDocument();
  // Mobile interface: scroll to div
  $('#node')[0].scrollIntoView(true);
  // Desktop interface: scroll up in div
  $('#node')[0].scrollTop = 0;
}

function diffStats(data) {
  var ul = $('<ul>', { class: 'list-group' });
  ul.append($('<li>', { class: 'list-group-item', html: 'Catalog percentage added' })
    .append($('<span>', { class: 'badge', html: data.catalag_percentage_added })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Catalog percentage removed' })
    .append($('<span>', { class: 'badge', html: data.catalog_percentage_removed })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Catalog percentage changed' })
    .append($('<span>', { class: 'badge', html: data.catalog_percentage_changed })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Added and removed resources' })
    .append($('<span>', { class: 'badge', html: data.added_and_removed_resources })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Node percentage' })
    .append($('<span>', { class: 'badge', html: data.node_percentage })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Node differences' })
    .append($('<span>', { class: 'badge', html: data.node_differences })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Total resources in old' })
    .append($('<span>', { class: 'badge', html: data.total_resources_in_old })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Total resources in new' })
    .append($('<span>', { class: 'badge', html: data.total_resources_in_new })));
  return ul;
}

function contentDiff(data) {
  var diffFiles = Object.keys(data.content_differences);
  var html = $('<p>');
  for (var i=0; i < diffFiles.length; i++) {
    html.append($('<ul>', { class: 'list-group', html: diffFiles[i] })
        .append($('<pre>', { class: 'sh_diff', html: data.content_differences[diffFiles[i]] })));
  }
  return html;
}

function differencesAsDiff(data) {
  var html = $('<p>');
  var diffs = Object.keys(data.differences_as_diff);
  for (var i=0; i < diffs.length; i++) {
    var d = diffs[i];

    var diff_str = data.differences_as_diff[d];
    if (diff_str.constructor === Array) {
      diff_str = "--- old\n+++ new\n"+diff_str.join("\n");
    }
    html.append($('<ul>', { class: 'list-group', html: d })
        .append($('<pre>', { class: 'sh_diff', html: diff_str })));
  }
  return html;
}

function onlyInOld(data) {
  var ul = $('<ul>', { class: 'list-group' });
  var r = data.only_in_old;
  for (var i=0; i < r.length; i++) {
    ul.append($('<li>', { class: 'list-group-item', html: r[i] }));
  }
  return ul;
}

function onlyInNew(data) {
  var ul = $('<ul>', { class: 'list-group' });
  var r = data.only_in_new;
  for (var i=0; i < r.length; i++) {
    ul.append($('<li>', { class: 'list-group-item', html: r[i] }));
  }
  return ul;
}

function displayNodeFail(node) {
  var data = diff.pull_output.failed_nodes[node];

  var html = $('<h2>', { html: node });
  html.append($('<h3>', { html: "Fail output" }));
  html.append($('<pre>', { class: 'compile-error', html: data }));

  $('#node').html(html);
  sh_highlightDocument();
  $('#node')[0].scrollIntoView(true);
}

function failedFiles() {
  var failed_files = diff.pull_output.failed_to_compile_files;
  var ul = $('<ul>', { class: 'list-group' });
  for (var i=0; i < failed_files.length; i++) {
    var obj = failed_files[i];
    var f = Object.keys(obj)[0];
    var nodeLine = ($('<li>', { class: 'list-group-item', html: f }))
            .append($('<span>', { class: 'badge', html: obj[f] }));
    ul.append(nodeLine);
  }
  return ul;
}

function compileErrors() {
  var compile_errs = diff.pull_output.example_compile_errors;
  var ul = $('<ul>', { class: 'list-group' });
  for (var i=0; i < compile_errs.length; i++) {
    var err = compile_errs[i];
    var err_k = Object.keys(err)[0];
    ul.append($('<li>', { class: 'list-group-item', html: compile_errs[i][err_k] }))
      .append($('<pre>', { class: 'compile-error', html: err_k }));
  }
  return ul;
}
