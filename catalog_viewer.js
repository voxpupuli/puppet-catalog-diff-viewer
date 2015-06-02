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
    var report_title = $('#'+r)[0].text;
    $('#loaded-report').html('<span class="glyphicon glyphicon-file" aria-hidden="true"></span> '+report_title);
  });
  // Monitor JSONP request for 20 seconds
  setTimeout(function() {
    if (!success) {
      loadingAlert('Loading data from '+r+' seems to have failed', 'danger');
    }
  }, 20000);
}

function loadFile() {
  $('#nodeslist').html('');
  var file = $('#fileinput')[0].files[0];
  fr = new FileReader();
  fr.onload = receivedText;
  fr.readAsText(file);
  $('#loaded-report').html('<span class="glyphicon glyphicon-file" aria-hidden="true"></span> '+file.name);
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

  var width = 310,
      height = 310,
      radius = Math.min(width, height) / 2;

  var pie = d3.layout.pie()
    .value(function(d) { return d.value })
    .sort(null);

  var arc = d3.svg.arc()
    .innerRadius(radius - 55)
    .outerRadius(radius - 20);

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
  $('#nodes').html('');
}

function badgeValue(n, data) {
  switch (n) {
    case 'content':
      return Object.keys(filterAckedObj(data.content_differences, false, true)).length;
      break;

    case 'diff':
      return Object.keys(filterAckedObj(data.differences_as_diff, true, false)).length;
      break;

    case 'in-old':
      return filterAckedArray(data.only_in_old, 'old').length+' / '+data.total_resources_in_old;
      break;

    case 'in-new':
      return filterAckedArray(data.only_in_new, 'new').length+' / '+data.total_resources_in_new;
      break;
  }
}

function makePanel(title, content, id, n, type, data) {
  var title_h = $('<h4>', { class: 'panel-title' })
    .append($('<a>', { 'data-toggle': 'collapse', 'data-target': '#'+id, html: title }));
  var title_badge = badgeValue(n, data);
  if (title_badge !== undefined) {
    title_h.append($('<span>', { id: 'badge-'+n, class: 'badge', html: title_badge}));
  }
  var heading = $('<div>', { class: 'panel-heading' })
    .append(title_h);

  var body = $('<div>', { id: id, class: 'panel-collapse collapse in' })
    .append($('<div>', { class: 'panel-body', html: content }));

  var panel = $('<div>', { class: 'panel panel-'+type, id: 'panel-'+n })
    .append(heading)
    .append(body);

  return panel;
}

