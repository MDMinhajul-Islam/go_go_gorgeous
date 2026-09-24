# Go Go Gorgeous

Privacy-first, browser-based Virtual Beauty Mirror with simultaneous lipstick, eyeliner and an experimental concealer preview. Camera frames and uploaded photos are processed in memory on the customer's device and are not sent to an application server.

## Run locally

Requirements: Node.js 20+ and pnpm 9+.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm verify:assets
pnpm build
pnpm check:bundle
pnpm preview
```

Live camera access requires `https://` or `localhost`. The first Try-On launch downloads locally hosted model assets; the storefront bundle does not contain the CV runtime.

## Release scope

- Supported: both lipstick products and all shades.
- Supported: both eyeliner products and all shades.
- Beta: concealer. It is a visual approximation and is not a shade-matching claim.
- Sources: live camera, a memory-only uploaded image, or five sample models.
- Look stack: combine, disable, remove and clear multiple cosmetic layers without restarting the camera.
- Before/After: compare the same source frame with composition enabled or disabled.
- Bag: exact product/shade SKU, quantity, remove, persistence and reopening Try-On.
- Checkout is intentionally disabled until a real commerce provider is connected.

## Architecture

Catalog and SKU data live in `src/catalog`; the pure cart domain lives in `src/cart`. `main.jsx` owns the storefront and session UI. MediaPipe landmarks are loaded only when Try-On opens. Semantic face parsing is lazy-loaded behind `faceParserClient.js` and runs in a dedicated Web Worker using `faceParser.worker.js`; browsers without Worker/OffscreenCanvas support use an on-demand main-thread fallback.

```text
camera / upload / sample
        |
        +--> MediaPipe landmarks ------> canvas renderer
        |
        +--> ImageBitmap --> worker --> ONNX face parser --> semantic mask
                                                       |
catalog SKU + intensity -------------------------------+
```

Only catalog/cart state is persisted. Face frames, uploads, landmarks and masks are not persisted.

## Documentation

- [Architecture and limitations](docs/ARCHITECTURE.md)
- [Try-On pipeline](docs/TRY_ON_PIPELINE.md)
- [Rendering](docs/RENDERING.md)
- [Camera lifecycle](docs/CAMERA.md)
- [Privacy and threat model](docs/PRIVACY.md)
- [Security](docs/SECURITY.md)
- [Model and runtime inventory](docs/MODELS.md)
- [License audit](docs/LICENSE_AUDIT.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Performance](docs/PERFORMANCE.md)
- [Testing and browser support](docs/TESTING.md)
- [Device matrix](docs/DEVICE_MATRIX.md)
- [Deployment and release](docs/DEPLOYMENT.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Known release checks

Automated build and domain tests are necessary but not sufficient for camera software. Before a public release, complete the real-device matrix in `docs/TESTING.md`, obtain written rights/consent records for every sample-model image, and connect a real checkout provider or keep checkout visibly unavailable.
