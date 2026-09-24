# Deployment and release

## Hosting requirements

- HTTPS is mandatory outside localhost.
- Serve `.wasm` as `application/wasm` and `.task`/`.onnx` as `application/octet-stream`.
- Apply immutable caching to fingerprinted JS/CSS. Model URLs are currently stable paths; purge them deliberately when replacing files or add versioned filenames.
- Apply the policies in `public/_headers` or their platform equivalents.
- Do not enable COEP without verifying every font/image dependency; cross-origin isolation is not required by the present configuration.

## Smoke test

1. Load the storefront and confirm no CV model request occurs.
2. Open Try-On and verify all model/runtime requests use the application origin.
3. Try one lipstick and one eyeliner shade on a sample model.
4. Add each to the bag, change quantity, reload and reopen each exact shade.
5. Exercise upload and live camera over HTTPS; close Try-On and verify the camera stops.

## Release and rollback

Run tests and a production build, complete the device matrix, verify model hashes, review dependency advisories, validate sample-image rights and take a deployment snapshot. Deploy atomically. Roll back by restoring the prior immutable artifact and purging HTML/model-path caches; persistent cart data is schema-sanitized and tolerates removed SKUs.

