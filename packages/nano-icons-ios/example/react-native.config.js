const path = require('path');
const pkg = require('../package.json');
const { configureProjects } = require('react-native-test-app');

module.exports = {
  project: configureProjects({
    ios: {
      sourceDir: 'ios',
      automaticPodsInstallation: true,
    },
  }),
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: {
        ios: {},
      },
    },
  },
};
