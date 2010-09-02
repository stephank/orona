#!/bin/sh

echo "Uncommitted AND unstaged files will be lost!"
echo "Press Ctrl+C to abort, or Enter to continue."
read dummy

set -e
set -x

git reset --hard
git clean -fdx
git rebase master

git checkout -b joyent-deploy
rm -f .gitignore deploy.sh
cake build
git add -A
git commit -m "Preparing for deployment on Joyent."
git push --force joyent joyent-deploy:master

git checkout joyent
git branch -D joyent-deploy
