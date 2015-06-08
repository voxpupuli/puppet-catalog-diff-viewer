function loadReport(r) {
  // Mark report as active
  $('#reports-list').children('li.active').removeClass('active');
  $('#'+r).parent().addClass('active');
  // Close collapsed if need be
  $('#navbar-collapse-menu').collapse('hide');
  var bar = percentBar('100', false, 'progress-striped active', 'Loading data...');
  $('#chart').html(bar);
  $.getJSON('data/'+r+'.json', function(data) {
    diff = data;
    addPie(diff);
    var report_title = $('#'+r)[0].text;
    $('#loaded-report').html('<span class="glyphicon glyphicon-file" aria-hidden="true"></span> '+report_title);
    var crumbs =  $('#breadcrumb').children('li');
    if (crumbs.length > 2) $('#breadcrumb').children('li')[2].remove();
    if (crumbs.length > 1) $('#breadcrumb').children('li')[1].remove();
  }).error(function(jqXHR, textStatus, errorThrown) {
    loadingAlert('Failed to load report '+r+': '+errorThrown, 'danger');
  });
}

function loadFile() {
  // Close collapsed if need be
  $('#navbar-collapse-menu').collapse('hide');

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
    var failed;
    var no_changes;
    if (diff['pull_output'] === undefined) {
      failed = 0;
      no_changes = 0;
    } else {
      failed = diff.pull_output.failed_nodes_total;
      no_changes = diff.pull_output.total_nodes - with_changes - failed;
    }
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

  // Add arcs
  var path = svg.selectAll("path")
    .data(pie(dataset))
    .enter().append("path")
    .attr("fill", function(d, i) { return d.data.color; })
    .attr("d", arc)
    .on("click", function(d) {
      listNodes(d.data.label, true);
    });

  // Legend
  var legendRectSize = 25;
  var legendSpacing = 10;

  // Create legend in the center of the chart
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

  // legend squares
  legend.append('rect')
  .attr('width', legendRectSize)
  .attr('height', legendRectSize)
  .style('fill', function(d) { return d.color })
  .style('stroke', function(d) { return d.color });

  // legend squares text
  legend.append('text')
  .classed("data", true)
  .attr("x", function(d) { return legendRectSize/2; }) // Center text
  .attr("y", function(d) { return legendRectSize/2; }) // Center text
  .style({"font-size":"12px", "z-index": "999999999"})
  .style("text-anchor", "middle")
  .text(function(d) { return d.value })
  .on("click", function(d) {
    listNodes(d.label, true);
  });

  // legend text
  legend.append('text')
    .attr('x', legendRectSize + legendSpacing)
    .attr('y', legendRectSize - legendSpacing)
    .text(function(d) { return d.label; })
    .on("click", function(d) {
      listNodes(d.label, true);
    });

  // Add date
  if (diff['date'] !== undefined) {
    var date = new Date(diff['date']);
    svg.append('text')
      .attr('x', 0)
      .attr('y', 70)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .text(date.toLocaleString());
  }

  // Wipe node list
  $('#nodes').html('');
}

function badgeValue(n, data) {
  switch (n) {
    case 'diff':
      return markStats(data.differences_as_diff).unacked;
      break;

    case 'in-old':
      return markStats(data.only_in_old, 'old').unacked+' / '+data.total_resources_in_old;
      break;

    case 'in-new':
      return markStats(data.only_in_new, 'new').unacked+' / '+data.total_resources_in_new;
      break;
  }
}

function panelIsStarred(type, data) {
  switch (type) {
    case 'diff':
      return (data.markstats.differences_as_diff.starred !== 0);
      break;

    case 'in-old':
      return (data.markstats.only_in_old.starred !== 0);
      break;

    case 'in-new':
      return (data.markstats.only_in_new.starred !== 0);
      break;
  }
}

