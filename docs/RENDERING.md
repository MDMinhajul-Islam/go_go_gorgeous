# Rendering

Canvas2D remains the production renderer. It has zero additional startup dependency, broad mobile-browser support and currently meets the product's compositing needs. A GPU framework was not added without a benchmark.

Lipstick uses semantic upper/lower lip masks when available and landmark polygons as fallback, preserving the inner mouth. Eyeliner follows separate upper-lid curves, responds to blink openness and creates eye-relative wings. Concealer uses clipped under-eye gradients and remains Beta.

The look engine supports simultaneous categories, deterministic layer order, per-layer intensity, enable/disable, removal and replacement. Future renderers should implement a common prepare/render/update/dispose contract before adding new categories.

