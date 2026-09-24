# Agent guide

## Project at a glance

Go Go Gorgeous is a React + Vite, privacy-first virtual beauty mirror/storefront. Customers can preview lipstick and eyeliner (concealer is experimental) using a sample model, an uploaded image, or their live camera. Rendering and face analysis are client-side; camera frames, photos, landmarks, and masks must remain in browser memory. Checkout is intentionally unavailable until a real commerce provider is integrated.

Read `README.md` first for supported scope, then the relevant design notes under `docs/`. In particular: `ARCHITECTURE.md`, `TRY_ON_PIPELINE.md`, `PRIVACY.md`, `CAMERA.md`, `MODELS.md`, `TESTING.md`, and `cloudflare-deployment.md`.

## Main code map

- `src/main.jsx`, `src/styles.css`: storefront and session UI.
- `src/catalog/catalog.js`: product, shade, and SKU catalog.
- `src/cart/cart.js`: pure cart domain; cart identity is product ID + variant ID.
- `src/try-on/state/lookState.js`: category-keyed cosmetic layers and deterministic render order.
- `src/try-on/camera/cameraState.js`: camera lifecycle/error handling.
- `src/try-on/core/`: capabilities and image geometry helpers.
- `src/faceParserClient.js`, `src/faceParser.worker.js`, `src/faceParser.js`: lazy semantic face parsing; ONNX runs in a worker where available, with a slower fallback.
- `public/models/`: pinned MediaPipe and ONNX assets. `scripts/verify-assets.mjs` validates them.
- `functions/models/face-parsing-resnet18.onnx.js`: Pages Function that streams only the large ONNX model from this public repository's `main` branch. It forwards range/conditional headers and sets a one-hour browser cache. `public/_routes.json` limits Function routing to that model URL.
- `Dockerfile`, `docker-compose.yml`, `docker/nginx.conf`: container build and local Nginx hosting.
- `.github/workflows/ci.yml`: tests, asset verification, Vite build, bundle check, Docker image build, then optional Pages deploy on `main`.

## Local development and verification

Requirements: Node.js 20+ and pnpm 9+ (CI currently uses Node 22 and pnpm 11.19.0).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm verify:assets
pnpm build
pnpm check:bundle
docker compose up --build
```

The site is served at `http://localhost:8080` with Docker Compose. Live camera access requires HTTPS or localhost. Vite lazy-loads the computer-vision runtime after Try-On opens; do not casually import it into the storefront entry bundle. The ONNX WASM runtime is deliberately imported from `onnxruntime-web/wasm` to keep generated assets under the Pages per-file limit.

## Product and safety invariants

- Keep customer imagery and face-derived data local. Never add image/landmark/mask uploads, analytics payloads, or sensitive console logs without explicit privacy review and a documented user consent flow.
- Request camera access only after the user chooses live camera, and stop every track/worker/animation loop on close, source change, and teardown.
- Preserve exact product + shade SKU through cart persistence and Try-On reopening; sanitize persisted items against the live catalog.
- Keep the two lipstick and two eyeliner products/shades functional. Describe concealer as beta/approximate, not as accurate shade matching.
- Do not imply physical shade/finish accuracy. Sample model/image rights and consent must be documented before launch.
- Keep checkout visibly disabled until payment, order lifecycle, security, tax/shipping, and support flows are implemented and tested.

## Deployment and credentials

The intended hosting is Cloudflare Pages on its free `*.pages.dev` hostname; a custom domain is not required. The current model-delivery design intentionally avoids R2 and paid subscriptions: Pages serves the built app and its Function fetches the model from this public GitHub repo. That means the GitHub repo/model must stay public and reachable. Do not activate a Cloudflare billing subscription or add R2 as part of routine work.

GitHub Actions deploys only on `main` after CI passes, and only when repo Actions configuration exists:

- Secret `CLOUDFLARE_API_TOKEN` with Cloudflare Pages Edit only.
- Variable `CLOUDFLARE_ACCOUNT_ID`.

The Pages project name is `go-go-gorgeous`; direct Wrangler deploy should publish `https://go-go-gorgeous.pages.dev` and can auto-create the Pages project on first deploy. Until the secret and variable exist, deployment is intentionally not active; CI still runs. Never commit tokens or put them in `VITE_*` variables. Follow `docs/cloudflare-deployment.md` for setup.

## Change workflow

1. Inspect existing behavior and the related docs/tests before changing the renderer, camera lifecycle, catalog, or privacy boundary.
2. Make focused changes and add/update tests for pure logic, HTTP proxy behavior, and any new state transitions.
3. Run `pnpm test`, `pnpm verify:assets`, `pnpm build`, and `pnpm check:bundle`; build the Docker image when container/deployment behavior changes.
4. For camera/render changes, automated tests are not a substitute for the browser/device matrix in `docs/TESTING.md`. Mark unperformed real-device verification as pending.
5. Keep docs, lockfile, asset hashes, and deployment configuration in sync. Avoid broad rewrites of `src/main.jsx` or renderer code without visual-regression coverage.

