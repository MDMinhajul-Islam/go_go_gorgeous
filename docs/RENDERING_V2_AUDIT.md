# Realistic makeup rendering v2 audit

## Verified pre-change problems

- Lipstick semantic masks were flattened into a single cached color layer. Matte and satin finishes used the same parameters, highlights were not finish-aware, and the semantic path did not explicitly protect the inner-mouth class.
- Eyeliner used one constant-width stroke and a fixed screen-up wing. It faded during blinks, but did not taper along the lash line or derive the wing from an eye-local, perspective-adjusted basis.
- Concealer allocated a new 512×512 canvas on every rendered frame. Its fixed screen-axis ellipses did not follow eye rotation and fixed alpha did not respond to local illumination.
- Live segmentation results were rejected by camera session only. A slow result from the current session could still be applied after meaningful facial motion, and an accepted mask was not aligned to small landmark movement between inference frames.
- Semantic mask caching depended on manual clearing and did not include an explicit segmentation version.

## Implemented v2 behavior

- Lipstick combines luminance-preserving `multiply` and `color` compositing, adaptive face-relative feathering, explicit inner-mouth exclusion, landmark fallback with an even-odd mouth hole, and separate matte/satin opacity and highlight profiles.
- Eyeliner renders tapered lash-line segments, uses eye-local wing vectors, attenuates wing length for landmark depth differences, and suppresses rendering during a blink. Mirroring remains upstream, so both eye geometry and wings use the same mirrored landmark space.
- Concealer uses reusable target-sized buffers, rotated eye-relative gradients, local source-luminance sampling, skin-mask clipping, and low-alpha `soft-light`/`color` compositing to retain texture. It remains a Beta approximation.
- Segmentation requests capture a compact landmark anchor set. Results are accepted only when the current face remains compatible, accepted masks receive a bounded translation/rotation/scale alignment, and masks are cleared immediately when tracking is lost or multiple faces appear.
- Named effect buffers persist across frames, and semantic masks are cached only for the active segmentation version and mask parameters.

## Evidence and limits

Automated tests cover finish profiles, adaptive feathering, inner-mouth class protection, tapered/blink-aware eyeliner geometry, eye-relative concealer regions, illumination response, buffer reuse, versioned mask caching, landmark smoothing, stale-mask rejection, and bounded mask alignment.

Desktop Edge production-preview checks used the bundled medium and deep sample models. The same three-layer look was compared with Before/After, semantic parsing was confirmed active, both eyeliner wings pointed outward, lipstick remained visually bounded to the lips, and concealer remained under-eye. Matte and satin lipstick profiles were both inspected. These checks are engineering evidence only: the repository still lacks documented rights/consent records for the bundled sample images, so they are not release-grade visual-regression fixtures.

No live camera, uploaded customer image, mobile browser, moderate-yaw, smile, open-mouth, blink, occlusion, low-light, memory-soak, or physical-device performance test was performed in this sprint. No FPS, inference-latency, memory, or thermal improvement is claimed without those measurements.
