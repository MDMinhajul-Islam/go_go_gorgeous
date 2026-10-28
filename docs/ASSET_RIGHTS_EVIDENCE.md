# Model and asset rights evidence — 2026-10-28

This is an engineering evidence inventory, not legal advice. Human legal/owner approval remains mandatory wherever the table does not say **VERIFIED**.

| Asset | Original source | Evidence / known terms | Commercial use and redistribution | Consent | Classification | Required action |
|---|---|---|---|---|---|---|
| `@mediapipe/tasks-vision` 0.10.35 | npm / `google-ai-edge/mediapipe` | npm and repository identify Apache-2.0 | Package code/WASM appears permitted with Apache notice; exact artifact notice completeness should be retained | N/A | VERIFIED for package license | Retain Apache-2.0 license and notices; continue pinned hash/version review |
| `face_landmarker.task` SHA-256 `64184E...BC9FF` | Google MediaPipe model path `face_landmarker/float16/1` | Google sample code identifies the versioned URL, but the open artifact-specific provenance request `google-ai-edge/mediapipe#6355` still asks for exact weight license, training provenance and redistribution evidence | No artifact-bound commercial/self-hosted grant was located for this exact Face Landmarker bundle | N/A | NEEDS LEGAL REVIEW | Obtain written Google/model terms or replace with a commercially cleared, documented model |
| `face-parsing-resnet18.onnx` SHA-256 `0D9BD3...27E33F` | `yakhyo/face-parsing` release `v0.0.1` | Repository code is MIT and the release ships ONNX weights; upstream says the weights were trained on CelebAMask-HQ | An MIT code license does not independently clear model weights or training-data restrictions | N/A | REPLACEMENT REQUIRED for commercial release unless counsel obtains a sufficient grant | Replace/retrain on commercially cleared data with a model BOM, or obtain written weight and dataset-derived-use approval |
| CelebAMask-HQ lineage | `switchablenorms/CelebAMask-HQ` | Upstream README restricts dataset/software to non-commercial research/education and prohibits commercial exploitation of images and derived data | Commercial-derived use is not cleared by the available evidence | Dataset subjects not documented here | REPLACEMENT REQUIRED | Legal review is mandatory; prefer a replacement parser trained on commercially cleared data |
| Five bundled sample-model PNGs and hero reuse | Repository history / `public/assets` | No source contract, license, release or model consent record was found | Unknown | Unknown | REPLACEMENT REQUIRED | Replace with owned/commissioned/synthetic assets carrying written commercial-use and likeness consent, or attach the missing records |
| Synthetic validation fixture | OpenAI built-in image generation; manifest in `tests/fixtures` | Fictional adult, prompt and checksum recorded; internal engineering purpose | Not approved here as a customer-facing/commercial sample | No real person; consent N/A | NEEDS LEGAL REVIEW | Keep internal until product/legal approves intended use and generator terms |
| Branded catalog names and product data | HUDA BEAUTY, MAC, e.l.f., MAYBELLINE, NYX, SHEGLAM | Names and product facts are hard-coded; product art is CSS-generated, not copied photography | Trademark, merchandising and accuracy permissions are not recorded | N/A | NEEDS OWNER CONSENT | Obtain brand/retailer authorization or replace with clearly fictional catalog data |
| React / React DOM 18.3.1 | npm | MIT | Redistribution permitted with notice | N/A | VERIFIED | Retain MIT notice |
| Lucide React 0.468.0 | npm | ISC | Redistribution permitted with notice | N/A | VERIFIED | Retain ISC notice |
| ONNX Runtime Web 1.27.0 | npm | MIT | Redistribution permitted with notice | N/A | VERIFIED | Retain MIT notice |
| Vite 6.4.3 and React plugin 4.7.0 | npm | MIT | Development/build tooling | N/A | VERIFIED | Retain development dependency records |
| Fonts | System font stacks | Runtime Google Fonts request removed on 2026-10-28 | No font files redistributed | N/A | VERIFIED | No action unless custom fonts are later added |

Primary evidence consulted:

- MediaPipe repository license: <https://github.com/google-ai-edge/mediapipe>
- MediaPipe official Face Landmarker sample/model URL: <https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/tasks/face-landmarker.ts>
- Open artifact-specific Face Landmarker provenance/license request: <https://github.com/google-ai-edge/mediapipe/issues/6355>
- Face parser repository and stated training lineage: <https://github.com/yakhyo/face-parsing>
- Face parser model releases: <https://github.com/yakhyo/face-parsing/releases>
- CelebAMask-HQ dataset agreement: <https://github.com/switchablenorms/CelebAMask-HQ/blob/master/README.md>

No model weight, photograph, likeness, trademark or training-data right is marked verified merely because adjacent source code is open source.
