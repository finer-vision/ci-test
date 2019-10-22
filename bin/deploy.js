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
const TMP_NAME = `${config.projectName}_${Date.now()}`;
const MAX_VERSIONS = 5;

try {
    let sshCommandString = '';
    sshCommandString += `mkdir -p ${BUILD_STORAGE_PATH}`;
    sshCommandString += ` && mkdir -p ${BUILD_STORAGE_PATH}/${config.projectName}/${TMP_NAME}`;
    sshCommandString += ` && git clone ${config.repo} ${BUILD_STORAGE_PATH}/${config.projectName}/${TMP_NAME}`;
    sshCommandString += ` && cd ${BUILD_STORAGE_PATH}/${config.projectName}/${TMP_NAME}`;
    sshCommandString += ` && GIT_COMMIT_HASH=$(git rev-parse HEAD)`;
    sshCommandString += ` && OLD_GIT_COMMIT_HASHES=$(git rev-list HEAD --skip=${MAX_VERSIONS})`;
    sshCommandString += ` && rm -rf .git`;
    sshCommandString += ` && cp -r ${BUILD_STORAGE_PATH}/${config.projectName}/${TMP_NAME} ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH`;
    sshCommandString += ` && rm -rf ${BUILD_STORAGE_PATH}/${config.projectName}/${TMP_NAME}`;
    sshCommandString += ` && cd ${BUILD_STORAGE_PATH}/${config.projectName}`;
    sshCommandString += ` && rm -rf $OLD_GIT_COMMIT_HASHES`;
    sshCommandString += ` && cp ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH/.env.example ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH/.env`;

    if (config.hasOwnProperty('env')) {
        for (const env in config.env) {
            if (config.env.hasOwnProperty(env)) {
                const {from, to} = config.env[env];
                sshCommandString += ` && sed -i '' -e 's/${env}=${from}/${env}=${to}/g' ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH/.env`;
            }
        }
    }

    // @todo make this more generic. This will fail if there is no "app" image in the compose file.
    sshCommandString += ` && docker-compose -f ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH/docker-compose.prod.yml run app php artisan key:generate`;
    sshCommandString += ` && cp -n ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH/.env ${BUILD_STORAGE_PATH}/${config.projectName}/.env`;

    sshCommandString += ` && docker image prune -f`;
    sshCommandString += ` && docker network prune -f`;
    sshCommandString += ` && docker volume prune -f`;
    sshCommandString += ` && ln -sfn ${BUILD_STORAGE_PATH}/${config.projectName}/$GIT_COMMIT_HASH ${BUILD_STORAGE_PATH}/${config.projectName}/live`;
    sshCommandString += ` && cd ${BUILD_STORAGE_PATH}/${config.projectName}/live`;
    sshCommandString += ` && chown www-data:www-data -R ${config.writableDirectories.join(' ')}`;
    sshCommandString += ` && ln -sfn ${BUILD_STORAGE_PATH}/${config.projectName}/.env ${BUILD_STORAGE_PATH}/${config.projectName}/live/.env`;
    sshCommandString += ` && docker-compose -f ${BUILD_STORAGE_PATH}/${config.projectName}/live/docker-compose.prod.yml up --build -d`;

    if (config.hasOwnProperty('commands')) {
        sshCommandString += ` && ${config.commands}`;
    }

    execSync(`ssh -i ${config.ssh.key} ${config.ssh.user}@${config.ssh.ip} '${sshCommandString}'`, {stdio: 'inherit'});
} catch {
    // Ignore errors, since they are outputted to stdout
}
