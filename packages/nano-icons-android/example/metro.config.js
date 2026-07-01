const path = require('path');
const { makeMetroConfig } = require('@rnx-kit/metro-config');

module.exports = makeMetroConfig({
  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname, '..')],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
});
