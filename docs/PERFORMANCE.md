# Performance

Baseline (2026-09-24): initial JS 175.89 KB / 57.08 KB gzip; MediaPipe 136.71 KB / 40.87 KB gzip; parser worker 406.81 KB; ONNX WASM 26.83 MB / 6.33 MB gzip; parser model 53.21 MB; landmarker model 3.76 MB.

Current multi-layer build: initial JS 184.09 KB / 59.87 KB gzip; MediaPipe 136.71 KB / 40.87 KB gzip; parser worker 406.81 KB; ONNX WASM and models unchanged. CI budgets initial JS at 225 KB and worker JS at 500 KB.

Capability-based quality tiers alter segmentation cadence: high about 5.5 FPS, medium about 3.1 FPS, low 2 FPS maximum. These are scheduling ceilings, not measured device throughput. Camera FPS, inference latency, memory and thermal behavior remain pending physical-device measurement; no invented values are reported.

Rendering v2 reuses named Canvas2D effect buffers instead of allocating a concealer canvas every frame. Semantic masks are versioned and reused until the next accepted segmentation result. The verified production bundle is 185.61 KiB initial JavaScript and 72.75 KiB face-parser worker JavaScript, within the existing 219.73 KiB and 488.28 KiB budgets. Compared with the latest local pre-v2 main build (182.08 KiB initial JavaScript), the rendering logic adds 3.53 KiB. Runtime FPS and memory effects remain pending physical-device profiling.

