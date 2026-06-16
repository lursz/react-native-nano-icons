import { useSyncExternalStore } from 'react';
import { Image, Platform } from 'react-native';
import NanoIconsFontLoader from './specs/NativeNanoIconsFontLoader';

/**
 * Runtime registration of dynamically-linked (`l:"d"`) fonts.
 *
 * A dynamic font is deliberately NOT bundled into the native binary, so something
 * has to register it under its family name at runtime before icons can render.
 * This module does that without any third-party dependency:
 *  - native: via the NanoIconsFontLoader TurboModule (Typeface / CTFontManager)
 *  - web:    via the browser FontFace API
 *
 * State is tracked per family so the icon component can hide until the font is
 * ready (avoiding a tofu flash) and so repeated createNanoIconSet calls dedupe.
 */

type FontStatus = 'loading' | 'ready' | 'error';

const statusByFamily = new Map<string, FontStatus>();
const inFlight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function setStatus(family: string, status: FontStatus): void {
  statusByFamily.set(family, status);
  emit();
}

export function getFontStatus(family: string): FontStatus | undefined {
  return statusByFamily.get(family);
}

/** A font source: a require()'d module, an { uri }, or a path/uri string. */
export type FontSource = number | string | { uri: string };

export function resolveFontUri(font: unknown): string {
  if (typeof font === 'number') {
    const source = Image.resolveAssetSource(font);
    if (!source?.uri) {
      throw new Error(
        '[react-native-nano-icons] Could not resolve the font asset to a uri.'
      );
    }
    return source.uri;
  }
  if (typeof font === 'string') return font;
  if (
    font != null &&
    typeof font === 'object' &&
    typeof (font as { uri?: unknown }).uri === 'string'
  ) {
    return (font as { uri: string }).uri;
  }
  throw new Error(
    '[react-native-nano-icons] Unsupported font source. Pass require("Foo.ttf"), { uri }, or a path string.'
  );
}

async function register(family: string, uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Browser FontFace API. Typed loosely so this compiles under both the RN-only
    // lib config and a DOM-aware app config without depending on the DOM lib.
    const g = globalThis as unknown as {
      FontFace?: new (
        family: string,
        source: string
      ) => {
        load(): Promise<unknown>;
      };
      document?: { fonts?: { add(face: unknown): void } };
    };
    if (!g.FontFace || !g.document?.fonts) {
      throw new Error(
        '[react-native-nano-icons] FontFace API unavailable; cannot load dynamic font on this platform.'
      );
    }
    const face = new g.FontFace(family, `url(${uri})`);
    await face.load();
    g.document.fonts.add(face);
    return;
  }

  if (!NanoIconsFontLoader) {
    throw new Error(
      '[react-native-nano-icons] Native font loader is unavailable (Expo Go or module not built). ' +
        'Load the font yourself, or use a development/production build.'
    );
  }
  await NanoIconsFontLoader.registerFont(family, uri);
}

/**
 * Register `font` under `family`, once. Concurrent / repeated calls for the same
 * family return the same in-flight promise. Resolves when the font is registered.
 */
export function loadDynamicFont(family: string, font: unknown): Promise<void> {
  const existing = inFlight.get(family);
  if (existing) return existing;

  setStatus(family, 'loading');

  const run = (async () => {
    const uri = resolveFontUri(font);
    await register(family, uri);
  })();

  const tracked = run.then(
    () => setStatus(family, 'ready'),
    (err) => {
      setStatus(family, 'error');
      throw err;
    }
  );

  // Store a non-throwing promise so dedupe never produces unhandled rejections.
  inFlight.set(
    family,
    tracked.catch(() => undefined)
  );
  return tracked;
}

/**
 * Subscribe a component to a family's load state. Returns `true` while a managed
 * font is still loading (so the icon should hide), `false` otherwise (ready,
 * errored, or not managed by us).
 */
export function useDynamicFontPending(
  managed: boolean,
  family: string
): boolean {
  const status = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (managed ? statusByFamily.get(family) : undefined),
    () => undefined
  );
  return managed && status === 'loading';
}

/** Test-only: reset module state between tests. */
export function __resetDynamicFontsForTests(): void {
  statusByFamily.clear();
  inFlight.clear();
  listeners.clear();
}
