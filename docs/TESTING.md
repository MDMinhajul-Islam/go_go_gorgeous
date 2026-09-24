# Testing and browser support

## Automated

```sh
pnpm test
pnpm build
```

Cart tests cover merging exact SKUs, preserving different shades, invalid persisted data and quantity removal. The production build is the bundle/lazy-loading gate.

## Required manual release matrix

| Browser | Sample model | Upload | Camera | Status |
|---|---:|---:|---:|---|
| Chrome desktop current | required | required | required | pending real-device QA |
| Edge desktop current | required | required | required | pending real-device QA |
| Chrome Android current | required | required | required | pending real-device QA |
| Safari macOS current | required | required | required | pending real-device QA |
| Safari iOS current | required | required | required | pending real-device QA |
| Firefox desktop current | required | required | required | pending real-device QA |

For each browser test permission deny/retry, no camera, low light, blink, smile, glasses, medium yaw, tab background/foreground, portrait/landscape rotation, repeated open/close, rapid mode/product switching and a 10-minute memory soak. Confirm the camera indicator disappears immediately on close.

Visual validation must use licensed/consented fixtures across a representative range of skin tones. Verify lipstick inner-mouth exclusion and eyeliner left/right wing direction. Camera behavior cannot be certified from a headless build alone.

