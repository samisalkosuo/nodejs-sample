#consume cpu script
#see https://superuser.com/a/443500

#NPROC env variable set in Dockerfile, when executing node app
function consumeCPU
{
    local CORES=$1
    for i in `seq 1 $NPROC`; do 
      #starting two processes per processor
      sha1sum /dev/zero &
      sha1sum /dev/zero &
      #cat /dev/zero > /dev/null &
      #echo "$i: started /dev/zero > /dev/null &"
      #echo "$i: started sha1sum /dev/zero &"
    done

}

consumeCPU $NPROC

exit 0
