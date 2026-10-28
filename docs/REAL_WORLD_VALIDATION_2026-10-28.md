# Real-world CV validation and release readiness — 2026-10-28

## Decision

**NOT READY for public/commercial release.** Technically actionable renderer, diagnostics, accessibility, privacy-network and repository-protection work was completed. The remaining blockers require physical hardware/assistive-technology testing or human rights/consent/legal evidence and must not be inferred from automated checks.

Validation branch: `codex/real-world-cv-validation-2026-10-28`, based on `integration/reliability-rendering-v2-2026-10-28` at `f04b949`. The 14 reliability commits and 7 rendering-v2 commits remain ancestors; no history was squashed or rewritten. No merge to `main` and no production deployment occurred.

## A. Computer vision quality

### Executed

- Current desktop Edge, local Vite production preview, five bundled frontal sample images (internal engineering only; rights unresolved).
- Matte and satin lipstick were compared on the same medium sample. Satin retained a brighter, softer central highlight; matte retained stronger absorption with minimal highlight.
- Lipstick, eyeliner and Beta concealer were independently enabled and stacked. Eyeliner stayed on the upper lids with outward wings. Concealer stayed as soft under-eye gradients. Source skin texture remained visible.
- Before/After removed and restored the look without changing the source framing.
- Fair, light, medium, tan and deep bundled samples were exercised for lipstick and model switching.
- A fictional synthetic frontal fixture is stored at `tests/fixtures/synthetic-frontal-neutral.png`; provenance and checksum are test-verified.

### Confirmed fix

Concealer previously cleared/composited a 1600×900 buffer and copied it twice per redraw, plus synchronously read pixels back from the GPU. Measured concealer timing was 54.5 ms average / 82.4 ms p95 and the full stack was 45.6 / 50.6 ms. The renderer now draws four bounded under-eye gradient passes directly, with texture-preserving blend modes and no full-frame buffer/readback. Regression coverage confirms no concealer buffer allocation. Retest measured 0.2 / 0.3 ms for concealer and 0.5 / 0.7 ms for all three layers.

### Upload and live camera

- The browser controller opened the upload chooser, but file injection was blocked because its Edge extension was not allowed to read local file URLs. That privacy setting was not changed. Upload E2E is **BLOCKED**; the exact manual procedure is in `VISUAL_REGRESSION.md`.
- Camera permission was not requested or approved. There was no authorized camera/hardware path in this run. Granted/denied/busy/absent/disconnect, motion, expression, open-mouth, blink, tracking loss, multiple faces and shutdown are **BLOCKED** pending the physical matrix.
- Source review and automated tests still cover permission classification/fallback and teardown paths, but those are not substituted for physical evidence.

### Visual evidence limitations and residual risks

No pixel-annotated, rights-cleared makeup ground truth exists, so no IoU, boundary score or accuracy percentage is claimed. Browser screenshots were visually inspected during this run; the reproducible fixture and capture rubric are committed, while the bundled people remain internal-only evidence.

No additional rendering defect was claimed without sufficient evidence. The three highest residual rendering risks are:

1. Lipstick inner-mouth/teeth protection under open mouth and smile is not physically validated.
2. Eyeliner/concealer geometry under moderate yaw, blink and rapid motion is not physically validated; semantic-mask lag can only be assessed on live video.
3. Concealer gradients are intentionally Beta and not semantic skin-clipped after the performance fix; extreme pose/occlusion coverage is required to rule out lower-lid or background spill.

## B. Performance

Diagnostics are opt-in with `?diagnostics=1`, retain bounded timing/count samples only, and expose no images, landmarks or masks.

Static measurements used a 1600×900 canvas in current desktop Edge on this Windows host. Each warmed render result below uses repeated intensity changes in the same session; FPS is unavailable in static mode.

| Cosmetic condition | Render average | Render p95 | Preview FPS |
|---|---:|---:|---:|
| Disabled | 0.1 ms | 0.1 ms | unavailable (static) |
| Lipstick only | 8.0 ms | 8.0 ms | unavailable (static; one measured redraw) |
| Eyeliner only | 0.3 ms | 0.4 ms | unavailable (static) |
| Concealer only | 0.2 ms | 0.3 ms | unavailable (static) |
| All three | 0.5 ms | 0.7 ms | unavailable (static) |

The single final cold sample recorded MediaPipe at 2,210.8 ms and ONNX segmentation at 2,984.3 ms. A separate five-sample model-switch sequence recorded MediaPipe 718.2 ms average / 2,144.8 ms p95 and ONNX 6,374.3 / 10,920.8 ms while browser automation was active. These are static model-switch/warm-up measurements on one host, not camera throughput claims; the ONNX result is a release performance concern requiring representative-device confirmation.

Short-session JS heap readings stayed approximately 15.0–15.6 MiB. The final cold load produced one 2,260 ms long task associated with model warm-up. Static mask age grows after a completed parse and is not a valid live freshness metric. A ten-minute camera soak, sustained FPS, live inference distributions, thermal behavior and leak assessment are **BLOCKED** until a real camera is explicitly authorized.

