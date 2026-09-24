# Try-On pipeline

1. Customer selects Model, Upload or Live Camera.
2. MediaPipe detects up to two faces. Makeup pauses when multiple faces are present.
3. Adaptive landmark smoothing follows motion velocity.
4. A transferable `ImageBitmap` enters the face-parser worker under one-request backpressure.
5. ONNX parsing produces semantic labels; stale camera-session and static-image results are rejected.
6. The active look is ordered as concealer → eyeliner → lipstick.
7. Each enabled renderer composites from the same source frame and geometry.
8. Before/After disables composition without changing the underlying frame.

Static model/photo geometry and masks are reused during product, shade and intensity changes, preventing unnecessary inference.

