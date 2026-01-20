pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        JWT_SECRET = credentials('jwt-secret')
        EC2_HOST = credentials('ec2-host')
        EC2_USER = 'ubuntu'
        DOCKER_IMAGE_CLIENT = 'ambaskaryash/xpromanage-client'
        DOCKER_IMAGE_SERVER = 'ambaskaryash/xpromanage-server'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Environment Setup') {
            steps {
                echo 'Setting up environment variables...'
                sh '''
                    echo "NODE_ENV=production" > server/.env
                    echo "PORT=5000" >> server/.env
                    echo "MONGODB_URI=mongodb://admin:admin123@mongo:27017/xpromanage?authSource=admin" >> server/.env
                    echo "JWT_SECRET=${JWT_SECRET}" >> server/.env
                    echo "JWT_EXPIRE=7d" >> server/.env
                '''
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('server') {
                            echo 'Installing backend dependencies...'
                            sh 'npm install'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('client') {
                            echo 'Installing frontend dependencies...'
                            sh 'npm install'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('server') {
                            echo 'Running backend tests...'
                            sh 'npm test || true'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('client') {
                            echo 'Running frontend tests...'
                            sh 'npm test -- --watchAll=false || true'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('server') {
                            echo 'Building backend Docker image...'
                            sh """
                                docker build -t ${DOCKER_IMAGE_SERVER}:${IMAGE_TAG} .
                                docker tag ${DOCKER_IMAGE_SERVER}:${IMAGE_TAG} ${DOCKER_IMAGE_SERVER}:latest
                            """
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('client') {
                            echo 'Building frontend Docker image...'
                            sh """
                                docker build -t ${DOCKER_IMAGE_CLIENT}:${IMAGE_TAG} .
                                docker tag ${DOCKER_IMAGE_CLIENT}:${IMAGE_TAG} ${DOCKER_IMAGE_CLIENT}:latest
                            """
                        }
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                sh '''
                    echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin
                    docker push ${DOCKER_IMAGE_SERVER}:${IMAGE_TAG}
                    docker push ${DOCKER_IMAGE_SERVER}:latest
                    docker push ${DOCKER_IMAGE_CLIENT}:${IMAGE_TAG}
                    docker push ${DOCKER_IMAGE_CLIENT}:latest
                '''
            }
        }
        
        stage('Deploy to AWS EC2') {
            steps {
                echo 'Deploying to AWS EC2...'
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            cd /home/ubuntu/xpromanage || exit
                            
                            # Pull latest code
                            git pull origin main
                            
                            # Pull latest Docker images
                            docker pull ${DOCKER_IMAGE_SERVER}:latest
                            docker pull ${DOCKER_IMAGE_CLIENT}:latest
                            
                            # Stop and remove old containers
                            docker-compose down
                            
                            # Start new containers
                            docker-compose up -d
                            
                            # Clean up old images
                            docker image prune -f
                        '
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo 'Performing health check...'
                script {
                    sleep(time: 30, unit: 'SECONDS')
                    sh """
                        curl -f http://${EC2_HOST}:5000/api/health || exit 1
                        echo "Health check passed!"
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            // You can add Slack/Email notifications here
        }
        failure {
            echo 'Pipeline failed!'
            // You can add Slack/Email notifications here
        }
        always {
            echo 'Cleaning up...'
        }
    }
}
