# Jenkins CI/CD Setup Guide

This guide will help you set up Jenkins for continuous integration and deployment of XProManage.

## Prerequisites

- Jenkins server (can be on EC2 or separate server)
- Docker installed on Jenkins server
- GitHub repository
- AWS EC2 instance for deployment
- Docker Hub account

## Step 1: Install Jenkins

### On Ubuntu/Debian

```bash
# Update system
sudo apt update

# Install Java
sudo apt install openjdk-11-jdk -y

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins at: `http://your-jenkins-server:8080`

## Step 2: Install Required Plugins

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Install the following plugins:
   - Docker Pipeline
   - Docker
   - AWS Steps
   - NodeJS Plugin
   - Git Plugin
   - GitHub Integration Plugin
   - Pipeline
   - Credentials Binding Plugin

3. Restart Jenkins after installation

## Step 3: Configure Jenkins Tools

### Configure NodeJS

1. Go to **Manage Jenkins** → **Global Tool Configuration**
2. Scroll to **NodeJS**
3. Click **Add NodeJS**
4. Name: `NodeJS-18`
5. Version: Select NodeJS 18.x
6. Save

### Configure Docker

1. Go to **Manage Jenkins** → **Global Tool Configuration**
2. Scroll to **Docker**
3. Click **Add Docker**
4. Name: `Docker`
5. Install automatically: Check
6. Save

## Step 4: Set Up Credentials

### Docker Hub Credentials

1. Go to **Manage Jenkins** → **Manage Credentials**
2. Click **(global)** domain
3. Click **Add Credentials**
4. Kind: **Username with password**
5. ID: `docker-hub-credentials`
6. Username: Your Docker Hub username
7. Password: Your Docker Hub password
8. Save

### AWS Credentials

1. Add Credentials
2. Kind: **AWS Credentials**
3. ID: `aws-credentials`
4. Access Key ID: Your AWS access key
5. Secret Access Key: Your AWS secret key
6. Save

### EC2 SSH Key

1. Add Credentials
2. Kind: **SSH Username with private key**
3. ID: `ec2-ssh-key`
4. Username: `ubuntu`
5. Private Key: Paste your EC2 private key (.pem file contents)
6. Save

### JWT Secret

1. Add Credentials
2. Kind: **Secret text**
3. ID: `jwt-secret`
4. Secret: Your JWT secret key
5. Save

### EC2 Host

1. Add Credentials
2. Kind: **Secret text**
3. ID: `ec2-host`
4. Secret: Your EC2 public IP or domain
5. Save

## Step 5: Create Jenkins Pipeline Job

1. Click **New Item**
2. Enter name: `XProManage-Pipeline`
3. Select **Pipeline**
4. Click **OK**

### Configure Pipeline

#### General
- Description: `CI/CD Pipeline for XProManage`
- GitHub project: `https://github.com/yourusername/xpromanage`

#### Build Triggers
- Check **GitHub hook trigger for GITScm polling**

#### Pipeline
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/yourusername/xpromanage.git`
- Branch: `*/main`
- Script Path: `Jenkinsfile`

Save the configuration.

## Step 6: Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks**
3. Click **Add webhook**
4. Payload URL: `http://your-jenkins-server:8080/github-webhook/`
5. Content type: `application/json`
6. Select: **Just the push event**
7. Active: Check
8. Add webhook

## Step 7: Update Jenkinsfile

Make sure your Jenkinsfile has the correct values:

```groovy
environment {
    DOCKER_IMAGE_CLIENT = 'yourusername/xpromanage-client'
    DOCKER_IMAGE_SERVER = 'yourusername/xpromanage-server'
}
```

## Step 8: Test the Pipeline

### Manual Trigger

1. Go to your pipeline job
2. Click **Build Now**
3. Monitor the build progress in **Console Output**

### Automatic Trigger

1. Make a change to your code
2. Commit and push to GitHub
3. Jenkins should automatically trigger a build

