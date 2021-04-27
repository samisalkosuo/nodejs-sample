#run application script

export NPROC=$(nproc)

if [[ "$DISABLE_INSTANA" == "true" ]]; then
  #DISABLE_INSTANA exists, disable instana
  #by commeting instana collector linws
  sed -i 's/import instana/\/\/import instana/g' app.js
  sed -i 's/instana()/\/\/instana()/g' app.js
fi

exec node --expose-gc --max-old-space-size=${HEAP_SIZE} app.js
