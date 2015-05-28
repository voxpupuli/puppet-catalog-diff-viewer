var diff;

loadReport('staging3_rpinson3');

function loadFromSelect() {
  var idx = $('#fileselect')[0].selectedIndex;
  var opts = $('#fileselect')[0].options;
  loadReport(opts[idx].text);
}

function loadReport(r) {
  $('#chart').innerHTML = 'Loading data...';
  $.getJSON('data/'+r+'.json', function(data) {
    diff = data;
    $('#chart')[0].innerHTML = '';
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
  $('#chart')[0].innerHTML = '';
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


function listNodes(label) {
  var tableHead = $('<tr>')
                   .append($('<th>', { html: 'Node' }))
                   .append($('<th>', { html: 'Diff #' }))
                   .append($('<th>', { html: 'Diff %' }));
  var table = $('<table>', {
          id: 'nodeslist',
          class: 'table'
  }).append(tableHead);

  if (label === 'with changes') {
          var most_differences = diff.most_differences;
          for (var i=0; i < most_differences.length; i++) {
                  // Weird data structure...
                  var node = Object.keys(most_differences[i])[0];
                  var nodeLine = $('<tr>')
                                  .append($('<td>', { html: node }))
                                  .append($('<td>', { html: most_differences[i][node] }))
                                  .append($('<td>', { html: diff[node].catalog_percentage_changed }))
                                  .on("click", $.proxy(function(node) { displayNode(node) }, null, node) );
                  table.append(nodeLine);
          }
  } else if (label === 'failed') {
          table.append($('<tr>')
                 .append($('<td>', { html: "Displaying failed catalogs", colspan: 3 })));
  } else {
          table.append($('<tr>')
                 .append($('<td>', { html: "Nothing to display for OK machines", colspan: 3 })));
  }
  $('#nodes').html(table);
  sorttable.makeSortable($('#nodeslist')[0]);
}

function displayNode(node) {
  var data = diff[node];
  var html = "<h2>"+node+"</h2>";
  html += "<h3>Content differences</h3>";
  var diffFiles = Object.keys(data.content_differences);
  for (var i=0; i < diffFiles.length; i++) {
    html += "<h4>"+diffFiles[i]+"</h4>";
    html += "<pre class='sh_diff'>\n"+data.content_differences[diffFiles[i]]+"\n</pre>";
  }

  $('#node')[0].innerHTML = html;
  sh_highlightDocument();
}

