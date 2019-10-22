#!/usr/bin/env bash

GIT_COMMIT_HASH=$(git rev-parse HEAD)

# Remove generated files
rm -rf public/build node_modules vendor

# Compress source to /tmp
tar -cvzf /tmp/"$GIT_COMMIT_HASH".tar.gz *

# Upload compressed source to server
scp -i ~/.ssh/KatieDeploymentKey

# Remove compressed source from /tmp
rm /tmp/"$GIT_COMMIT_HASH".tar.gz

# Un-compress source to location on server
mkdir -p ~/.deployment-builds
tar xf /tmp/"$GIT_COMMIT_HASH".tar.gz -C ~/.deployment-builds

# Remove old compressed source files on server
