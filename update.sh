export DEEP_LOGGING='info'
cd ~/DeepModerator
git pull
yarn install
pm2 restart DeepModerator