function listNodes(label) {
  var ul = $('<ul>', { id: 'nodeslist', class: 'list-group' });

  if (label === 'with changes') {
    var most_differences = diff.most_differences;
    var max_diff = most_differences[0][Object.keys(diff.most_differences[0])];
    for (var i=0; i < most_differences.length; i++) {
      // Weird data structure...
      var node = Object.keys(most_differences[i])[0];
      var data = diff[node];
      var n_diff = Object.keys(filterAckedObj(data.differences_as_diff, true, false)).length;
      var p_diff = 100 * n_diff / data.node_differences;
      var n_oio = filterAckedArray(data.only_in_old, 'old').length;
      var p_oio = 100 * n_oio / data.node_differences;
      var n_oin = filterAckedArray(data.only_in_new, 'new').length;
      var p_oin = 100 * n_oin / data.node_differences;
      var nodeLine = $('<li>', { class: 'list-group-item', id: 'nodeslist:'+node })
        .append($('<span>', { html: node })
          .on("click", $.proxy(function(node) { displayNodeDiff(node) }, null, node) ))
        .append($('<div>', { class: 'progress tooltip-target', style: 'width: '+(5*data.node_differences/max_diff)+'em' })
          .append($('<div>', { class: 'progress-bar progress-bar-warning', style: 'width: '+p_diff+'%;', html:  n_diff })
            .on("click", $.proxy(function(node) { displayNodeDiff(node, 'panel-content') }, null, node) ))
          .append($('<div>', { class: 'progress-bar progress-bar-danger', style: 'width: '+p_oio+'%;', html: n_oio })
            .on("click", $.proxy(function(node) { displayNodeDiff(node, 'panel-in-old') }, null, node) ))
          .append($('<div>', { class: 'progress-bar progress-bar-success', style: 'width: '+p_oin+'%;', html: n_oin })
            .on("click", $.proxy(function(node) { displayNodeDiff(node, 'panel-in-new') }, null, node) )));
      ul.append(nodeLine);
    }
  } else if (label === 'failed') {
    var failed_panel = makePanel('Failed to compile files', failedFiles(), 'failed-files', 'failed', 'danger', diff.pull_output.failed_to_compile_files.length);
    var errs_panel = makePanel('Compile error examples', compileErrors(), 'compile-errors', 'errors', 'danger');
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

function displayNodeDiff(node, elem) {
  var data = diff[node];

  // Set active node in list
  $('#nodeslist').children('.active').removeClass('active');

  $('[id="nodeslist:'+node+'"]').addClass('active');

  $('#node').html($('<h2>', { html: node }));

  var stats_panel = makePanel('Diff stats', diffStats(data), 'diff-stats', 'stats', 'info', data);
  var content_panel = makePanel('Content differences', contentDiff(data), 'content-diff', 'content', 'warning', data);
  var differences_panel = makePanel('Differences as diff', differencesAsDiff(data), 'differences-as-info', 'diff', 'warning', data);
  var only_in_old_panel = makePanel('Only in old', onlyInOld(data), 'only-in-old', 'in-old', 'danger', data);
  var only_in_new_panel = makePanel('Only in new', onlyInNew(data), 'only-in-new', 'in-new', 'success', data);
  var panels = $('<div>', { class: 'panel-group', id: 'accordion' })
              .append(stats_panel)
              .append(content_panel)
              .append(differences_panel)
              .append(only_in_old_panel)
              .append(only_in_new_panel);

  $('#node').append(panels);
  sh_highlightDocument();
  if ($(window).width() < 992) {
    // Mobile interface: scroll to div
    if (elem === undefined) {
      // Navbar is 50px high
      window.scrollTo(0, $('#node').position().top - 50);
    } else {
      window.scrollTo(0, $('#node').position().top - 50 + $('#'+elem).position().top);
    }
  } else {
    // Desktop interface: scroll up in div
    if (elem === undefined) {
      $('#node').animate({scrollTop: 0}, 500);
    } else {
      $('#node')[0].scrollTop = 0;
      $('#node').animate({scrollTop: $('#'+elem).position().top}, 500);
    }
  }
}

function percentBar(percentage) {
  return $('<div>', { class: 'progress', html: percentage+'%' })
      .append($('<div>', {
        class: 'progress-bar',
        style: 'width: '+percentage+'%;'
      }));
}

function diffStats(data) {
  var ul = $('<ul>', { class: 'list-group diff-stats' });
  ul.append($('<li>', { class: 'list-group-item', html: 'Catalog percentage added' })
    .append(percentBar(data.catalag_percentage_added)));
  ul.append($('<li>', { class: 'list-group-item', html: 'Catalog percentage removed' })
    .append(percentBar(data.catalog_percentage_removed)));
  ul.append($('<li>', { class: 'list-group-item', html: 'Catalog percentage changed' })
    .append(percentBar(data.catalog_percentage_changed)));
  ul.append($('<li>', { class: 'list-group-item', html: 'Node percentage' })
    .append(percentBar(data.node_percentage.toFixed(2))));
  ul.append($('<li>', { class: 'list-group-item', html: 'Added and removed resources' })
    .append($('<span>', { class: 'badge', html: data.added_and_removed_resources })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Node differences' })
    .append($('<span>', { class: 'badge', html: data.node_differences })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Total resources in old' })
    .append($('<span>', { class: 'badge', html: data.total_resources_in_old })));
  ul.append($('<li>', { class: 'list-group-item', html: 'Total resources in new' })
    .append($('<span>', { class: 'badge', html: data.total_resources_in_new })));
  return ul;
}

function filterAckedObj(diffs, join_diff, anon_diff) {
  var keys = Object.keys(diffs);
  var filtered = new Object;

  for (var i=0; i < keys.length; i++) {
    var k = keys[i];
    var d = diffs[k];
    var comp_d = d;

    if (join_diff && comp_d.constructor === Array) {
      comp_d = "--- old\n+++ new\n"+comp_d.join("\n");
    }

    if (anon_diff) {
      // Remove header lines that vary
      comp_d = comp_d.split("\n").splice(2).join("\n");
    }

    if (diff['acks'] !== undefined && diff['acks'][k] !== undefined && diff['acks'][k].indexOf(comp_d) !== -1) {
      continue;
    }

    filtered[k] = d;
  }

  return filtered;
}

function filterAckedArray(diffs, type) {
  var filtered = new Array;

  for (var i=0; i < diffs.length; i++) {
    var k = diffs[i];

    if (diff['acks'] !== undefined && diff['acks'][k] !== undefined && diff['acks'][k].indexOf(type) !== -1) {
      continue;
    }

    filtered.push(k);
  }

  return filtered;
}

function contentDiff(data) {
  var diffFiles = filterAckedObj(data.content_differences, false, true);
  var keys = Object.keys(diffFiles);
  console.log(diffFiles);
  var html = $('<p>');
  for (var i=0; i < keys.length; i++) {
    var k = keys[i];
    var diff_str = diffFiles[k];
    // Remove header lines that vary
    var anon_diff_str = diff_str.split("\n").slice(2).join("\n");

    var ul = $('<ul>', { id: 'content:'+k, class: 'list-group', html: k });
    ul.append($('<span>', { class: 'glyphicon glyphicon-ok ack' })
          .on("click", $.proxy(function(k, anon_diff_str, data) { ackDiff(k, anon_diff_str, 'content', k, data) }, null, k, anon_diff_str, data)));
    ul.append($('<pre>', { class: 'sh_diff', html: diff_str }));
    html.append(ul);
  }
  return html;
}

function differencesAsDiff(data) {
  var html = $('<p>');
  var diffs = filterAckedObj(data.differences_as_diff, true, false);
  var keys = Object.keys(diffs);
  for (var i=0; i < keys.length; i++) {
    var k = keys[i];
    var diff_str = diffs[k];

    if (diff_str.constructor === Array) {
      diff_str = "--- old\n+++ new\n"+diff_str.join("\n");
    }

    var ul = $('<ul>', { id: 'diff:'+k, class: 'list-group', html: k });
    ul.append($('<span>', { class: 'glyphicon glyphicon-ok ack' })
          .on("click", $.proxy(function(k, diff_str, data) { ackDiff(k, diff_str, 'diff', k, data) }, null, k, diff_str, data)));
    ul.append($('<pre>', { class: 'sh_diff', html: diff_str }));
    html.append(ul);
  }
  return html;
}

function onlyInOld(data) {
  var ul = $('<ul>', { id: 'only-in-old', class: 'list-group' });
  var r = filterAckedArray(data.only_in_old, 'old');
  for (var i=0; i < r.length; i++) {
    var d = r[i];

    ul.append($('<li>', { id: 'in-old:'+d, class: 'list-group-item', html: d })
      .append($('<span>', { class: 'glyphicon glyphicon-ok ack' })
          .on("click", $.proxy(function(d, data) { ackDiff(d, 'old', 'in-old', d, data) }, null, d, data)))
    );
  }
  return ul;
}

function onlyInNew(data) {
  var ul = $('<ul>', { id: 'only-in-new', class: 'list-group' });
  var r = filterAckedArray(data.only_in_new, 'new');
  for (var i=0; i < r.length; i++) {
    var d = r[i];

    ul.append($('<li>', { id: 'in-new:'+d, class: 'list-group-item', html: d })
      .append($('<span>', { class: 'glyphicon glyphicon-ok ack' })
          .on("click", $.proxy(function(d, data) { ackDiff(d, 'new', 'in-new', d, data) }, null, d, data)))
    );
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

function ackDiff(d, str, type, id, data) {
  if (diff['acks'] === undefined) diff['acks'] = new Object;
  if (diff.acks[d] === undefined) diff.acks[d] = new Array;
  if (diff.acks[d].indexOf(str) === -1) diff.acks[d].push(str);
  $('[id="'+type+':'+id+'"]').fadeOut(500);
  // Refresh node list
  listNodes('with changes');
  // Refresh badge
  $('[id="badge-'+type+'"]').html(badgeValue(type, data));
}
