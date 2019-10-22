#!/usr/bin/env node
const fs = require('fs');
const {execSync} = require('child_process');

const [node, executable, pathToConfig] = process.argv;

if (pathToConfig === undefined) {
    console.error('No config file passed in');
    process.exit(1);
}

if (!fs.existsSync(pathToConfig)) {
    console.error(`Config file doesn't exist "${pathToConfig}"`);
    process.exit(1);
}

let config;

try {
    config = JSON.parse(fs.readFileSync(pathToConfig, 'utf8'));
} catch {
    console.error(`Mal-formatted config file "${pathToConfig}"`);
    process.exit(1);
}

const BUILD_STORAGE_PATH = '~/.deployment-builds';
const TMP_PATH = `/tmp/${config.projectName}_${Date.now()}`;

try {
    let sshCommandString = '';
    sshCommandString += `mkdir -p ${BUILD_STORAGE_PATH}`;
    sshCommandString += ` && git clone ${config.repo} ${TMP_PATH}`;
    sshCommandString += ` && cd ${TMP_PATH}`;
    sshCommandString += ` && GIT_COMMIT_HASH=$(git rev-parse HEAD)`;
    sshCommandString += ` && mkdir -p ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH`;
    sshCommandString += ` && mv ${TMP_PATH} ${BUILD_STORAGE_PATH}/${config.projectName}`;
    sshCommandString += ` && cd ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH`;
    sshCommandString += ` && cp .env.example .env`;

    if (config.hasOwnProperty('env')) {
        for (const env in config.env) {
            if (config.env.hasOwnProperty(env)) {
                const {from, to} = config.env[env];
                sshCommandString += ` && sed -i '' -e 's/${env}=local/${from}=${to}/g' .env`;
            }
        }
    }

    sshCommandString += ` && docker image prune -f`;
    sshCommandString += ` && docker network prune -f`;
    sshCommandString += ` && docker volume prune -f`;
    sshCommandString += ` && docker-compose -f ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH/docker-compose.prod.yml build --parallel`;
    sshCommandString += ` && docker-compose -f ${BUILD_STORAGE_PATH}/${config.projectName}/live/docker-compose.prod.yml down`;
    sshCommandString += ` && docker-compose -f ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH/docker-compose.prod.yml up -d`;
    sshCommandString += ` && ln -sf ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH ${config.projectName}/live`;

    if (config.hasOwnProperty('commands')) {
        sshCommandString += ` && ${config.commands}`;
    }

    execSync(`ssh -i ${config.ssh.key} ${config.ssh.user}@${config.ssh.ip} '${sshCommandString}'`, {stdio: 'inherit'});
} catch {
    // Ignore errors, since they are outputted to stdout
}
