    var traps = {
      'main': new Mousetrap(),

      'nodes': new Mousetrap(),

      'node': new Mousetrap(),

      'help': new Mousetrap(),

      'reports': new Mousetrap(),

      'saved': {},

      'save': function() {
        this.saved = {
          'main': this.main.paused,
          'nodes': this.nodes.paused,
          'node': this.node.paused,
          'help': this.help.paused,
          'reports': this.reports.paused
        };
      },

      'restore': function() {
        this.main.paused = this.saved.main;
        this.nodes.paused = this.saved.nodes;
        this.node.paused = this.saved.node;
        this.help.paused = this.saved.help;
        this.reports.paused = this.saved.reports;
      }
    };

    // Main key bindings
    traps.main.bind('h', function(e, combo) {
      $('#keys-help').show();
      traps.save();
      traps.main.pause();
      traps.node.pause();
      traps.nodes.pause();
      traps.help.unpause();
    });
    traps.main.bind('?', function(e, combo) {
      $('#keys-help').show();
      traps.save();
      traps.main.pause();
      traps.node.pause();
      traps.nodes.pause();
      traps.help.unpause();
    });

    traps.main.bind('w', function(e, combo) {
      listNodes('with changes', true);
    });

    traps.main.bind('f', function(e, combo) {
      listNodes('failed', true);
    });

    traps.main.bind('m', function(e, combo) {
      $('#reports-list-button').click();
      // See if we can do this when user clicks, too
      traps.save();
      traps.nodes.pause();
      traps.node.pause();
      traps.reports.unpause();
    });

    // Reports menu key bindings
    traps.reports.pause();
    traps.reports.bind('j', function(e, combo) {
      var active = $('#reports-list .active');
      if (active.next().length !== 0) {
        active.removeClass('active');
        active.next().addClass('active');
      }
    });

    traps.reports.bind('k', function(e, combo) {
      var active = $('#reports-list .active');
      if (active.prev().length !== 0) {
        active.removeClass('active');
        active.prev().addClass('active');
      }
    });

    traps.reports.bind('enter', function(e, combo) {
      $('#reports-list .active a').click();
      $('#reports-list-button').click();
      traps.restore();
    });

    traps.reports.bind('esc', function(e, combo) {
      $('#reports-list-button').click();
      traps.restore();
    });

    // Help key bindings
    traps.help.pause();
    traps.help.bind('esc', function(e, combo) {
      $('#keys-help').hide();
      traps.restore();
    });

    // Nodes list key bindings
    traps.nodes.pause();
    traps.nodes.bind('k', function(e, combo) {
      var active = $('#nodeslist .active');
      var prev = active.prev();
      var new_active = (active.length === 0 || prev.length === 0) ? firstNode() : active.prev();
      selectNode(new_active);
    });

    traps.nodes.bind('j', function(e, combo) {
      var active = $('#nodeslist .active');
      var next = active.next();
      var new_active = (active.length === 0 || next.length === 0) ? firstNode() : active.next();
      selectNode(new_active);
    });

    traps.nodes.bind('g t', function(e, combo) {
      var active = $('#nodeslist .active');
      active.removeClass('active');
      $('#nodeslist .list-group-item:first').addClass('active');
      scrollToActiveNode();
    });

    traps.nodes.bind('g b', function(e, combo) {
      var active = $('#nodeslist .active');
      active.removeClass('active');
      $('#nodeslist .list-group-item:last').addClass('active');
      scrollToActiveNode();
    });

    traps.nodes.bind('enter', function(e, combo) {
      var active = $('#nodeslist .active');
      if (active.children('.node-name').length === 0) {
        active.click();
      } else {
        active.children('.node-name').click();
      }
    });

    // Node view key bindings
    traps.node.pause();
    traps.node.bind('k', function(e, combo) {
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
    
    traps.node.bind('j', function(e, combo) {
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

    traps.node.bind('g d', function(e, combo) {
      $('#node .resource.active').removeClass('active');
      var new_active = firstDiff('panel-diff');
      new_active.addClass('active');
      scrollToActiveDiff();
    });

    traps.node.bind('g o', function(e, combo) {
      $('#node .resource.active').removeClass('active');
      var new_active = firstDiff('panel-in-old');
      new_active.addClass('active');
      scrollToActiveDiff();
    });

    traps.node.bind('g n', function(e, combo) {
      $('#node .resource.active').removeClass('active');
      var new_active = firstDiff('panel-in-new');
      new_active.addClass('active');
      scrollToActiveDiff();
    });

    traps.node.bind('esc', function(e, combo) {
      traps.node.pause();
      traps.nodes.unpause();
    });

    traps.node.bind('a', function(e, combo) {
      $('#node .active .ack')[0].click();
    });

    traps.node.bind('s', function(e, combo) {
      $('#node .active .star')[0].click();
    });

    traps.node.bind('* a', function(e, combo) {
      $('#node .active').parents('.panel')[0].children[0].getElementsByClassName('ack')[0].click()
    });

    traps.node.bind('c', function(e, combo) {
      $('#node .panel-collapse:has(".resource.active")').collapse('toggle');
    });

