# Integration validation — 2026-10-28

## Decision

**NOT READY — BLOCKERS REMAIN.** The integrated branch is technically coherent and passes all automated, build, container and available desktop sample checks. It is not ready for a public or commercial production release until the release blockers below are closed.

## Integrated history

Branch: `integration/reliability-rendering-v2-2026-10-28`

- Base: `origin/main` at `5c90fcd`.
- Reliability PR tip: `d3db313`; all 14 original commits are ancestors of the integration tip.
- Rendering-v2 PR tip: `980e45d`; all 7 original commits are ancestors of the integration tip.
- Integration uses two non-squash merge commits. The branch was 23 commits ahead of `main` immediately after integration: 21 original commits plus 2 merge commits.
- The only merge conflict was `docs/TESTING.md`. It was resolved by retaining both the reliability coverage and rendering-v2 coverage. No source or test conflict required manual code selection.

## Automated and build evidence

| Check | Result |
|---|---|
| Frozen dependency install | Pass with pnpm 11.25.0 |
| `pnpm test` | Pass: 47/47 tests |
| `pnpm verify:assets` | Pass: both pinned model hashes verified |
| `pnpm build` | Pass: Vite 6.4.3 production build |
| `pnpm check:bundle` | Pass: 186.75 KiB initial JS / 219.73 KiB budget; 72.79 KiB worker / 488.28 KiB budget |
| Production dependency audit | Pass: 0 known vulnerabilities across 25 production dependencies |
| Docker build | Pass: `go-go-gorgeous:integration-2026-10-28`, 96,003,511 bytes |
| Container smoke | Pass: `/health` and `/` returned HTTP 200 |

The 47 tests jointly cover strict cart and persistence behavior, layer identity and deterministic ordering, camera error classification and fallback constraints, geometry and capability validation, adaptive quality selection, protected semantic-mask math, finish/geometry calculations, buffer reuse, segmentation versioning, landmark smoothing, stale-mask rejection, bounded alignment, and model-proxy methods/range/cache/failure behavior.

## Computer-vision and browser validation

Validation used the integrated production preview in current desktop Edge.

### Confirmed

- The bundled medium sample reached `Face parsing active`.
- Lipstick, eyeliner and Beta concealer coexisted in the same look without replacing one another.
- Before/After removed and restored all three layers as expected.
- The bundled deep-tone sample retained visible lipstick, outward eyeliner wings and under-eye concealer placement after source switching.
- The camera source first showed the in-app explanation and local-processing copy before requesting browser permission.
- After reaching `Waiting for camera permission`, switching back to Model returned to `Face parsing active`, exercising pending-session invalidation and source cleanup.
- A synthetic, fictional, AI-generated frontal portrait was created for rights-safe upload validation. It was not added to the repository or used as a product/sample asset.

### Not certified

- Browser camera permission was not approved through automation. Granted, denied, busy, absent-device and disconnected-device behavior still require manual device testing.
- The native Windows upload file picker could not be controlled with sufficient safety confidence, so end-to-end upload selection remains pending. File-type/12 MB validation and memory-only object-URL behavior were reviewed in source, but this is not a substitute for the browser path.
- Bundled sample images were used only as engineering evidence because their provenance and person/model consent are not documented.
- No real-device pose, expression, glasses, low-light, rotation, background/foreground or 10-minute session matrix was completed.

## Performance assessment

The integrated renderer retains reusable named buffers, versioned semantic masks, bounded segmentation refresh cadence, adaptive quality tiers and a lazy-loaded face-analysis path. The bundle budget remains below both limits and the initial storefront bundle does not absorb the computer-vision runtime.

Actual frame rate, segmentation latency, long-session memory growth and thermal behavior were not measured in this environment. Release targets therefore remain unverified: sustained 24–30 FPS on representative hardware, acceptable p95 inference latency for each tier, no unbounded allocations, and no sustained memory growth during the required 10-minute soak.

## Production-path checks

- `https://go-go-gorgeous.pages.dev/` returned HTTP 200 with CSP, camera-only Permissions Policy, referrer policy, MIME sniffing protection and frame denial.
- The live ONNX route returned HTTP 200 for HEAD with a 53,205,364-byte body length and HTTP 206 for `bytes=0-1023`, including the correct `Content-Range`.
- Repository configuration contains the required credential names `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; values were not read or printed.
- CI deploys only after the quality job and only for a push to `main`. Pull-request and integration-branch runs do not deploy.
- `main` currently has no GitHub branch protection. CI is therefore configured but not technically required before a direct merge or push.
- The intended production host is Cloudflare Pages. The Docker/Nginx image is a local/container fallback and does not currently reproduce the Pages `_headers` policy.

Rollback remains: redeploy the prior successful immutable Pages artifact/commit, confirm `/`, model HEAD/range behavior and security headers, then purge only HTML/model-path caches if required. Cart persistence is catalog-sanitized and tolerates removed SKUs.

## Release blockers

1. Confirm redistribution terms for the MediaPipe Face Landmarker bundle and a weight-specific grant for the face-parsing ONNX model, including its CelebAMask-HQ lineage review.
2. Obtain commercial-use and person/model consent records for all five bundled sample images, or replace them with cleared assets.
3. Authorize or replace branded cosmetic names/product data and retain complete third-party license texts.
4. Complete and sign off the physical browser/device matrix in `docs/TESTING.md`, including granted/denied camera, upload, pose/expression/glasses/lighting and repeated source switching.
5. Run the 10-minute memory soak and record FPS plus segmentation-latency evidence on representative low, medium and high tiers.
6. Complete assistive-technology checks and legal/product review of privacy, approximation and Beta concealer copy.
7. Protect `main` so the quality check is required and direct pushes cannot bypass review.
8. Keep checkout visibly unavailable until the documented commerce, order, security, tax/shipping and support work is implemented and tested.

## Post-merge production checklist

After the integration PR is approved and merged to `main`:

1. Confirm the required quality check is successful for the exact merge commit.
2. Confirm the Pages deploy job succeeds and records `https://go-go-gorgeous.pages.dev`.
3. Re-run root headers, model HEAD and 1 KiB range smoke checks.
4. Run the signed-off sample, upload and camera smoke matrix on the deployed origin.
5. Confirm camera tracks stop on close and source change, and confirm no customer imagery or face-derived data appears in network requests or logs.
6. Confirm checkout remains disabled and no unsupported shade-accuracy claim appears.
7. Retain the prior successful deployment identifier for immediate rollback.