function makePanel(title, content, id, type, data, ack_button, star) {
  var starred_class = panelIsStarred(id, data) ? ' starred' : '';
  var title_h = $('<h4>', { id: 'panel-title-'+id, class: 'panel-title'+starred_class })
    .append($('<a>', { 'data-toggle': 'collapse', 'data-target': '#panel-body-'+id, html: title }));

    if (ack_button) {
      title_h.append($('<span>', { id: 'ack-all-'+id, class: 'glyphicon glyphicon-ok ack' })
      .on("click", $.proxy(function(id, data) { toggleAckAllDiff(id, data) }, null, id, data)));
    }

    if (star) {
      title_h.append($('<span>', { id: 'starred-'+id, class: 'glyphicon glyphicon-star' }));
    }
  var title_badge = badgeValue(id, data);
  if (title_badge !== undefined) {
    title_h.append($('<span>', { id: 'badge-'+id, class: 'badge', html: title_badge}));
  }
  var heading = $('<div>', { class: 'panel-heading' })
    .append(title_h);

  var body = $('<div>', { id: 'panel-body-'+id, class: 'panel-collapse collapse in' })
    .append($('<div>', { class: 'panel-body', html: content }));

  var panel = $('<div>', { class: 'panel panel-'+type, id: 'panel-'+id })
    .append(heading)
    .append(body);

  return panel;
}

function autoCollapse(n, show) {
  if ($('#badge-'+n).text().charAt(0) === "0") {
    $('#panel-body-'+n).collapse('hide');
    return $('#panel-body-'+n).height();
  } else {
    if (show) $('#panel-body-'+n).collapse('show');
    return 0;
  }
}

function autoCollapseAll() {
  var offset = 0;
  offset += autoCollapse('diff');
  offset += autoCollapse('in-old');
  offset += autoCollapse('in-new');
  return offset;
}

function scrollToActiveNode() {
  $('#nodes')[0].scrollTop = 0;
  // Keep 2 items up
  var active = $('#nodeslist .active');
  $('#nodes')[0].scrollTop = active.position().top - 310 - active.height() * 4;
}

