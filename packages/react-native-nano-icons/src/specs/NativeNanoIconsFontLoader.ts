import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Register a font file so the OS resolves it by `family` name (the same name
   * the NanoIconView resolves against). `uri` may be a local file path / file://
   * URL, or an http(s) URL (e.g. a Metro dev asset). Resolves `true` on success.
   *
   * Note: caching/versioning of remote fonts is intentionally out of scope — the
   * module just reads the bytes at `uri` and registers them.
   */
  registerFont(family: string, uri: string): Promise<boolean>;
}

// `get` (not `getEnforcing`) so the absence of the native module (web, Expo Go,
// module not built) returns null and the caller can degrade gracefully.
export default TurboModuleRegistry.get<Spec>('NanoIconsFontLoader');