## C. Security and privacy

- Images, frames, landmarks and masks remain browser-memory-only; diagnostics contain timings and counts only.
- Uploads are MIME/size checked (12 MiB) and object URLs are revoked on replacement/teardown.
- Camera access remains behind the in-app explanation and explicit user action; tracks, workers and animation frames are stopped in teardown paths.
- MediaPipe/ONNX assets are pinned and served same-origin. Integrity checks cover both large model artifacts.
- Runtime Google Fonts requests were removed; the app now uses system font fallbacks and does not add a third-party font connection.
- Checkout remains visibly disabled.
- `main` protection was applied: strict required `quality` check, one approving review, stale review dismissal, resolved conversations, admin enforcement, and force-push/deletion disabled.

## D. Accessibility

- Lighthouse accessibility improved from 86 to **100** on the production storefront. The machine-readable report is `docs/evidence/lighthouse-accessibility-2026-10-28.json`.
- Fixed: unnamed mobile menu close button, missing `main` landmark, and audited text contrast failures.
- Upload is exposed as a named keyboard button and opens on Enter/Space. The hidden file input is removed from the tab order.
- Manual Edge checks passed initial dialog focus, Shift+Tab/Tab focus wrapping, Escape support in code, focus restoration in code, named layer controls, visible focus and status/error semantics.
- Reduced motion is covered by CSS. Automated Lighthouse still lists logical tab order, focus traps, managed focus and custom controls as manual audits; NVDA, VoiceOver, TalkBack, forced-colors, 200–400% zoom/reflow and physical mobile target testing remain **NOT TESTED**.

## E. Licensing and consent

The full evidence table is `ASSET_RIGHTS_EVIDENCE.md`.

- **VERIFIED:** npm package licenses for React/React DOM (MIT), Lucide (ISC), ONNX Runtime Web (MIT), Vite/plugin (MIT) and MediaPipe package code (Apache-2.0), subject to retaining notices.
- **NEEDS LEGAL REVIEW:** the exact MediaPipe Face Landmarker task bundle lacks artifact-bound model/training/redistribution evidence in the located public record.
- **REPLACEMENT REQUIRED:** the face-parser weights state CelebAMask-HQ training lineage, whose upstream agreement is non-commercial; an adjacent MIT repository license does not clear commercial model-derived use.
- **REPLACEMENT REQUIRED:** five sample-model images/hero have no recorded source license or person/model consent.
- **NEEDS OWNER CONSENT:** branded product names/data require authorization or replacement with fictional catalog data.
- The synthetic fixture is fictional and traceable but remains internal pending product/legal approval.

## F. Release readiness

| Blocker | Status | Evidence / next action |
|---|---|---|
| Automated tests, asset hashes, build and bundle | RESOLVED | Final gate passes; see below |
| Concealer/full-stack render hotspot | RESOLVED | 54.5/82.4 ms to 0.2/0.3 ms; full stack 45.6/50.6 to 0.5/0.7 ms |
| Privacy-safe runtime diagnostics | RESOLVED | Opt-in timing/count-only panel and tested summaries |
| Storefront automated accessibility | RESOLVED | Lighthouse 100; report committed |
| Main branch protections | RESOLVED | GitHub API read-back confirms strict quality/review/force-delete controls |
| Upload end-to-end | BLOCKED | Native file access unavailable to automation; run committed manual procedure |
| Camera/device/10-minute soak | BLOCKED | No authorized physical camera; run committed matrix/protocol |
| Pose, expression, open-mouth and blink visual matrix | BLOCKED | Needs rights-cleared participants/fixtures and physical browsers |
| Assistive-technology/mobile manual checks | NOT TESTED | NVDA/VoiceOver/TalkBack, forced colors, zoom/reflow, touch targets |
| Face Landmarker model rights | PARTIALLY RESOLVED | Package license verified; exact model grant/provenance unresolved |
| Face-parser commercial rights | BLOCKED | Replace/retrain or obtain written weight/dataset-derived-use approval |
| Sample image rights/consent | BLOCKED | Replace or attach commercial license and person/model releases |
| Brand/catalog authorization | BLOCKED | Obtain owner authorization or fictionalize |
| Checkout | RESOLVED for current scope | Remains disabled; do not enable without full commerce implementation |

### Final local gate

- `pnpm install --frozen-lockfile`: pass
- `pnpm test`: pass, 55 tests
- `pnpm verify:assets`: pass
- `pnpm build`: pass
- `pnpm check:bundle`: pass; initial JS 192.36 KiB / 219.73 KiB, worker 72.79 KiB / 488.28 KiB
- `pnpm audit --prod`: pass, 0 known vulnerabilities
- Docker: not rerun because no container/deployment files changed

## Recommendation

Approve this validation branch for review into the integration branch, but **do not approve public/commercial release**. The technical fixes are covered and the repository is safer. Release remains gated on commercial model/photo/brand rights, the signed physical browser/camera matrix, the 10-minute live benchmark and manual assistive-technology checks.