function listNodes(label, refresh_crumbs) {
  if (refresh_crumbs)
    setMousetrapNodeslist(label);

  var ul = $('<ul>', { id: 'nodeslist', class: 'list-group' });

  var breadcrumb = $('#breadcrumb');
  var crumbs = breadcrumb.children('li');
  if (refresh_crumbs) {
    if (crumbs.length < 2) {
      breadcrumb.append($('<li>', { id: 'crumb-label', class: 'navbar-text', html: label }));
    } else {
      crumbs[1].innerHTML = label;
      if (crumbs.length > 2) crumbs[2].remove();
    }
  } else {
    var cur_node = (crumbs.length > 2) ? crumbs[2].innerHTML : undefined;
  }

  if (label === 'with changes') {
    var most_differences = diff.most_differences;
    if (diff.max_diff === undefined)
      diff.max_diff = most_differences[0][Object.keys(diff.most_differences[0])];

    // Calculate ack stats for all nodes
    for (var i=0; i < most_differences.length; i++) {
      var node = Object.keys(most_differences[i])[0];
      var data = diff[node];

      data['markstats'] = {
        differences_as_diff: markStats(data.differences_as_diff),
        only_in_old: markStats(data.only_in_old, 'old'),
        only_in_new: markStats(data.only_in_new, 'new')
      };
      data['unacked_node_differences'] = data.markstats.differences_as_diff.unacked
                                       + data.markstats.only_in_old.unacked
                                       + data.markstats.only_in_new.unacked;
      data['starred_node_differences'] = data.markstats.differences_as_diff.starred
                                       + data.markstats.only_in_old.starred
                                       + data.markstats.only_in_new.starred;
    }

    // Sort nodes by unacked differences
    most_differences.sort(function(a, b) {
      var a_node = Object.keys(a)[0];
      var b_node = Object.keys(b)[0];

      return diff[b_node]['unacked_node_differences'] + diff[b_node]['starred_node_differences']
           - diff[a_node]['unacked_node_differences'] - diff[a_node]['starred_node_differences'];
    });

    for (var i=0; i < most_differences.length; i++) {
      // Weird data structure...
      var node = Object.keys(most_differences[i])[0];
      var data = diff[node];
      var n_diff = data.markstats.differences_as_diff.unacked;
      var p_diff = 100 * n_diff / data.node_differences;
      var n_oio = data.markstats.only_in_old.unacked;
      var p_oio = 100 * n_oio / data.node_differences;
      var n_oin = data.markstats.only_in_new.unacked;
      var p_oin = 100 * n_oin / data.node_differences;
      var all_acked_class = (data.unacked_node_differences === 0) ? ' all_acked' : '';
      var starred_class = (data.starred_node_differences === 0) ? '' : ' starred';
      var cur_node_class = (node === cur_node) ? ' active' : '';
      var bar_width = (5 * data.node_differences / diff.max_diff) + 'em';
      var nodeLine = $('<li>', { class: 'list-group-item'+all_acked_class+starred_class+cur_node_class, id: 'nodeslist:'+node })
        .append($('<div>', { class: 'progress', style: 'width: '+bar_width })
          .append(percentBarSection(p_oin, 'progress-bar-success', n_oin)
            .on("click", $.proxy(function(node) { displayNodeDiff(node, 'panel-in-new') }, null, node) ))
          .append(percentBarSection(p_oio, 'progress-bar-danger', n_oio)
            .on("click", $.proxy(function(node) { displayNodeDiff(node, 'panel-in-old') }, null, node) ))
          .append(percentBarSection(p_diff, 'progress-bar-warning', n_diff)
            .on("click", $.proxy(function(node) { displayNodeDiff(node, 'panel-diff') }, null, node) )))
        .append($('<div>', { class: 'glyphicon glyphicon-star star' }))
        .append($('<div>', { class: 'node-name', html: node })
          .on("click", $.proxy(function(node) { displayNodeDiff(node) }, null, node) ));
      ul.append(nodeLine);
    }
  } else if (label === 'failed') {
    var failed_panel = makePanel('Failed to compile files', failedFiles(), 'failed-files', 'danger', diff.pull_output.failed_to_compile_files.length);
    var errs_panel = makePanel('Compile error examples', compileErrors(), 'compile-errors','danger');
    var panels = $('<div>', { class: 'panel-group', id: 'accordion' })
                .append(failed_panel)
                .append(errs_panel);
    $('#node').html(panels);

    var failed = Object.keys(diff.pull_output.failed_nodes);
    for (var i=0; i < failed.length; i++) {
      var node = failed[i];
      var nodeLine = $('<li>', { class: 'list-group-item', id: 'nodeslist:'+node, html: node })
        .on("click", $.proxy(function(node) { displayNodeFail(node) }, null, node) );
      ul.append(nodeLine);
    }
  } else {
    ul.append($('<li>', { class: 'list-group-item', html: "Nothing to display for OK machines"} ));
  }
  $('#nodes').html(ul);
  scrollToActiveNode();
}

function scrollToActiveDiff() {
  // Open panel
  $('#node .panel-collapse:has(".resource.active")').collapse('show');
  $('#node')[0].scrollTop = 0;
  $('#node')[0].scrollTop = $('#node .resource.active').position().top - 50;
}

function firstDiff(panel) {
  var panel_id = (panel === undefined) ? '' : '#'+panel;
  var first_unmarked = $(panel_id+' .resource:not(".acked"):not(".starred"):first');
  var first = (first_unmarked.length === 0) ? $('#'+panel+' .resource:first') : first_unmarked;
  return first;
}

