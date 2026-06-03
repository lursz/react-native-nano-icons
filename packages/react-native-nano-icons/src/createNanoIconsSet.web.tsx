import { memo, useMemo, type CSSProperties } from 'react';
import type { NanoGlyphMapInput, GlyphEntry } from './core/types';
import type { IconComponent, IconProps } from './types';
import { shallowEqualColor } from './utils/shallowEqualColor';

export type { IconComponent, IconProps };
export { shallowEqualColor };

const DEFAULT_ICON_SIZE = 12;

// Web renderer: uses inline <span> elements so icons flow out of the box (display: inline-block keeps width/height)
export function createIconSet<GM extends NanoGlyphMapInput>(
  glyphMap: GM
): IconComponent<GM> {
  const fontBasename = glyphMap.m.f;
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
      accessible,
      accessibilityLabel,
      accessibilityRole = 'image',
      accessibilityElementsHidden,
      testID,
      ref,
    }: IconProps<keyof GM['i']>) => {
      const [adv, layers] = resolveEntry(name);
      const width = (adv / unitsPerEm) * size;

      const colorArray = Array.isArray(color) ? color : [color];
      const lastPaletteColor = colorArray.length
        ? colorArray[colorArray.length - 1]
        : undefined;

      const containerStyle = useMemo<CSSProperties>(
        () => ({
          display: 'inline-block',
          position: 'relative',
          width,
          height: size,
          lineHeight: 0,
          verticalAlign: 'middle',
          ...(style as CSSProperties | undefined),
        }),
        [size, width, style]
      );

      const layerBaseStyle = useMemo<CSSProperties>(
        () => ({
          position: 'absolute',
          left: 0,
          bottom: 0,
          fontFamily: fontBasename,
          fontWeight: 'normal',
          fontStyle: 'normal',
          fontSize: size,
          lineHeight: 1,
          whiteSpace: 'pre',
        }),
        [size]
      );

      const role = accessibilityRole === 'image' ? 'img' : accessibilityRole;

      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          style={containerStyle}
          role={role}
          aria-label={accessibilityLabel ?? (name as string)}
          aria-hidden={accessibilityElementsHidden || undefined}
          data-testid={testID}
          {...(accessible === false ? { tabIndex: -1 } : null)}>
          {layers.map(([codepoint, srcColor], i) => {
            const layerColor =
              colorArray[i] ?? lastPaletteColor ?? srcColor ?? 'black';
            return (
              <span
                key={i}
                aria-hidden
                style={{ ...layerBaseStyle, color: layerColor as string }}>
                {getChar(codepoint)}
              </span>
            );
          })}
        </span>
      );
    },
    (prev, next) =>
      prev.name === next.name &&
      prev.size === next.size &&
      prev.style === next.style &&
      shallowEqualColor(prev.color, next.color)
  );

  Icon.displayName = `NanoIcon(${fontBasename})`;

  return Icon;
}
