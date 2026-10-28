# Visual regression procedure

This suite is intentionally evidence-based. It does not assign IoU, boundary F-score or shade-accuracy percentages because the repository has no rights-cleared, pixel-annotated makeup ground truth.

## Rights-safe fixture

`tests/fixtures/synthetic-frontal-neutral.png` is a fictional adult portrait generated for internal engineering validation. Its source, prompt and SHA-256 are recorded in `tests/fixtures/manifest.json` and verified by `tests/validationFixtures.test.js`. It is not a commercial product/sample asset; legal review is still required before broader use.

## Start the production build

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm preview --host 127.0.0.1
```

Open `http://127.0.0.1:4173/?diagnostics=1` in the browser under test. Use a clean profile, 100% browser zoom and a fixed viewport. Record browser version, OS, viewport, device pixel ratio and whether GPU acceleration is enabled.

## Upload procedure

1. Open Virtual Try-On and choose **Upload** using keyboard and pointer separately.
2. In the native picker select `tests/fixtures/synthetic-frontal-neutral.png`.
3. Confirm the UI reaches `Face parsing active`, the image remains correctly letterboxed and no image, landmark or mask request appears in the Network panel.
4. Repeat with a non-image file and an image larger than 12 MiB; confirm the alert explains the rejection.
5. Change source and close Try-On; confirm the object URL is revoked and no customer-derived data remains in storage.

The automated browser controller could open the native file chooser on 2026-10-28, but its extension was not permitted to read local file URLs. That browser privacy setting was not changed. Therefore this upload path is **BLOCKED**, not passed, in the current evidence report.

## Capture matrix

Capture PNGs with names `<browser>-<source>-<condition>-<state>.png` for every available source condition.

| Source condition | Required states |
|---|---|
| Frontal, neutral, even light | disabled, matte lipstick, satin lipstick, eyeliner, concealer, all, before/after |
| Skin-tone range | matte lipstick, satin lipstick, eyeliner, concealer, all |
| Moderate left/right yaw | eyeliner, concealer, all |
| Open mouth and smile | lipstick, all |
| Left/right blink | eyeliner, all |
| Low, side and warm/cool light | concealer, lipstick, all |

For the five bundled sample images, label captures **internal evaluation only — rights unresolved**. Do not publish or use them as commercial evidence until the asset-rights record is cleared.

## Evaluation rubric

- Lipstick: outer boundary follows the vermilion border; teeth and inner mouth remain unpainted; no color islands; natural texture remains visible.
- Finish: matte has stronger absorption and minimal highlight; satin retains a visibly softer highlight without whitening the lip.
- Eyeliner: both lines stay on the upper lid, taper inward and wing outward; closed eyes fade rather than jump.
- Concealer (Beta): both gradients remain under the eyes, follow eye angle, preserve skin texture and avoid hard edges.
- Temporal behavior: no visible mask lag, jumps, trails or stale makeup after source loss or material head motion.
- Before/After: source framing is identical and all cosmetic pixels are removed/restored.

Record each cell as PASS, FAIL, BLOCKED or NOT TESTED with a screenshot filename and one sentence of observation. A second reviewer must approve any subjective pass used for release.

## Live performance and 10-minute camera protocol

1. Open `?diagnostics=1`, expand **Local diagnostics**, then choose Live camera and explicitly approve the browser prompt.
2. For each condition—disabled, lipstick, eyeliner, concealer and all—hold the same pose and lighting for 30 seconds. Record Preview FPS, render average/p95, MediaPipe average/p95, ONNX average/p95, mask age average/p95, long-task count/duration and JS heap.
3. Run all three layers continuously for ten minutes. Record the same values at 0, 5 and 10 minutes, plus camera-track state and browser Task Manager memory.
4. During the soak perform moderate yaw, smile, open mouth, blink, temporary face loss, a second face, background/foreground, product switches and source switches.
5. Close Try-On and confirm the browser camera indicator disappears immediately and `MediaStreamTrack.readyState` becomes `ended`.

Do not compare data from different resolutions, quality tiers, browsers or lighting as if conditions were identical. Static sample mode does not produce Preview FPS, and its continually increasing mask age is not a live freshness measurement.