function displayNodeDiff(node, elem) {
  var data = diff[node];

  // setup keyboard shortcuts

  Mousetrap.unbind('k');
  Mousetrap.bind('k', function(e, combo) {
    var active = $('#node .resource.active');
    var new_active;
    if (active.length === 0) {
      new_active = firstDiff();
    } else {
      var resources = $('#node .resource');
      var active_idx = resources.index(active);
      if (active_idx > 0) {
        active.removeClass('active');
        new_active = $(resources[active_idx-1]);
      }
    }
    new_active.addClass('active');
    scrollToActiveDiff();
  });
  
  Mousetrap.unbind('j');
  Mousetrap.bind('j', function(e, combo) {
    var active = $('#node .resource.active');
    var new_active;
    if (active.length === 0) {
      new_active = firstDiff();
    } else {
      var resources = $('#node .resource');
      var active_idx = resources.index(active);
      if (active_idx < resources.length) {
        active.removeClass('active');
        new_active = $(resources[active_idx+1]);
      }
    }
    if (new_active !== undefined) {
      new_active.addClass('active');
      scrollToActiveDiff();
    }
  });

  Mousetrap.bind('g d', function(e, combo) {
    $('#node .resource.active').removeClass('active');
    var new_active = firstDiff('panel-diff');
    new_active.addClass('active');
    scrollToActiveDiff();
  });

  Mousetrap.bind('g o', function(e, combo) {
    $('#node .resource.active').removeClass('active');
    var new_active = firstDiff('panel-in-old');
    new_active.addClass('active');
    scrollToActiveDiff();
  });

  Mousetrap.bind('g n', function(e, combo) {
    $('#node .resource.active').removeClass('active');
    var new_active = firstDiff('panel-in-new');
    new_active.addClass('active');
    scrollToActiveDiff();
  });

  Mousetrap.unbind('enter');

  Mousetrap.bind('esc', function(e, combo) {
    setMousetrapNodeslist('with changes');
  });

  Mousetrap.bind('a', function(e, combo) {
    $('#node .active .ack')[0].click();
  });

  Mousetrap.bind('s', function(e, combo) {
    $('#node .active .star')[0].click();
  });

  // ack all
  Mousetrap.bind('* a', function(e, combo) {
    $('#node .active').parents('.panel')[0].children[0].getElementsByClassName('ack')[0].click()
  });

  Mousetrap.bind('c', function(e, combo) {
    $('#node .panel-collapse:has(".resource.active")').collapse('toggle');
  });

  var crumbs = $('#breadcrumb').children('li');
  if (crumbs.length == 3) {
    crumbs[2].innerHTML = node;
  } else {
    $('#breadcrumb').append($('<li>', { id: 'crumb-node', class: 'navbar-text', html: node }));
  }

  // Set active node in list
  $('#nodeslist').children('.active').removeClass('active');
  $('[id="nodeslist:'+node+'"]').addClass('active');
  $('#node').html($('<h2>', { class: 'node-title', html: node }));

  var stats_panel = makePanel('Diff stats', diffStats(data), 'stats', 'info', data);
  var differences_panel = makePanel('Differences', differencesAsDiff(data), 'diff', 'warning', data, true, true);
  var only_in_old_panel = makePanel('Only in old', onlyInOld(data), 'in-old', 'danger', data, true, true);
  var only_in_new_panel = makePanel('Only in new', onlyInNew(data), 'in-new', 'success', data, true, true);
  var panels = $('<div>', { class: 'panel-group', id: 'accordion' })
              .append(stats_panel)
              .append(differences_panel)
              .append(only_in_old_panel)
              .append(only_in_new_panel);

  $('#node').append(panels);

  var offset = autoCollapseAll();

  sh_highlightDocument();
  if ($(window).width() < 992) {
    // Mobile interface: scroll to div
    if (elem === undefined) {
      // Navbar is 50px high
      window.scrollTo(0, $('#node').position().top - 50);
    } else {
      window.scrollTo(0, $('#node').position().top - 50 + $('#'+elem).position().top - offset);
    }
  } else {
    // Desktop interface: scroll up in div
    if (elem === undefined) {
      $('#node').animate({scrollTop: 0}, 500);
    } else {
      $('#node')[0].scrollTop = 0;
      $('#node').animate({scrollTop: $('#'+elem).position().top - offset}, 500);
    }
  }
}

