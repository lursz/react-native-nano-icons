import { memo, useMemo } from 'react';
import { PixelRatio, Platform, Text, View, type TextProps } from 'react-native';
import type { NanoGlyphMapInput } from './core/types';
import type { IconComponent, IconProps } from './types';
import { shallowEqualColor } from './utils/shallowEqualColor';
import {
  DEFAULT_ICON_SIZE,
  resolveGlyphEntry,
  createCharCache,
  createLayerColorResolver,
} from './utils/glyphRuntime';

export type { IconComponent, IconProps };
export { shallowEqualColor };

/**
 * JS implementation using <View> + <Text> layers.
 * Used on web and as a fallback when native component is unavailable (e.g. Expo Go).
 */
export function createJSIconSet<GM extends NanoGlyphMapInput>(
  glyphMap: GM
): IconComponent<GM> {
  const fontBasename = glyphMap.m.f;

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
  const getChar = createCharCache();

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
      const [adv, layers] = resolveGlyphEntry(glyphMap, name);
      const scaledSize = size * fontScale;
      const width = (adv / unitsPerEm) * scaledSize;

      const resolveColor = createLayerColorResolver(color);

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
            const layerColor = resolveColor(i, srcColor);

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
