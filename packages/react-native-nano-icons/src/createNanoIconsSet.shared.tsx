import { memo, useMemo } from 'react';
import { PixelRatio, Platform, Text, View, type TextProps } from 'react-native';
import type { NanoGlyphMapInput, GlyphEntry } from './core/types';
import type { IconComponent, IconProps } from './types';
import { shallowEqualColor } from './utils/shallowEqualColor';

export type { IconComponent, IconProps };
export { shallowEqualColor };

const DEFAULT_ICON_SIZE = 12;

/**
 * Warn when the `font` argument and the glyphmap's linking mode are inconsistent.
 *
 * - Dynamic glyphmap without a `font` arg: caller probably forgot to pass it; icons
 *   will render as tofu until the host app loads a font under family `fontFamily`.
 * - Static glyphmap with a `font` arg: argument is ignored, font is bundled natively.
 *
 * Fires once per `createIconSet` call (not per render).
 */
export function warnIfLinkingMismatch(
  fontFamily: string,
  linking: 's' | 'd' | undefined,
  font: unknown
): void {
  const isDynamic = linking === 'd';
  if (isDynamic && font == null) {
    console.warn(
      `[react-native-nano-icons] "${fontFamily}" is built with dynamic linking ` +
        `but no font was passed to createIconSet. Icons will render as tofu ` +
        `until a font is loaded and registered under family "${fontFamily}".`
    );
    return;
  }
  if (!isDynamic && font != null) {
    console.warn(
      `[react-native-nano-icons] "${fontFamily}" is built with static linking; ` +
        `the font argument passed to createIconSet is ignored. ` +
        `Set linking: 'dynamic' in your config to opt into OTA delivery.`
    );
  }
}

/**
 * JS implementation using <View> + <Text> layers.
 * Used on web and as a fallback when native component is unavailable (e.g. Expo Go).
 */
export function createJSIconSet<GM extends NanoGlyphMapInput>(
  glyphMap: GM
): IconComponent<GM>;
export function createJSIconSet<GM extends NanoGlyphMapInput>(
  glyphMap: GM,
  font: unknown
): IconComponent<GM>;
export function createJSIconSet<GM extends NanoGlyphMapInput>(
  glyphMap: GM,
  font?: unknown
): IconComponent<GM> {
  const fontBasename = glyphMap.m.f;
  warnIfLinkingMismatch(fontBasename, glyphMap.m.l, font);

  const fontReference = Platform.select({
    windows: `/Assets/${fontBasename}`,
    default: fontBasename,
  });

  const styleOverrides: TextProps['style'] = {
    fontFamily: fontReference,
    fontWeight: 'normal',
    fontStyle: 'normal',
    position: 'absolute',
    includeFontPadding: false,
    bottom: 0,
  };

  const unitsPerEm = glyphMap.m.u;

  const resolveEntry = (name: keyof GM['i']): GlyphEntry => {
    return (glyphMap.i[name as string] ?? [
      unitsPerEm,
      [[63, 'black']],
    ]) as GlyphEntry;
  };

  const codepointCache = new Map<number, string>();
  const getChar = (codepoint: number): string => {
    let ch = codepointCache.get(codepoint);
    if (ch === undefined) {
      ch = String.fromCodePoint(codepoint);
      codepointCache.set(codepoint, ch);
    }
    return ch;
  };

  const Icon = memo(
    ({
      name,
      size = DEFAULT_ICON_SIZE,
      color,
      style,
      allowFontScaling = true,
      accessible,
      accessibilityLabel,
      accessibilityRole = 'image',
      accessibilityElementsHidden,
      importantForAccessibility,
      testID,
      ref,
    }: IconProps<keyof GM['i']>) => {
      const fontScale = allowFontScaling ? PixelRatio.getFontScale() : 1;
      const [adv, layers] = resolveEntry(name);
      const scaledSize = size * fontScale;
      const width = (adv / unitsPerEm) * scaledSize;

      const colorArray = Array.isArray(color) ? color : [color];
      const lastPaletteColor = colorArray?.length
        ? colorArray[colorArray.length - 1]
        : undefined;

      const containerStyle = useMemo(
        () => [{ height: scaledSize, width, bottom: 0 as const }, style],
        [scaledSize, width, style]
      );

      const sizeStyle = useMemo(() => ({ fontSize: size }), [size]);

      return (
        <View
          ref={ref}
          style={containerStyle}
          accessible={accessible}
          accessibilityRole={accessibilityRole}
          accessibilityLabel={accessibilityLabel ?? (name as string)}
          accessibilityElementsHidden={accessibilityElementsHidden}
          importantForAccessibility={importantForAccessibility}
          testID={testID}>
          {layers.map(([codepoint, srcColor], i) => {
            const layerColor =
              colorArray?.[i] ?? lastPaletteColor ?? srcColor ?? 'black';

            return (
              <Text
                key={i}
                selectable={false}
                accessible={false}
                allowFontScaling={allowFontScaling}
                style={[styleOverrides, sizeStyle, { color: layerColor }]}>
                {getChar(codepoint)}
              </Text>
            );
          })}
        </View>
      );
    },
    (prev, next) =>
      prev.name === next.name &&
      prev.size === next.size &&
      prev.allowFontScaling === next.allowFontScaling &&
      prev.style === next.style &&
      shallowEqualColor(prev.color, next.color)
  );

  Icon.displayName = `NanoIcon(${fontBasename})`;

  return Icon;
}
