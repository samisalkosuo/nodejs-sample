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
        slackSend(message: "Building Docker image...", channel: '#deployments', failOnError: true,color: '#0000FF')
        sh '''source build.env
__ver=$VERSION
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
        slackSend(message: "Pushing ${env.APP_NAME} Docker image to ICP...", channel: '#deployments', failOnError: true,color: '#0000FF')
        sh '''__ver=$(cat VERSION)
__docker_image_name=${APP_NAME}:${__ver}
bash jenkins/deploy_step_1.sh ${__docker_image_name}
'''
        slackSend(message: "Deploying Helm chart ${env.APP_NAME}...", channel: '#deployments', failOnError: true,color: '#0000FF')
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
        slackSend(message: "Production build ended: ${env.JOB_NAME} ${env.BUILD_NUMBER}\nApp running in ICP.\n\nApplication URL: ${ICP_APP_URL}", channel: '#deployments', failOnError: true,color: '#0000FF')
      }
    }  
  }

  post { 
        failure { 
            slackSend(message: "FAILURE: ${env.JOB_NAME} ${env.BUILD_NUMBER}.", channel: '#deployments',color: '#FF0000')
        }
        success { 
            slackSend(message: "SUCCESS: ${env.JOB_NAME} ${env.BUILD_NUMBER}.", channel: '#deployments',color: '#00FF00')

        }
    }


}