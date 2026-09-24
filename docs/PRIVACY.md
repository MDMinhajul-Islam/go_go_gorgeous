# Privacy and threat model

## Data handling

- Camera permission is requested only after the customer selects Live camera.
- Video frames, photos, landmarks and semantic masks stay in browser memory.
- Uploaded image object URLs are revoked when replaced or when Try-On closes.
- Camera tracks, animation frames, model sessions and parsing workers are stopped on teardown.
- Only product ID, shade/SKU ID and quantity are stored in local storage.
- The application performs face localization and segmentation, not identity recognition or matching.
- No analytics SDK is installed. Future telemetry must use an allowlist and must exclude images, landmarks, masks, filenames, device labels and persistent face/session identifiers.

## Threats and controls

| Threat | Control |
|---|---|
| Third-party runtime compromise | Version-pinned models and MediaPipe WASM are served from the application origin. |
| Malicious/huge upload | Image MIME validation and 12 MB limit; decoding remains browser-local. |
| Camera continues after close | Stream tracks are stopped during mode changes and component teardown. |
| Sensitive crash logs | Customer errors are generic; no image-derived data is logged. |
| XSS/exfiltration | Deployment headers restrict scripts, connections, frames and camera origin. |
| Stale persisted commerce data | Cart is sanitized against the current product and variant catalog. |

Before enabling monitoring, review every event field. Before public launch, publish a jurisdiction-appropriate privacy notice and retention statement reviewed by counsel.

