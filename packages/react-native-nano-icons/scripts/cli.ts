#!/usr/bin/env node
/**
 * Run from your app root: npx react-native-nano-icons [--verbose] [--path <dir>] [--expo-dynamic]
 *
 * Flags:
 *   --verbose          Show per-SVG processing details and pipeline timing
 *   --path <dir>       Directory containing .nanoicons.json (default: cwd)
 *   --expo-dynamic     Read config from Expo app config (app.json / app.config.js / app.config.ts)
 *                      and rebuild only icon sets with linking: 'dynamic'. Skips native linking —
 *                      use this for OTA font regeneration without running expo prebuild.
 */
import path from 'node:path';
import {
  createOraLogger,
  loadNanoIconsConfig,
  loadDynamicIconSets,
  buildAllFonts,
  linkBare,
} from '../cli/index.js';

async function main(): Promise<void> {
  const verbose = process.argv.includes('--verbose');
  const expoDynamic = process.argv.includes('--expo-dynamic');
  const level = verbose ? 'verbose' : 'normal';

  const pathIdx = process.argv.indexOf('--path');
  const projectRoot = process.cwd();
  const configRoot =
    pathIdx !== -1 && process.argv[pathIdx + 1]
      ? path.resolve(projectRoot, process.argv[pathIdx + 1]!)
      : projectRoot;

  const logger = await createOraLogger(level);

  if (expoDynamic) {
    logger.start('Reading dynamic icon sets from Expo app config...');
    const iconSets = loadDynamicIconSets(projectRoot);
    logger.succeed(
      `Found ${iconSets.length} dynamic icon set(s) — skipping native linking.`
    );
    await buildAllFonts(iconSets, projectRoot, { logger });
  } else {
    const config = loadNanoIconsConfig(configRoot);
    const built = await buildAllFonts(config.iconSets, projectRoot, { logger });
    await linkBare(projectRoot, built, logger);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
