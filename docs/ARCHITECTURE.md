# Architecture and limitations

## Decisions

1. **On-device inference.** No backend is required for Try-On. This reduces privacy exposure and avoids transmitting biometric-derived geometry.
2. **Lazy CV boundary.** MediaPipe, ONNX Runtime and models load after a Try-On action. The normal storefront bundle stays small.
3. **Worker face parsing.** ONNX preprocessing, inference and class argmax run away from the UI thread. One parsing request is allowed at a time, stale session results are rejected and live results are reused between inferences.
4. **Stable SKU identity.** Cart identity is `productId + variantId`; display names are not keys. Stored data is sanitized against the current catalog.
5. **Progressive fallback.** GPU landmark initialization retries on CPU. Semantic parsing can fail while landmark-only lipstick/eyeliner rendering continues. Browsers without Worker/OffscreenCanvas use a slower lazy fallback.
6. **No cross-origin isolation requirement.** The current deployment does not require COOP/COEP. ONNX Runtime uses a single WASM thread unless the page is already cross-origin isolated.

## Rendering limits

The experience is an appearance preview, not a guarantee of physical shade, finish, coverage or suitability. Display calibration, ambient light, camera white balance, occlusion, facial hair, glasses and pose affect results. Concealer remains beta because its current under-eye compositor has not passed a representative shade-accuracy study.

The face-parser input is a 512×512 aspect-preserving letterbox, RGB normalized with ImageNet mean `[0.485, 0.456, 0.406]` and standard deviation `[0.229, 0.224, 0.225]`. Output is a 19-class per-pixel logit tensor; the worker computes argmax labels and crops padding before masks are mapped back to the preview.

## Look composition

`src/try-on/state/lookState.js` owns a category-keyed layer model. Concealer, eyeliner and lipstick coexist, render in a deterministic order and retain independent SKU, shade, intensity and enabled state. Static sources reuse the same detected geometry and segmentation during shade changes.

## Remaining structural debt

`TryOn` remains larger than desired. A later refactor should extract the camera controller and category renderers into typed modules. This release deliberately avoids rewriting the user's existing renderer changes without a complete visual-regression fixture set.
