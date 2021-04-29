#run application script

export NPROC=$(nproc)

export NODE_OPTIONS="--require ./node_modules/@instana/collector/src/immediate"
if [[ "$DISABLE_INSTANA" == "true" ]]; then
  #DISABLE_INSTANA exists, disable instana
  #by unsettings env variable
  unset NODE_OPTIONS
fi

exec node --expose-gc --max-old-space-size=${HEAP_SIZE} app.js
