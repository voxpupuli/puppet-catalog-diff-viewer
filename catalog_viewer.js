var diff;

loadReport('staging3_rpinson3');

function loadFromSelect() {
  var idx = $('#fileselect')[0].selectedIndex;
  var opts = $('#fileselect')[0].options;
  loadReport(opts[idx].text);
}

function loadReport(r) {
  $('#chart').html('Loading data...');
  $.getJSON('data/'+r+'.json', function(data) {
    diff = data;
    addPie(diff);
  });
}

function loadFile() {
  console.log("loading file");
  var file = $('#fileinput')[0].files[0];
  fr = new FileReader();
  fr.onload = receivedText;
  fr.readAsText(file);
}

function receivedText(e) {
  lines = e.target.result;
  diff = JSON.parse(lines);
  addPie(diff);
}

function addPie(diff) {
  $('#chart').html('');
  var with_changes = diff.with_changes;
  var failed = diff.pull_output.failed_nodes_total;
  var no_changes = diff.pull_output.total_nodes - with_changes - failed;
  var dataset = [
  { "label": "with changes", "value": with_changes, "color": "#DB843D" },
  { "label": "failed",       "value": failed,       "color": "#AA4643" },
  { "label": "no changes",   "value": no_changes,   "color": "#94AD5F" }
  ];

  var width = 380,
      height = 380,
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


function makePanel(title, content, id, n) {
  var heading = $('<div>', { class: 'panel-heading' })
    .append($('<h4>', { class: 'panel-title' })
      .append($('<a>', { 'data-toggle': 'collapse', 'data-target': '#'+id, html: title })
      ));

  var body = $('<div>', { id: id, class: 'panel-collapse collapse in' })
    .append($('<div>', { class: 'panel-body', html: content }));

  var panel = $('<div>', { class: 'panel panel-default', id: 'panel'+n })
    .append(heading)
    .append(body);

  return panel;
}

function listNodes(label) {
  var table = $('<table>', {
    id: 'nodeslist',
      class: 'table'
  });

  if (label === 'with changes') {
    var tableHead = $('<tr>')
      .append($('<th>', { html: 'Node' }))
      .append($('<th>', { html: 'Diff #' }))
      .append($('<th>', { html: 'Diff %' }));
    table.append(tableHead);

    var most_differences = diff.most_differences;
    for (var i=0; i < most_differences.length; i++) {
      // Weird data structure...
      var node = Object.keys(most_differences[i])[0];
      var nodeLine = $('<tr>')
        .append($('<td>', { html: node }))
        .append($('<td>', { html: most_differences[i][node] }))
        .append($('<td>', { html: diff[node].catalog_percentage_changed }))
        .on("click", $.proxy(function(node) { displayNodeDiff(node) }, null, node) );
      table.append(nodeLine);
    }
  } else if (label === 'failed') {
    var tableHead = $('<tr>')
      .append($('<th>', { html: 'Node' }));
    table.append(tableHead);

    var failed_panel = makePanel('Failed to compile files', failedFiles(), 'failed-files', 1);
    var errs_panel = makePanel('Compile error examples', compileErrors(), 'compile-errors', 2);
    var panels = $('<div>', { class: 'panel-group', id: 'accordion' })
                .append(failed_panel)
                .append(errs_panel);
    $('#node').html(panels);

    var failed = Object.keys(diff.pull_output.failed_nodes);
    for (var i=0; i < failed.length; i++) {
      var node = failed[i];
      var nodeLine = $('<tr>')
        .append($('<td>', { html: node }))
        .on("click", $.proxy(function(node) { displayNodeFail(node) }, null, node) );
      table.append(nodeLine);
    }
  } else {
    table.append($('<tr>')
        .append($('<td>', { html: "Nothing to display for OK machines", colspan: 3 })));
  }
  $('#nodes').html(table);
  sorttable.makeSortable($('#nodeslist')[0]);
}

function displayNodeDiff(node) {
  var data = diff[node];

  $('#node').html($('<h2>', { html: node }));

console.log(node);
  var stats_panel = makePanel('Diff stats', diffStats(data), 'diff-stats', 1);
  var content_panel = makePanel('Content differences', contentDiff(data), 'content-diff', 2);
  var differences_panel = makePanel('Differences as diff', differencesAsDiff(data), 'differences-as-diff', 4);
  var panels = $('<div>', { class: 'panel-group', id: 'accordion' })
              .append(stats_panel)
              .append(content_panel)
              .append(differences_panel)

  $('#node').append(panels);
  sh_highlightDocument();
}

function diffStats(data) {
  var ul = $('<ul>');
  ul.append($('<li>', { html: 'Catalog percentage added: '+data.catalag_percentage_added }));
  ul.append($('<li>', { html: 'Catalog percentage removed: '+data.catalog_percentage_removed }));
  ul.append($('<li>', { html: 'Catalog percentage changed: '+data.catalog_percentage_changed }));
  ul.append($('<li>', { html: 'Added and removed resources: '+data.added_and_removed_resources }));
  ul.append($('<li>', { html: 'Node percentage: '+data.node_percentage }));
  ul.append($('<li>', { html: 'Node differences: '+data.node_differences }));
  return ul;
}

function contentDiff(data) {
  var diffFiles = Object.keys(data.content_differences);
  var html = $('<p>', { html: "Content diff generated" });
  for (var i=0; i < diffFiles.length; i++) {
    html.append($('<h4>', { html: diffFiles[i] }));
    html.append($('<pre>', { class: 'sh_diff', html: data.content_differences[diffFiles[i]] }));
  }
  return html;
}

function differencesAsDiff(data) {
  var ul = $('<ul>');
  var diffs = Object.keys(data.differences_as_diff);
  for (var i=0; i < diffs.length; i++) {
    var d = diffs[i];
    console.log(d);

    var diff_str = data.differences_as_diff[d];
    if (diff_str.constructor === Array) {
      diff_str = diff_str.join("\n");
    }
    var diff = $('<pre>', { class: 'sh_diff', html: diff_str });
    ul.append($('<li>', { html: d }).append(diff));
  }
  return ul;
}

function displayNodeFail(node) {
  var data = diff.pull_output.failed_nodes[node];

  var html = $('<h2>', { html: node });
  html.append($('<h3>', { html: "Fail output" }));
  html.append($('<pre>', { html: data }));

  $('#node').html(html);
  sh_highlightDocument();
}

function failedFiles() {
  var failed_files = diff.pull_output.failed_to_compile_files;
  var node_tr = $('<tr>')
    .append($('<th>', { html: "File" }))
    .append($('<th>', { html: "Affected nodes" }));
  var node_table = $('<table>').append(node_tr);
  for (var i=0; i < failed_files.length; i++) {
    var obj = failed_files[i];
    var f = Object.keys(obj)[0];
    var nodeLine = ($('<tr>'))
            .append($('<td>', { html: f }))
            .append($('<td>', { html: obj[f] }));
    node_table.append(nodeLine);
  }
  return node_table;
}

function compileErrors() {
  var compile_errs = diff.pull_output.example_compile_errors;
  var ul = $('<ul>');
  for (var i=0; i < compile_errs.length; i++) {
    var err = compile_errs[i];
    var err_k = Object.keys(err)[0];
    ul.append($('<li>', { html: compile_errs[i][err_k] }))
      .append($('<pre>', { html: err_k }));
  }
  return ul;
}