## Step 9: Monitor Pipeline

### View Build Status

- Dashboard shows build status
- Click on build number to see details
- Check **Console Output** for logs

### Build Stages

The pipeline has the following stages:
1. **Checkout** - Clone repository
2. **Environment Setup** - Create .env files
3. **Install Dependencies** - Install npm packages
4. **Run Tests** - Execute tests
5. **Build Docker Images** - Create Docker images
6. **Push to Docker Hub** - Upload images
7. **Deploy to AWS EC2** - Deploy application
8. **Health Check** - Verify deployment

## Troubleshooting

### Build Fails at Docker Stage

```bash
# Give Jenkins user Docker permissions
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### SSH Connection Fails

```bash
# Test SSH connection manually
ssh -i your-key.pem ubuntu@your-ec2-ip

# Check SSH key in Jenkins credentials
# Ensure private key format is correct
```

### Docker Push Fails

```bash
# Verify Docker Hub credentials
# Check if repository exists on Docker Hub
# Ensure repository is public or credentials are correct
```

### Health Check Fails

```bash
# Check if application is running on EC2
ssh ubuntu@your-ec2-ip
docker-compose ps

# Check application logs
docker-compose logs
```

## Advanced Configuration

### Multi-Branch Pipeline

For feature branch deployments:

1. Create **Multibranch Pipeline** instead
2. Configure branch sources
3. Add different deployment strategies per branch

### Parallel Execution

Modify Jenkinsfile to run tests in parallel:

```groovy
stage('Tests') {
    parallel {
        stage('Backend Tests') {
            steps {
                // Backend tests
            }
        }
        stage('Frontend Tests') {
            steps {
                // Frontend tests
            }
        }
    }
}
```

### Email Notifications

Add to Jenkinsfile:

```groovy
post {
    success {
        emailext (
            subject: "Build Successful: ${env.JOB_NAME}",
            body: "Build ${env.BUILD_NUMBER} completed successfully.",
            to: "team@example.com"
        )
    }
    failure {
        emailext (
            subject: "Build Failed: ${env.JOB_NAME}",
            body: "Build ${env.BUILD_NUMBER} failed. Check console output.",
            to: "team@example.com"
        )
    }
}
```

### Slack Notifications

1. Install Slack Notification Plugin
2. Configure Slack in Jenkins
3. Add to Jenkinsfile:

```groovy
post {
    success {
        slackSend (
            color: 'good',
            message: "Build Successful: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
        )
    }
}
```

## Security Best Practices

1. **Use Jenkins behind reverse proxy** (Nginx)
2. **Enable HTTPS** with SSL certificate
3. **Restrict access** with authentication
4. **Use role-based access control**
5. **Keep Jenkins updated**
6. **Use credentials plugin** for secrets
7. **Enable CSRF protection**
8. **Regular backups** of Jenkins home directory

## Backup Jenkins

```bash
# Backup Jenkins home
sudo tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins/

# Restore
sudo tar -xzf jenkins-backup.tar.gz -C /
sudo systemctl restart jenkins
```

## Performance Optimization

1. **Increase Java heap size**:
   ```bash
   sudo nano /etc/default/jenkins
   # Add: JAVA_ARGS="-Xmx2048m"
   sudo systemctl restart jenkins
   ```

2. **Use build agents** for parallel builds
3. **Clean old builds** regularly
4. **Use Docker layer caching**
5. **Optimize Jenkinsfile** for faster builds

## Monitoring

### Install Monitoring Plugins

- Monitoring Plugin
- Build Monitor Plugin
- Dashboard View Plugin

### Set Up Alerts

Configure alerts for:
- Build failures
- Long-running builds
- Disk space issues
- Memory usage

## Resources

- Jenkins Documentation: https://www.jenkins.io/doc/
- Pipeline Syntax: https://www.jenkins.io/doc/book/pipeline/syntax/
- Best Practices: https://www.jenkins.io/doc/book/pipeline/pipeline-best-practices/
