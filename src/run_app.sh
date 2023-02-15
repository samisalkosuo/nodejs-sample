#run application script

export NPROC=$(nproc)
#allow self signed certificates from node.js
export NODE_TLS_REJECT_UNAUTHORIZED=0

if [[ "$ENABLE_INSTANA" == "true" ]]; then
  #ENABLE_INSTANA is true, enable instana
  export NODE_OPTIONS="--require ./node_modules/@instana/collector/src/immediate"
fi

#get version from package.json
export PACKAGE_VERSION=$(cat package.json | grep '"version"' | head -n 1 | awk '{print $2}' | sed 's/"//g; s/,//g')

#execute app
exec node --expose-gc --max-old-space-size=${HEAP_SIZE} app.js
