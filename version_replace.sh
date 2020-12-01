#!/bin/bash

# copy javascript-client builds locally
cp -r ./node_modules/@splitsoftware/splitio/es  ./es/splitio
cp -r ./node_modules/@splitsoftware/splitio/lib  ./lib/splitio

# replace javascript-client imports to use local copy
replace '@splitsoftware/splitio' './splitio' ./lib/index.js ./es/index.js ./lib/utils.js ./es/utils.js
replace '../../../package.json' '../../../../package.json' ./lib/splitio/utils/settings/index.js ./es/splitio/utils/settings/index.js

# replace javascript-client package.json to use browser modules
replace '"main": "./node.js"' '"main": "./browser/Full.js"' ./lib/splitio/producer/package.json ./es/splitio/producer/package.json
replace '"main": "./node.js"' '"main": "./browser.js"' ./lib/splitio ./es/splitio -r --include="package.json"
replace '"main": "node.js"' '"main": "./browser.js"' ./lib/splitio ./es/splitio -r --include="package.json"
replace '"main": "./SegmentUpdateWorker.js"' '"main": "./MySegmentUpdateWorker.js"' ./lib/splitio ./es/splitio -r --include="package.json"

if [ $? -eq 0 ]
then
  exit 0
else
  exit 1
fi
