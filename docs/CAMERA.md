# Camera lifecycle

Live camera uses explicit permission explanation and the states in `src/try-on/camera/cameraState.js`. Startup waits for media metadata rather than an arbitrary timeout. Every attempt receives a monotonically increasing session ID; late streams and inference results are rejected. Tracks stop on mode switch and component teardown. Track `ended` events surface device disconnection.

Currently implemented states include permission request, startup, model warmup, ready, no face, multiple faces, denied, unavailable, busy, unsupported, disconnected and stopped. Poor-light, distance and out-of-frame classification still require a calibrated face-quality heuristic and real-device validation.

Camera startup first requests the preferred front-facing 1280×720 constraints and retries once with the browser default camera only when the preferred constraints or device cannot be satisfied. Permission, security and busy-device failures never trigger a second permission request. Modern and legacy browser error names map to the same customer-facing states, while a missing media API is reported as unsupported.

