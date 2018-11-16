pipeline {
  agent any

  stages {

    stage('begin deployment - prod') {
      when {
        branch 'master'
      }
      steps {
        slackSend(message: "PROD build started: ${env.JOB_NAME} ${env.BUILD_NUMBER}...", channel: '#deployments', failOnError: true,color: '#0000FF')
      }
    }

    stage('Build Docker image') {
      when {
        anyOf { branch 'master'; branch 'test' }
      }
      steps {
        sh '''__ver=$(cat VERSION)
__docker_image_name=${APP_NAME}:${__ver}
docker build -t ${__docker_image_name} .
docker tag ${__docker_image_name} ${APP_NAME}:latest'''
      }
    }

    stage('Production deployment to ICP') {
      when {
        branch 'master'
      }
      steps {
        sh '''__ver=$(cat VERSION)
__docker_image_name=${APP_NAME}:${__ver}
bash jenkins/deploy_step_1.sh ${__docker_image_name}
'''
        sh '''__ver=$(cat VERSION)
__docker_image_name=${APP_NAME}:${__ver}
bash jenkins/deploy_step_helm.sh ${__docker_image_name}
'''
      }
    }


    stage('end deployment - prod') {
      when {
        branch 'master'
      }
      environment { 
        ICP_APP_URL = sh (returnStdout: true, script: 'cat ICP_APP_URL').trim()
      }
      steps {
        sh '''echo App url: $ICP_APP_URL'''
      }
    }  
  }

}