import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /** Register a font for NanoIconView. `family` must match glyphMap.m.f (on iOS, the TTF's embedded name). */
  registerFont(family: string, uri: string): Promise<boolean>;
}

// `get` (not `getEnforcing`) so the absence of the native module (web, Expo Go,
// module not built) returns null and the caller can degrade gracefully.
export default TurboModuleRegistry.get<Spec>('NanoIconsFontLoader');