function percentBarSection(percentage, classes, html) {
  var classes_str = (classes === undefined) ? '' : ' '+classes;
  return $('<div>', {
        class: 'progress-bar'+classes_str,
        role: 'progressbar',
        style: 'width: '+percentage+'%;',
        html: html
      });
}

function percentBar(percentage, html, classes, bar_html, bar_classes) {
  var classes_str = (classes === undefined) ? '' : ' '+classes;
  var html_str = (html === false) ? undefined : percentage+'%';
  return $('<div>', { class: 'progress'+classes_str, html: html_str })
      .append(percentBarSection(percentage, bar_classes, bar_html));
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
  if (data['old_version'])
    ul.append($('<li>', { class: 'list-group-item', html: 'Old catalog version' })
      .append($('<span>', { class: 'badge', html: data.old_version })));
  if (data['new_version'])
    ul.append($('<li>', { class: 'list-group-item', html: 'New catalog version' })
      .append($('<span>', { class: 'badge', html: data.new_version })));
  return ul;
}

function markStats(diffs, type) {
  if (diffs.constructor === Array) {
    return markStatsArray(diffs, type);
  } else {
    return markStatsObject(diffs);
  }
}

function markStatsObject(diffs) {
  var keys = Object.keys(diffs);
  var stats = {
    acked: 0,
    starred: 0,
    total: keys.length
  };

  for (var i=0; i < keys.length; i++) {
    var k = keys[i];
    var d = diffs[k];
    var comp_d = d;
    if (comp_d.constructor === Array)
      comp_d = "--- old\n+++ new\n"+comp_d.join("\n");
    if (isAcked(k, comp_d))
      stats.acked += 1;
    if (isStarred(k, comp_d))
      stats.starred += 1;
  }

  stats['unacked'] = stats.total - stats.acked;

  return stats;
}

function markStatsArray(diffs, type) {
  var stats = {
    acked: 0,
    starred: 0,
    total: diffs.length
  };

  for (var i=0; i < diffs.length; i++) {
    var k = diffs[i];
    if (isAcked(k, type)) stats.acked += 1;
    if (isStarred(k, type)) stats.starred += 1;
  }

  stats['unacked'] = stats.total - stats.acked;

  return stats;
}


function isMarked(mark, k, str) {
  if (diff[mark] !== undefined && diff[mark][k] !== undefined && diff[mark][k].indexOf(str) !== -1) {
    return true;
  } else {
    return false;
  }
}

function isAcked(k, str) {
  return isMarked('acks', k, str);
}

function isStarred(k, str) {
  return isMarked('stars', k, str);
}

function toggleStarDiff(d, str, type, data) {
  if (isStarred(d, str)) {
    unstarDiff(d, str, type, data, true);
  } else {
    starDiff(d, str, type, data, true);
  }
}

function starDiff(d, str, type, data, refresh) {
  if (isAcked(d, str))
    unackDiff(d, str, type, data, false)
  markDiff('stars', 'starred', d, str, type, data, refresh);
}

function unstarDiff(d, str, type, data, refresh) {
  unmarkDiff('stars', 'starred', d, str, type, data, refresh);
}

