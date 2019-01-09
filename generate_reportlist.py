#!/usr/bin/env python
import json
from os import listdir, path
maindir = path.dirname(path.abspath(__file__))
datadir = path.join(maindir,'data')
datafiles = [f for f in listdir(datadir) if path.isfile(path.join(datadir, f)) and f != "reportlist.json"]
datadict = {}
for f in datafiles:
    if f.endswith('.json'):
        f = f[:-5]
        datadict.update({f:f})
with open(path.join(maindir,'reportlist.json'), 'w') as reportlist:
    json.dump(datadict, reportlist, indent=4, sort_keys=True)

