#!/bin/bash

set -o errexit

source build.env
__ver=$VERSION
__docker_image_name=${APP_NAME}:${__ver}
docker build -t ${__docker_image_name} .
docker tag ${__docker_image_name} ${APP_NAME}:latest
