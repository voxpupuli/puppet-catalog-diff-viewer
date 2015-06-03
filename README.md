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


