    var traps = {
      'profiles': new Object(),

      'new': function(name, template) {
        this.profiles[name] = new Mousetrap();
        if (template !== undefined) {
          this.profiles[name]._callbacks = this.profiles[template]._callbacks;
          this.profiles[name]._directMap = this.profiles[template]._directMap;
        }
        // Pause by default
        this.profiles[name].pause();
      },

      'save': function() {
        var keys = Object.keys(this.profiles);
        for (var i=0; i < keys.length; i++) {
          if (this.profiles[keys[i]].paused === false) {
            this.saved = keys[i];
            return;
          }
        }
      },

      'restore': function() {
        var keys = Object.keys(this.profiles);
        for (var i=0; i < keys.length; i++) {
          if (keys[i] === this.saved) {
            this.profiles[keys[i]].unpause();
          } else {
            this.profiles[keys[i]].pause();
          }
        }
      },

      'pause': function() {
        var keys = Object.keys(this.profiles);
        for (var i=0; i < keys.length; i++) {
          this.profiles[keys[i]].pause();
        }
      },

      'select': function(profile) {
        this.save();
        this.pause();
        this.profiles[profile].unpause();
      }
    };

    // Main key bindings
    traps.new('main');
    traps.profiles.main.bind('h', function(e, combo) {
      $('#keys-help').show();
      traps.select('help');
    });
    traps.profiles.main.bind('?', function(e, combo) {
      $('#keys-help').show();
      traps.select('help');
    });

    traps.profiles.main.bind('w', function(e, combo) {
      listNodes('with changes', true);
    });

    traps.profiles.main.bind('f', function(e, combo) {
      listNodes('failed', true);
    });

    traps.profiles.main.bind('m', function(e, combo) {
      $('#reports-list-button').click();
      traps.select('reports');
    });

    // Reports menu key bindings
    traps.new('reports');
    traps.profiles.reports.bind('j', function(e, combo) {
      var active = $('#reports-list .active');
      if (active.next().length !== 0) {
        active.removeClass('active');
        active.next().addClass('active');
      }
    });

    traps.profiles.reports.bind('k', function(e, combo) {
      var active = $('#reports-list .active');
      if (active.prev().length !== 0) {
        active.removeClass('active');
        active.prev().addClass('active');
      }
    });

    traps.profiles.reports.bind('enter', function(e, combo) {
      $('#reports-list .active a').click();
      $('#reports-list-button').click();
      traps.restore();
    });

    traps.profiles.reports.bind('esc', function(e, combo) {
      $('#reports-list-button').click();
      traps.restore();
    });

    // Help key bindings
    traps.new('help');
    traps.profiles.help.bind('esc', function(e, combo) {
      $('#keys-help').hide();
      traps.restore();
    });

    // Nodes list key bindings
    traps.new('nodes', 'main');
    traps.profiles.nodes.bind('k', function(e, combo) {
            console.log('k');
      var active = $('#nodeslist .active');
      active.removeClass('active');
      var prev = active.prev();
      var new_active = (active.length === 0 || prev.length === 0) ? $('#nodeslist .list-group-item:first') : active.prev();
      new_active.addClass('active');
      scrollToActiveNode();
    });

    traps.profiles.nodes.bind('j', function(e, combo) {
      var active = $('#nodeslist .active');
      active.removeClass('active');
      var next = active.next();
      var new_active = (active.length === 0 || next.length === 0) ? $('#nodeslist .list-group-item:first') : active.next();
      new_active.addClass('active');
      scrollToActiveNode();
    });

    traps.profiles.nodes.bind('g t', function(e, combo) {
      var active = $('#nodeslist .active');
      active.removeClass('active');
      $('#nodeslist .list-group-item:first').addClass('active');
      scrollToActiveNode();
    });

    traps.profiles.nodes.bind('g b', function(e, combo) {
      var active = $('#nodeslist .active');
      active.removeClass('active');
      $('#nodeslist .list-group-item:last').addClass('active');
      scrollToActiveNode();
    });

    traps.profiles.nodes.bind('enter', function(e, combo) {
      var active = $('#nodeslist .active');
      if (active.children('.node-name').length === 0) {
        active.click();
      } else {
        active.children('.node-name').click();
      }
    });

    // Node view key bindings
    traps.new('node', 'main');
    traps.profiles.node.bind('k', function(e, combo) {
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
    
    traps.profiles.node.bind('j', function(e, combo) {
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

    traps.profiles.node.bind('g d', function(e, combo) {
      $('#node .resource.active').removeClass('active');
      var new_active = firstDiff('panel-diff');
      new_active.addClass('active');
      scrollToActiveDiff();
    });

    traps.profiles.node.bind('g o', function(e, combo) {
      $('#node .resource.active').removeClass('active');
      var new_active = firstDiff('panel-in-old');
      new_active.addClass('active');
      scrollToActiveDiff();
    });

    traps.profiles.node.bind('g n', function(e, combo) {
      $('#node .resource.active').removeClass('active');
      var new_active = firstDiff('panel-in-new');
      new_active.addClass('active');
      scrollToActiveDiff();
    });

    traps.profiles.node.bind('esc', function(e, combo) {
      traps.select('nodes');
    });

    traps.profiles.node.bind('a', function(e, combo) {
      $('#node .active .ack')[0].click();
    });

    traps.profiles.node.bind('s', function(e, combo) {
      $('#node .active .star')[0].click();
    });

    traps.profiles.node.bind('* a', function(e, combo) {
      $('#node .active').parents('.panel')[0].children[0].getElementsByClassName('ack')[0].click()
    });

    traps.profiles.node.bind('c', function(e, combo) {
      $('#node .panel-collapse:has(".resource.active")').collapse('toggle');
    });

    // Activate main bindings
    traps.select('main');
