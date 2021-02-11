#!/bin/bash

# copy javascript-client builds locally
cp -r ./node_modules/@splitsoftware/splitio/es  ./es/splitio
cp -r ./node_modules/@splitsoftware/splitio/lib  ./lib/splitio
cp -r ./node_modules/@splitsoftware/splitio/types  ./types/splitio

# update splitio type definitions to only resolve the browser variant of SplitFactory type
replace 'export function SplitFactory\(settings: SplitIO.INode'  '// export function SplitFactory(settings: SplitIO.INode' ./types/splitio/index.d.ts

# replace javascript-client imports to use local copy
replace '@splitsoftware/splitio' './splitio' ./lib/index.js ./es/index.js ./lib/utils.js ./es/utils.js ./types/index.d.ts

# replace javascript-client package.json files to use browser modules
replace '"main": "./node.js"' '"main": "./browser.js"' ./lib/splitio ./es/splitio -r --include="package.json"

# replace React SDK version placeholder
VERSION=$(node -e "(function () { console.log(require('./package.json').version) })()")

replace 'REACT_SDK_VERSION_NUMBER' $VERSION ./lib/constants.js ./es/constants.js
replace 'REACT_SDK_VERSION_NUMBER' $VERSION ./lib-umd -r

if [ $? -eq 0 ]
then
  exit 0
else
  exit 1
fi
