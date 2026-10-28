# Rendering

Canvas2D remains the production renderer. It has zero additional startup dependency, broad mobile-browser support and currently meets the product's compositing needs. A GPU framework was not added without a benchmark.

Lipstick uses semantic upper/lower lip masks when available, explicitly protects the inner mouth, and falls back to even-odd landmark polygons. Face-relative feathering and combined `multiply`/`color` blending retain source luminance and texture. Matte uses stronger color absorption with minimal highlight; satin uses a softer color layer and masked highlight.

Eyeliner follows separate upper-lid curves with tapered segments, responds to blink openness, and creates eye-local wings whose length is attenuated by landmark depth differences. Concealer uses bounded rotated under-eye gradients drawn directly with texture-preserving blend modes; it avoids full-frame buffers and synchronous GPU readback and remains Beta.

Live semantic masks carry the landmark anchors from their inference frame. Results are discarded after incompatible motion, aligned within strict translation/rotation/scale bounds for small motion, and cleared when face tracking is lost.

The look engine supports simultaneous categories, deterministic layer order, per-layer intensity, enable/disable, removal and replacement. Future renderers should implement a common prepare/render/update/dispose contract before adding new categories.

See [the v2 audit and validation record](RENDERING_V2_AUDIT.md) for verified pre-change issues, implemented behavior and remaining manual tests.

See [the real-world validation report](REAL_WORLD_VALIDATION_2026-10-28.md) and [visual regression procedure](VISUAL_REGRESSION.md) for measured timings, evidence limits and the required physical matrix.

See [the supplied-video validation](VIDEO_MAKEUP_VALIDATION_2026-10-28.md) for the confirmed low-visibility defect and the bounded pigment/liner/concealer tuning applied from real webcam evidence.

