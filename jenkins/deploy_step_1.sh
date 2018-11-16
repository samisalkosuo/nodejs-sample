#!/bin/bash

set -o errexit

source build.env
__ver=$VERSION
__docker_image_name=${APP_NAME}:${__ver}

#Deploy  app to ICP
#Step 1 push image

__image_name=$__docker_image_name

#echo "CAM_USER: ${CAM_USER}"
#echo "CAM_PASSWORD: ${CAM_PASSWORD}"
#echo "CAM_URL: ${CAM_URL}"
#echo "ICP_URL: ${ICP_URL}"

echo "Deploying ${__image_name} to ICP..."

source jenkins/variables.sh

#login to icp
docker login ${__docker_registry} -u $CAM_USER -p $CAM_PASSWORD

#remember to add docker registry certificate 
#https://www.ibm.com/support/knowledgecenter/en/SSBS6K_2.1.0.3/manage_images/configuring_docker_cli.html
#tag and push image
docker tag ${__image_name} ${__icp_image_name}
echo "Pushing ${__image_name} to ICP..."
docker push ${__icp_image_name}
