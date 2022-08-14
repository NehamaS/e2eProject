pipeline {
//    parameters(
//            string(name: 'MCU_HOME', defaultValue: 'monitor-dev.il-labs.mavenir.com' )
//    )
    agent {
        docker {
            //label 'jenkins-docker-slave'
            label 'mkmsh'
            image 'artifactory-il.intinfra.com/ngn-mcu-k8s-docker-eng/app-builder-ubuntu:1.0.0'
            args constructJenkinsSlaveContainerArgs()
        }
    }
    options {
        timestamps()
    }
    parameters {
        string(name: 'MCU_HOME', defaultValue: 'sipsvc-dev.il-labs.mavenir.com', description: 'mMCU address')
        choice(
                name: 'PLATFORM_TYPE',
                choices: ['K8S', 'SWARM'],
                description: 'Platform type (K8S/SWARM)'
        )
        string(name: 'TAGS', defaultValue: 'all', description: 'comma delimited string of scenario tags: sanity,audio,TMU-2222...')
        string(name: 'STREAM', defaultValue: 'TRUE', description: 'enable/disable stream')
        string(name: 'RANDOMIZE_MEETING_ID', defaultValue: 'TRUE', description: 'Add suffix to meeting id number')
        string(name: 'JOB_PARAMS', defaultValue: '', description: 'key:value pairs of all params for job in a single line (used by build system), if exists other params are ignored')
    }

    environment {
        APP_VERSION = constructVersion()
        APP_NAME = extractJobName()
        NODE_VERSION = "v12.10"
        MCU_NAMESPACE = "mvnr-mtcil1-appln-ngn-mcu"
        //MCfatal: clone of 'https://at.mavenir.com/bb/scm/cif/mcuU_PRIVATE_DOCKER_REGISTRY_ADDRESS = "artifactory.intinfra.com"
        MCU_PRIVATE_DOCKER_REGISTRY_ADDRESS = 'harbor.il-labs.mavenir.com'
        MCU_PRIVATE_DOCKER_REGISTRY_CURL = 'artifactory'
        MCU_PRIVATE_DOCKER_REGISTRY_CONTEXT = 'k8s-mcu'
        MCU_PRIVATE_HELM_REGISTRY_CONTEXT = 'ngn-mcu-k8s-helm-eng'
        CHARTMUSEUM = 'chartmuseum'
    }

    stages {
        stage("Prepare test env") {
            parallel {
                stage('Define job description') {
                    steps {
                        script{
                            JOB_CFG = updateJobMetaData(params)
                            //updateJobMetaData("${params.PLATFORM_TYPE}", "${params.MCU_HOME}", "${params.TAGS}")
                            echo "Job Configuration [debug]: ${JOB_CFG}"
                        }
                        echo "Job Configuration: ${JOB_CFG}"
                    }
                }
                stage('Docker pull macmesh') {
                    steps {
                        retry(3) {
                            sh """
                            docker pull harbor.il-labs.mavenir.com/mcu-dev/macmesh:01
                            """
                        }
                    }
                }
                 stage('Docker pull srmr') {
                     steps {
                           retry(3) {
                               sh """
                               docker pull harbor.il-labs.mavenir.com/mcu-dev/srmr:01
                               """
                          }
                      }
                  }
                stage('Npm Install') {
                    steps {
                        sh """
                            nodejs -v
                            npm -v
                            pwd
                            ls -ltr
                            npm set registry http://10.106.146.20:8081
                            # npm cache clean --force
                            npm install
                            # npm rebuild 
                            npm rebuild node-sass
                        """
                    }
                }
                stage('Create report dir') {
                    steps {
                        sh """
                            mkdir reports
                            mkdir -p /tmp/jest-cucumber-reporting/
                            """
                    }
                }

            }
        }
        stage('Run sanity') {
            steps {
                sh """
                   export NODE_TLS_REJECT_UNAUTHORIZED=0;RANDOMIZE_MEETING_ID=${JOB_CFG.RANDOMIZE_MEETING_ID};STREAM=${JOB_CFG.STREAM};MCU_HOME=${JOB_CFG.MCU_HOME};PLATFORM_TYPE=${JOB_CFG.PLATFORM_TYPE};TAGS=${JOB_CFG.TAGS} npm test
                   """
            }
        }

        stage("\u2460 setup \u2728") {
            steps {
                sh(script: 'whoami', returnStatus: true)
                sh(script: 'id', returnStatus: true)
                sh(script: 'echo Home folder is: [$HOME]', returnStatus: true)
                sh(script: 'echo Current folder is: [$PWD]', returnStatus: true)
                echo "Job base name: [${env.JOB_BASE_NAME}]"
                echo "Job name: [${env.JOB_NAME}]"
            }
        }
    }

    post {
        always {
            echo 'Generating test reports...'
            junit 'jreports/**/*.xml'
            publishHTML(target: [
                    allowMissing         : false,
                    alwaysLinkToLastBuild: false,
                    keepAll              : true,
                    reportDir            : 'reports',
                    reportFiles          : 'Mcu_Automation_Report.html',
                    reportName           : "mMCU Test Result"
            ])
        }
    }
}

