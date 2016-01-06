#!/bin/bash -e
if [ "$TRAVIS_BRANCH" == "master" ]; then
  echo "Building image with tag latest"
  docker build -t camptocamp/puppet-catalog-diff-viewer:latest .
elif [ ! -z "$TRAVIS_TAG" ] && [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
  echo "Building image with tag ${TRAVIS_TAG}"
  docker build -t camptocamp/puppet-catalog-diff-viewer:$TRAVIS_TAG .
elif [ ! -z "$TRAVIS_BRANCH" ] && [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
  echo "Building image with tag ${TRAVIS_BRANCH}"
  docker build -t camptocamp/puppet-catalog-diff-viewer:$TRAVIS_BRANCH .
else
  echo "Don't know how to build image"
  exit 1
fi