function sanitizeStr(str) {
  return str.replace(/"/g, '_');
}

function differencesAsDiff(data) {
  var html = $('<p>');
  var diffs = data.differences_as_diff;
  var keys = Object.keys(diffs).sort();
  for (var i=0; i < keys.length; i++) {
    var k = keys[i];
    var diff_str = diffs[k];

    if (diff_str.constructor === Array) {
      diff_str = "--- old\n+++ new\n"+diff_str.join("\n");
    }
    var acked_class = isAcked(k, diff_str) ? ' acked' : '';
    var starred_class = isStarred(k, diff_str) ? ' starred' : '';
    var resource = $('<div>', { id: 'diff:'+sanitizeStr(k), class: 'list-group resource'+acked_class+starred_class })
      .append($('<div>', { class: 'glyphicon glyphicon-ok ack' })
          .on("click", $.proxy(function(k, diff_str, data) { toggleAckDiff(k, diff_str, 'diff', data) }, null, k, diff_str, data)))
      .append($('<div>', { class: 'glyphicon glyphicon-star star' })
          .on("click", $.proxy(function(k, diff_str, data) { toggleStarDiff(k, diff_str, 'diff', data) }, null, k, diff_str, data)))
      .append($('<div>', { class: 'resource-title', html: k }))
      .append($('<pre>', { class: 'sh_diff', html: diff_str }));

    if (data.content_differences[k]) {
      var content_diff_str = data.content_differences[k];
      resource.append($('<pre>', { class: 'sh_diff', html: content_diff_str }));
    } 

    html.append(resource);
  }
  return html;
}

function onlyIn(data, type) {
  var ul = $('<ul>', { id: 'only-in-'+type, class: 'list-group' });
  var r = data['only_in_'+type].sort();
  for (var i=0; i < r.length; i++) {
    var d = r[i];

    var acked_class = isAcked(d, type) ? ' acked' : '';
    var starred_class = isStarred(d, type) ? ' starred' : '';
    ul.append($('<li>', { id: 'in-'+type+':'+sanitizeStr(d), class: 'list-group-item resource'+acked_class+starred_class })
        .append($('<span>', { class: 'glyphicon glyphicon-ok ack' })
          .on("click", $.proxy(function(d, data) { toggleAckDiff(d, type, 'in-'+type, data) }, null, d, data)))
        .append($('<span>', { class: 'glyphicon glyphicon-star star' })
          .on("click", $.proxy(function(d, data) { toggleStarDiff(d, type, 'in-'+type, data) }, null, d, data)))
        .append($('<div>', { class: 'resource-title', html: d })));
  }
  return ul;
}

function onlyInOld(data) {
  return onlyIn(data, 'old');
}

function onlyInNew(data) {
  return onlyIn(data, 'new');
}

function displayNodeFail(node) {
  var data = diff.pull_output.failed_nodes[node];

  var crumbs = $('#breadcrumb').children('li');
  if (crumbs.length == 3) {
    crumbs[2].innerHTML = node;
  } else {
    $('#breadcrumb').append($('<li>', { id: 'crumb-node', class: 'navbar-text', html: node }));
  }

  $('#nodeslist').children('.active').removeClass('active');
  $('[id="nodeslist:'+node+'"]').addClass('active');
  var html = $('<h2>', { class: 'node-title', html: node });
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

function toggleAckDiff(d, str, type, data) {
  if (isAcked(d, str)) {
    unackDiff(d, str, type, data, true);
  } else {
    ackDiff(d, str, type, data, true);
  }
}

function arrayToObj(arr, v) {
  var obj = new Object;
  for (var i=0; i < arr.length; i++) {
    obj[arr[i]] = v;
  }
  return obj;
}

function hasClass(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function toggleAckAllDiff(id, data) {
  if (hasClass($('#ack-all-'+id)[0], 'acked')) {
    unackAllDiff(id, data);
  } else {
    ackAllDiff(id, data);
  }
}

function foreachDiff(id, data, cb) {
  var diffs;
  switch (id) {
    case 'diff':
      diffs = data.differences_as_diff;
      break;

    case 'in-old':
      diffs = arrayToObj(data.only_in_old, 'old');
      break;

    case 'in-new':
      diffs = arrayToObj(data.only_in_new, 'new');
      break;
  }

  var keys = Object.keys(diffs).sort();
  for (var i=0; i < keys.length; i++) {
    var k = keys[i];
    var d = diffs[k];
    var comp_d = d;
    if (comp_d.constructor === Array)
      comp_d = "--- old\n+++ new\n"+comp_d.join("\n");
    cb(k, comp_d);
  }
}

function ackAllDiff(id, data) {
  foreachDiff(id, data, function(k, d) {
    if (isAcked(k, d)) return;
    if (isStarred(k, d)) return;
    ackDiff(k, d, id, data);
  })

  $('#ack-all-'+id).addClass('acked');

  // Only refresh once
  refreshStats(id, data);
  autoCollapse(id);
}

function unackAllDiff(id, data) {
  foreachDiff(id, data, function(k, d) {
    unackDiff(k, d, id, data);
  })

  $('#ack-all-'+id).removeClass('acked');

  // Only refresh once
  refreshStats(id, data);
  autoCollapse(id, true);
}

function markDiff(mark, klass, d, str, type, data, refresh) {
  if (diff[mark] === undefined) diff[mark] = new Object;
  if (diff[mark][d] === undefined) diff[mark][d] = new Array;
  if (diff[mark][d].indexOf(str) === -1) diff[mark][d].push(str);
  $('[id="'+type+':'+sanitizeStr(d)+'"]').addClass(klass);

  if (refresh) {
    refreshStats(type, data);
    autoCollapseAll();
  }
}

function unmarkDiff(mark, klass, d, str, type, data, refresh) {
  idx = diff[mark][d].indexOf(str);
  diff[mark][d].splice(idx, 1);
  $('[id="'+type+':'+sanitizeStr(d)+'"]').removeClass(klass);
  
  if (refresh) refreshStats(type, data);
}

function ackDiff(d, str, type, data, refresh) {
  if (isStarred(d, str))
    unstarDiff(d, str, type, data, false)
  markDiff('acks', 'acked', d, str, type, data, refresh);
}

function unackDiff(d, str, type, data, refresh) {
  // Happens if starred
  if (diff.acks[d] === undefined) return;
  unmarkDiff('acks', 'acked', d, str, type, data, refresh);
}

function refreshStats(type, data) {
  // Refresh node list
  listNodes('with changes');
  // Refresh badge
  $('[id="badge-'+type+'"]').html(badgeValue(type, data));
  // data is up-to-date as listNodes was called
  if (panelIsStarred(type, data)) {
    $('[id="panel-title-'+type+'"]').addClass('starred');
  } else {
    $('[id="panel-title-'+type+'"]').removeClass('starred');
  }
}

function setMousetrapNodeslist(label) {
  Mousetrap.unbind('k');
  Mousetrap.unbind('j');
  Mousetrap.unbind('enter');
  Mousetrap.unbind('esc');
  Mousetrap.unbind('a');
  Mousetrap.unbind('s');
  Mousetrap.unbind('* a');
  Mousetrap.unbind('c');
  Mousetrap.unbind('g d');
  Mousetrap.unbind('g o');
  Mousetrap.unbind('g n');

  Mousetrap.bind('k', function(e, combo) {
    var active = $('#nodeslist .active');
    active.removeClass('active');
    var prev = active.prev();
    var new_active = (active.length === 0 || prev.length === 0) ? $('#nodeslist .list-group-item:first') : active.prev();
    new_active.addClass('active');
    scrollToActiveNode();
  });

  Mousetrap.bind('j', function(e, combo) {
    var active = $('#nodeslist .active');
    active.removeClass('active');
    var next = active.next();
    var new_active = (active.length === 0 || next.length === 0) ? $('#nodeslist .list-group-item:first') : active.next();
    new_active.addClass('active');
    scrollToActiveNode();
  });

  if (label === 'with changes') {
    Mousetrap.bind('enter', function(e, combo) {
      var active = $('#nodeslist .active');
      active.children('.node-name').click()
    });
  } else if (label === 'failed') {
    Mousetrap.bind('enter', function(e, combo) {
      var active = $('#nodeslist .active');
      active.click()
    });
  }
}