// Define version using current date and current build number
def String constructVersion() {
    return "${java.time.LocalDate.now()}-${env.BUILD_NUMBER}"
}
// Extract the job name from the JOB_NAME env var
def String extractJobName() {
    return env.JOB_NAME.tokenize('/')[0]
}

def remoteHost() {
    def remote = [:]
    remote.name = 'ngpe72mgtb26`'
    remote.host = '10.107.203.10'
    remote.user = 'root'
    remote.password = 'Lcmanager'
    remote.allowAnyHosts = true
    return remote
}

def constructJenkinsSlaveContainerArgs() {
    node {
        echo "BUILD_TAG: ${env.BUILD_TAG}"
        return "-u root " +
                "--name jenkins-docker-slave-builder-" + env.BUILD_TAG.replaceAll("%2F", "-") + " " +
                "--network host " +
                "-v /var/run/docker.sock:/var/run/docker.sock " +
                "-v /usr/bin/docker:/usr/bin/docker " +
                "-v $HOME/.docker:/root/.docker " +
                "-v $HOME/.kube:/root/.kube " +
                "-v $HOME/.m2:/root/.m2"
    }
}

//def updateJobMetaData(platform, target, tags) {
def updateJobMetaData(params) {
    echo "Orig job params: ${params}"

    jobConfig = getJobParams(params)
    //echo "Job configuration: ${jobConfig}"

    envType = "K8S"
    if (jobConfig.PLATFORM_TYPE == 'SWARM') {
        envType = "SWARM"
    }
    echo "Setting job meta data: ${envType}, ${jobConfig.MCU_HOME}, ${jobConfig.TAGS}"
    currentBuild.description = "mMCU Certification: Platform -" + envType + ", Environment- " + jobConfig.MCU_HOME + ", Tags- " + jobConfig.TAGS
    currentBuild.displayName = "mMCU Automation " + envType + " : " + jobConfig.MCU_HOME
    echo "done"

    return jobConfig

}

/**
 * Extract JOB_PARAMS if exists, if not use default / provided values for specific params
 * @return
 */
def getJobParams(config) {
    //echo "Job config:, ${config}"
    jobParams = config.JOB_PARAMS
    // Split on , to get a List.
            .split(',')
    // Each item in hte list converted to map key/value.
            .collectEntries { entry ->
                echo "entry: ${entry}"
                def pair = entry.trim().split(':')
                [(pair.first()): pair.last()]
            }

    def result = [:]
    echo "New Job params: ${jobParams}"
    result.RANDOMIZE_MEETING_ID = "${jobParams.RANDOMIZE_MEETING_ID ? jobParams.RANDOMIZE_MEETING_ID : config.RANDOMIZE_MEETING_ID}"
    result.STREAM = "${jobParams.STREAM ? jobParams.STREAM : config.STREAM}"
    result.MCU_HOME = "${jobParams.MCU_HOME ? jobParams.MCU_HOME : config.MCU_HOME}"
    result.PLATFORM_TYPE = "${jobParams.PLATFORM_TYPE ? jobParams.PLATFORM_TYPE : config.PLATFORM_TYPE}"
    result.TAGS = "${jobParams.TAGS ? jobParams.TAGS : config.TAGS}"
    result.TAGS.replaceAll(";", ",")
    echo "New Job configuration: ${result}"

    return result
}
