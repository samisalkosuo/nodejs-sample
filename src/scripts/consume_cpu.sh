#consume cpu script
#see https://superuser.com/a/443500

#NPROC env variable set in Dockerfile, when executing node app
function consumeCPU
{
    local CORES=$1
    for i in `seq 1 $NPROC`; do 
      cat /dev/zero > /dev/null &
      sha1sum /dev/zero &
      #echo "$i: started /dev/zero > /dev/null &"
      #echo "$i: started sha1sum /dev/zero &"
    done

}

#two processes per core
consumeCPU $NPROC
consumeCPU $NPROC

exit 0
