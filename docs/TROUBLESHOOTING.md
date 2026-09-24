# Troubleshooting

- **Camera unavailable:** verify HTTPS/localhost, OS/browser permission and that another app is not using the camera. Retry or use Upload/Model.
- **Model load failure:** verify `/models/mediapipe/` and the ONNX model return 200 with correct MIME types; run `pnpm verify:assets`.
- **Landmark fallback:** semantic parsing failed but landmark lipstick/eyeliner may continue. Inspect worker loading and WASM MIME/CSP.
- **Stale preview:** change source mode once and inspect console errors in development; session/request guards should reject old results.
- **Build budget failure:** inspect `dist/assets`; keep CV code lazy and do not move ONNX imports into the storefront entry.
