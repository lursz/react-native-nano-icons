# nano-icons-android

Pure-native Android library that renders nano icons the same way the React Native
package does: each icon is one (or more, for multicolor) TTF glyphs drawn directly
with `Canvas.drawText` — no view trees, no rasterized bitmaps, no XML inflation.

It consumes the exact artifacts produced by the `react-native-nano-icons` font
pipeline: a generated `<Family>.ttf` plus its `<Family>.glyphmap.json`.

## How it works

The font pipeline turns a folder of SVGs into an icon font. Each icon becomes a
glyph at a private-use codepoint; multicolor icons become several stacked glyphs,
one per color layer. The glyph map records, per icon, its advance width and its
layers (`codepoint` + default color).

At runtime this library:

1. Loads the TTF (`Typeface.createFromAsset`) and parses the glyph map — once per
   font family, cached (`NanoIconSet.fromAssets`).
2. Draws an icon by painting its layer glyphs at the same baseline position in
   painter's order (`NanoIconDrawable` / `NanoIconView`).

## Usage

Put `MyIcons.ttf` and `MyIcons.glyphmap.json` (from the nano-icons CLI) under
`src/main/assets/nanoicons/`, then:

```kotlin
val icons = NanoIconSet.fromAssets(context, "MyIcons")

// as a standalone view
val view = NanoIconView(context).apply {
    iconSizePx = 24 * resources.displayMetrics.density
    color = Color.RED          // null = per-layer default colors (multicolor)
    setIcon(icons, "Bell")
}

// or anywhere a Drawable fits (ImageView, compound drawables, menus)
imageView.setImageDrawable(NanoIconDrawable(icons, "Bell", sizePx = 72f))
```

## Example & benchmark app

`example/` is a plain Android app (no dependencies beyond the library) with:

- **Gallery** — visual A/B of the same SVG set rendered as Nano glyphs vs
  `VectorDrawable`, plus multicolor and size samples.
- **Benchmark** — renders a grid of 500/2000 icons with `NanoIconView` vs
  `ImageView` + `VectorDrawable` and reports the time from populate to the end
  of the next drawn frame.

```sh
./gradlew :example:installDebug
```

## Regenerating fonts

The SVG→TTF pipeline lives in `packages/react-native-nano-icons` (see its
`cli/`). Point its config at your SVG folder and copy the emitted `.ttf` +
`.glyphmap.json` into your app's assets.
