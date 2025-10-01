// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const { withNativewind } = require("nativewind/metro");
const path = require("node:path");

const baseConfig = withNativewind(getDefaultConfig(__dirname));

const config = withTurborepoManagedCache(baseConfig);

config.resolver.unstable_enablePackageExports = true;

module.exports = config;

/**
 * Move the Metro cache to the `.cache/metro` folder.
 * If you have any environment variables, you can configure Turborepo to invalidate it when needed.
 *
 * @see https://turbo.build/repo/docs/reference/configuration#env
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withTurborepoManagedCache(_config) {
  _config.cacheStores = [
    new FileStore({ root: path.join(__dirname, ".cache/metro") }),
  ];

  return _config;
}
