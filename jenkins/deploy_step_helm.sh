#!/bin/bash

set -o errexit

source build.env
__ver=$VERSION
__docker_image_name=${APP_NAME}:${__ver}


#Deploy Daytrader app to ICP using Helm chart

__image_name=$1

source build.env
source jenkins/variables.sh

#Deploy Daytrader using Helm chart

#Login to ICP and set default account id and default namespae
cloudctl login -a ${ICP_URL} --skip-ssl-validation -u ${CAM_USER} -p ${CAM_PASSWORD} -c id-mycluster-account -n default

#function that changes occurrences of string in file
function changeString {
    if [[ $# -ne 3 ]]; then
        echo "$FUNCNAME ERROR: Wrong number of arguments. Requires FILE FROMSTRING TOSTRING."
        return 1
    fi

    local SED_FILE=$1
    local FROMSTRING=$2
    local TOSTRING=$3
    local TMPFILE=$SED_FILE.tmp

    #get file owner and permissions
    local USER=$(stat -c %U $SED_FILE)
    local GROUP=$(stat -c %G $SED_FILE)
    local PERMISSIONS=$(stat -c %a $SED_FILE)

    #escape to and from strings
    FROMSTRINGESC=$(echo $FROMSTRING | sed -e 's/\\/\\\\/g' -e 's/\//\\\//g' -e 's/&/\\\&/g')
    TOSTRINGESC=$(echo $TOSTRING | sed -e 's/\\/\\\\/g' -e 's/\//\\\//g' -e 's/&/\\\&/g')

    sed -e "s/$FROMSTRINGESC/$TOSTRINGESC/g" $SED_FILE  > $TMPFILE && mv $TMPFILE $SED_FILE

  #set original owner and permissions
    chown $USER:$GROUP $SED_FILE
    chmod $PERMISSIONS $SED_FILE
    if [ ! -f $TMPFILE ]; then
        return 0
    else
         echo "$FUNCNAME ERROR: Something went wrong."
         return 2
    fi
}

#setup ICP helm repo
echo "Setup up ICP Helm repo"
helm init --skip-refresh
helm repo add local-charts https://mycluster.icp:8443/helm-repo/charts
helm repo update

__app_name=${APP_NAME}

#docker login
docker login -u ${CAM_USER} -p ${CAM_PASSWORD} mycluster.icp:8500

#tag name is latest version
__tag_name=$(cat VERSION)

__icp_image_name=mycluster.icp:8500/default/${__app_name}:${__tag_name}
docker tag ${__app_name}:latest ${__icp_image_name}

#push docker image to ICP
docker push ${__icp_image_name} || true

echo "production deployment" 

__prod_host_name=daytrader.${ICP_PROXY_IP}.nip.io

#create cert and secret
__app_prod_secret_name=daytrader-secret
set +e
kubectl get secret |grep ${__app_prod_secret_name}
rc=$?
if [[ $rc != 0 ]]; then
  # create app prod secret
  echo "Creating self-signed certificate"
  __tls_name=daytrader-tls
  openssl req -x509 -nodes -days 7000 -newkey rsa:2048 -keyout ${__tls_name}.key -out ${__tls_name}.crt -subj "/CN=${__prod_host_name}"
  kubectl create secret tls ${__app_prod_secret_name} --key ${__tls_name}.key --cert ${__tls_name}.crt
fi
set -e

echo "Install Helm chart.."
cd helm
#modify Helm chart
changeString ${__app_name}/Chart.yaml "||VERSION||" ${__tag_name}
changeString ${__app_name}/values.yaml "||IMAGE_NAME||" mycluster.icp:8500/default/${__app_name}
changeString ${__app_name}/values.yaml "||IMAGE_TAG||" ${__tag_name}
changeString ${__app_name}/values.yaml "||HOST_NAME||" ${__prod_host_name}
changeString ${__app_name}/templates/deployment.yaml "||DB_IP_ADDRESS||" ${DAYTRADER_DB_IP}

#package Helm
helm package ${__app_name}
__helm_tar_file=$(ls *tgz)
#load Helm chart to ICP
cloudctl catalog load-helm-chart --archive ${__helm_tar_file}
helm repo update

set +e
helm list -a --tls |grep ${__app_name}
rc=$?
if [[ $rc == 0 ]]; then
  #deployment exists
  echo "Deployment exists.. upgrading."
  helm upgrade ${__app_name} local-charts/${__app_name} --tls
else
  #deployment does not exist, install
  helm install --name ${__app_name} local-charts/${__app_name} --tls
fi
set -e

echo "Daytrader should be deployed: https://${__prod_host_name}."

echo https://${__prod_host_name} > ../ICP_APP_URL
