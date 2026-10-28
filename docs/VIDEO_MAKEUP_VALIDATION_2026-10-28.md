# Supplied-video makeup validation — 2026-10-28

## Evidence handled

A 41-second, 1894×960, 30 FPS user-supplied screen recording was inspected locally. Twelve representative frames were sampled, including the initial live-camera look, product switching, open-mouth movement and the final three-layer look. No video frame or face crop was committed, uploaded to a remote service or retained as a product asset.

## Confirmed issue

The UI showed active lipstick, concealer and eyeliner layers, but the camera preview changed too little to communicate that makeup was applied. Ruby Woo/Interview pigment was especially weak on naturally dark lips, eyeliner was easily lost under glasses and camera contrast, and concealer was nearly imperceptible.

This was a rendering-strength problem, not a product-state failure: active layer chips and `Mirror ready` remained correct throughout the recording.

## Fix

- Added a bounded `source-over` pigment pass to both semantic-mask and landmark-fallback lipstick rendering.
- Increased color contribution while reducing whitening highlight and excessive darkening, preserving distinct matte/satin behavior.
- Increased eyeliner width, opacity and wing length within face-relative bounds so it remains visible in low-contrast webcam frames.
- Expanded the Beta concealer under-eye region and added a low-opacity coverage pass while retaining soft-light/color texture blends.
- Preserved intensity scaling; customers can still reduce every effect with the existing slider.

## Verification

- `pnpm test`: 55/55 passed.
- Production build passed.
- The supplied recording's camera region was cropped locally and exercised through Upload mode. Before/After confirmed the previous effect was too weak; after the fix, Ruby Woo was clearly visible on the same face while remaining bounded to the lips.
- Eyeliner became visible on both upper lids despite glasses. Concealer became visible under both eyes without a hard opaque patch.
- A desktop three-layer sample retained outward wings, bounded lipstick and texture-preserving concealer.

## Remaining physical check

The recording is evidence of the original defect and a still-frame regression check. A fresh live-camera run by the user is still required to confirm temporal stability, blink behavior, rapid head motion and the exact preferred strength on their device. No camera permission was requested by the automated validation.
