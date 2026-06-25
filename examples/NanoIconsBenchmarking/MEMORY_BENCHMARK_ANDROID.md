# Memory Benchmark (Android)

App: `com.nanoiconsbenchmarking`
Source: `adb shell dumpsys meminfo com.nanoiconsbenchmarking` (App Summary section).
Active icon set: `MaterialIconsTwotone` via `react-native-nano-icons`.
All values in **KB**.

| Library | Peak PSS | Java Heap | Native Heap | Graphics | Code |
|---|---|---|---|---|---|
| `react-native-nano-icons` | 60681 | 5200 | 9144 | 200 | 31400 |
| `HomeScreen` | 275888 | 24836 | 177916 | 1768 | 33244 |

> Note: the `HomeScreen` snapshot was taken after navigating away from `SVGIconsScreen`; its high Native Heap (~178 MB) reflects memory not yet released from that screen rather than HomeScreen's own footprint.

## Notes
- **Peak PSS** = `TOTAL PSS` from the `dumpsys meminfo` snapshot. This is the *current* PSS at measurement time, not a historical high-water mark.
- Peak RSS watermark from `/proc/<pid>/status`: `VmHWM` = 231044 KB (closest available true peak; RSS, not PSS).
- To capture a sampled peak over a run instead, use `adb shell dumpsys procstats com.nanoiconsbenchmarking`.

---

## RN Nano Icons

App: `com.nanoiconsbenchmarking`
Source: `adb shell dumpsys meminfo com.nanoiconsbenchmarking` (App Summary section).
Active icon set: `MaterialIconsTwotone` via `react-native-nano-icons`.
All values in **KB**.

| Library | Peak PSS | Java Heap | Native Heap | Graphics | Code |
|---|---|---|---|---|---|
| `react-native-nano-icons` | 151733 | 19252 | 59084 | 2992 | 34624 |

| Library | Peak PSS | Java Heap | Native Heap | Graphics | Code |
|---|---|---|---|---|---|
| `react-native-nano-icons-old` | 127426 | 13328 | 62292 | 220 | 32492 |


---

## Expo Vector Icons

App: `com.nanoiconsbenchmarking`
Source: `adb shell dumpsys meminfo com.nanoiconsbenchmarking` (App Summary section).
Screen: `ExpoVectorIconsScreen` via `@expo/vector-icons`.
All values in **KB**.

| Library | Peak PSS | Java Heap | Native Heap | Graphics | Code |
|---|---|---|---|---|---|
| `@expo/vector-icons` | 166397 | 24976 | 65968 | 3140 | 34956 |

---

## Expo Image

App: `com.nanoiconsbenchmarking`
Source: `adb shell dumpsys meminfo com.nanoiconsbenchmarking` (App Summary section).
Screen: `ExpoImageScreen` via `expo-image` (SVG).
All values in **KB**.

| Library | Peak PSS | Java Heap | Native Heap | Graphics | Code |
|---|---|---|---|---|---|
| `expo-image` | 164944 | 27048 | 79568 | 2744 | 33196 |

---

## SVG Icons

App: `com.nanoiconsbenchmarking`
Source: `adb shell dumpsys meminfo com.nanoiconsbenchmarking` (App Summary section).
Screen: `SVGIconsScreen` via `react-native-svg`.
All values in **KB**.

| Library | Peak PSS | Java Heap | Native Heap | Graphics | Code |
|---|---|---|---|---|---|
| `react-native-svg` | 281003 | 29860 | 178092 | 2856 | 34916 |

---

## Combined Summary (MB)

Post-rebuild snapshots, all measured under identical (rebuilt-release) conditions.
Values converted from KB to **MB** (÷1024). Sorted by Peak PSS, lowest first.
The stale pre-rebuild nano rows (`60681 KB` and the `-old` `127426 KB`) are excluded — they were measured before the rebuild and are not comparable.

| Library | Peak PSS | Java Heap | Native Heap | Graphics | Code |
|---|---|---|---|---|---|
| `react-native-nano-icons` | 148.2 | 18.8 | 57.7 | 2.9 | 33.8 |
| `expo-image` | 161.1 | 26.4 | 77.7 | 2.7 | 32.4 |
| `@expo/vector-icons` | 162.5 | 24.4 | 64.4 | 3.1 | 34.1 |
| `react-native-svg` | 274.4 | 29.2 | 173.9 | 2.8 | 34.1 |
