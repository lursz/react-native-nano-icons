# Memory Benchmark - 1000 Icons (iOS)

## Test Scenario

Profiled with Xcode Profiler on Iphone 17 (base)
Flow: Home → 1k Icons → scroll to bottom → Home → 1k Icons again

---

## Results Summary

### Peak Memory
The maximum value of **Current Bytes** at any point during the recording, shown on the Instruments graph at the cursor position. It represents the total live memory in the process at that instant - heap allocations + anonymous VM regions combined. It is the ceiling of what the OS needs to hold in RAM to keep the app running.

### Persistent Heap
The subset of heap allocations (`malloc`, `new`, `CFCreate`, Objective-C `alloc`, etc.) that were created and **not yet freed** at the selected cursor time. Shown in the "Persistent" column of the Allocations statistics table. A large gap between persistent heap and peak memory means either (a) most allocations were short-lived and freed, or (b) significant memory lives in anonymous VM that is not counted as heap.

### Anonymous VM
Memory mapped into the process address space without a file backing it - not tracked by the heap allocations instrument. Common sources:
- Font data - CoreText mmap's `.ttf`/`.otf` files into anonymous pages (see expo-vector-icons: 307 MiB)
- Image decode buffers - IOSurface and GPU-accessible backing stores for decoded images
- JS engine memory - Hermes bytecode pages, GC heap, JIT output


| Library | Peak Memory | Persistent Heap | Anonymous VM | Freed on back-nav | Render lag |
|---|---|---|---|---|---|
| `react-native-svg` | **105.86 MiB** | 34.41 MiB | 53.84 MiB | partial | **yes** |
| `react-native-nano-icons` | **139.57 MiB** | 26.88 MiB | 55.16 MiB | yes (visible) | no |
| `expo-image` (SVG) | **165.09 MiB** | 39.02 MiB | 2.59 MiB | yes | no |
| `expo-vector-icons` | **343.78 MiB** | 36.94 MiB | 307.56 MiB | no | no |

---

## Per-Library Analysis

### `react-native-svg` - 105.86 MiB peak + noticeable render lag

- Top allocators: `RNSVGSvgView` (SVG root), `RNSVGPath` (path element), `RNSVGGroup` (element grouping), `VM: RNSVGSvgView (CALayer)` (compositing surface)
- Lowest peak of the four - path data stored as compact primitives, no decoded bitmaps
- **Noticeable delay between tapping the button and icons appearing** - each icon is a subtree of native views (`RNSVGSvgView > RNSVGGroup > RNSVGPath`), a typical icon consists of few paths thus producing many native view nodes - 1000 icons means few thousands of native view mutations committed in a single synchronous transaction on the main thread. This blocks the UI entirely untill the operation is finished
- Memory graph: smooth gradual rise, partial drop on back-nav - the JS object graph (React elements, Fabric shadow nodes, event handlers) keeps references alive past unmount. Deallocation waits for the non-deterministic JS GC, so memory lingers
- the react's tree clutter makes RNSVG a poor fit for screens with many icons. For occasional, large, complex SVGs it is a solid choice, but for icon sets it is vastly outperformed by the other libraries in speed

### `react-native-nano-icons` - 139.57 MiB peak

- Top allocators: `VM: NanoIconView (CALayer)` (52.56 MiB, compositing surface), `NanoIconView` (475 KiB, icon view)
- Single native view per icon - no view subtree, no JS shadow nodes retained per icon - the lowest persistent heap of all four libraries
- **Only library with a visible memory drop on back-navigation** - `NanoIconView` is a pure UIView subclass. ARC reference count hits zero the moment React Navigation pops the screen, immediately deallocating each view and its CALayer with no GC delay
- Memory graph: clean rise, step-down, rise again on second visit - true deallocation rather than GC deferral or caching. Also the second Icon list visit costs the same as the first, meaning no hidden accumulation across navigation cycles
- No render lag despite being the second-lightest in terms of peak memory

### `expo-image (SVG)` - 165.09 MiB peak

- Top allocators: `SVGPathCommand` (1.48 MiB, ~48k instances, path instruction), `SVGAttribute` (795 KiB, ~25k instances, element attribute), `CGPath` (301 KiB, resolved geometry) - roughly 48 SVG element attributes per icon parsed and retained on the heap
- expo-image does not parse SVGs itself - it hands each SVG file to Apple's ImageIO framework (the same pipeline used for PNG/JPEG decoding), which routes SVG files through CoreSVG (Apple's private SVG renderer). CoreSVG parses the XML and builds an internal representation, these objects stay alive in memory for as long as the view is live, because CoreSVG retains the parsed tree for potential re-rasterisation (e.g. on bounds change). This is fundamentally different from RNSVG, which maps SVG elements to React components — here there are no JS objects and no React tree at all, just a native image source fed into an image view. This is why Anonymous VM is low
- Memory graph: rises to ~165 MiB, then drops significantly on back-nav -memory is released when `ExpoImage` views deallocate on pop. Disk cache persists so re-fetching is avoided, but SVGs are re-rasterised on every visit (another 705 MiB+ will be churned through on the second visit)
- expo-image treats SVG icons as raster images - correct at every display resolution but expensive to re-render. Large rasterisation churn (705 MiB total VM) on every visit means it is not suited for icon-heavy screens that are navigated to frequently

### `expo-vector-icons` - 343.78 MiB peak

- First of all - is deprecated
- Top allocators: `VM: RCTParagraphTextVi...` (**307.56 MiB**, font memory), `RCTParagraphComponent` (875 KiB, text layout), `RCTParagraphTextView` (625 KiB, glyph view)
- Icons rendered as font glyphs via RN `<Text>` - the 307 MiB is font file data mmaped into anonymous VM by CoreText the first time any glyph from that family is requested. The full `.ttf`/`.otf` file is loaded regardless of how many distinct glyphs are actually used
- The 307 MiB is a fixed process-level cost, not a per-icon cost - using 1 Ionicons glyph or 10,000 costs the same anonymous VM
- Memory graph: flat baseline then **sharp vertical jump** - font loading is all-or-nothing - all 307 MiB lands in a single synchronous mmap when the first glyph is committed, which is why the graph has a step shape rather than a slope
- VM never freed - CoreText font cache is a process-level singleton; navigating away does not release it; this memory is charged to the app for its entire lifetime after the first icon is rendered
- The 307 MiB fixed cost is amortised across every icon render for the lifetime of the app - if an app uses Ionicons in dozens of screens, the per-use cost approaches zero. However, for icon-heavy screens this lib has the worst memory profile by far, and the unfreeable VM makes it unsuitable for memory-constrained devices
