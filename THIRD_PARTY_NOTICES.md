# Third-party notices

This inventory is an engineering review, not legal advice. Entries marked **Requires confirmation** block an unqualified commercial release.

| Component | Version/source | License | Purpose | Distribution | Status |
|---|---|---|---|---|---|
| React / React DOM | 18.3.1 npm | MIT | Store UI | Bundled | Cleared; retain notices |
| Vite / React plugin | 6.x / 4.x npm | MIT | Build tooling | Development only | Cleared |
| Lucide React | 0.468.0 npm | ISC | UI icons | Bundled | Cleared; retain notice |
| ONNX Runtime Web | 1.27.0 npm | MIT | Browser inference | Bundled with WASM | Cleared; retain notice |
| MediaPipe Tasks Vision | lockfile resolves 0.10.35 | Apache-2.0 | Face landmarks | JS/WASM redistributed locally | Cleared for package; retain Apache notice |
| MediaPipe Face Landmarker bundle | Google model path version 1; SHA-256 in `docs/MODELS.md` | Google-provided model terms require final confirmation | Face detection/mesh | Redistributed locally | **Requires confirmation** |
| `yakhyo/face-parsing` code | GitHub repository, MIT | MIT | BiSeNet/ResNet18 implementation lineage | Not directly copied beyond model contract | Cleared for repository code |
| Face-parsing ResNet18 ONNX weights | upstream release `v0.0.1` | Weight-specific grant not independently located | Semantic face masks | Redistributed locally | **Requires confirmation** |
| CelebAMask-HQ | upstream training-data lineage | Separate dataset terms | Training provenance only | Dataset not shipped | **Requires confirmation** |
| Google Fonts: DM Sans, Playfair Display | Google Fonts | OFL-1.1 per font metadata; verify bundled/version metadata | Typography | Loaded from Google at runtime | Requires privacy/deployment decision |
| Five sample-model images | repository assets; provenance not recorded | Unknown | Sample Try-On | Redistributed | **Must not ship commercially until cleared** |
| Third-party cosmetic brand names | HUDA BEAUTY, MAC, e.l.f., MAYBELLINE, NYX, SHEGLAM | Trademark/product-data rights are separate from software licensing | Demo catalog | Displayed in UI | **Requires authorization or replacement** |

No Three.js, PixiJS, Zustand, Zod or other proposed dependency was added. Canvas2D remains the renderer because no measured GPU spike has yet shown a better production trade-off.

Before commercial release, place complete license texts for every redistributed package/model in `licenses/`, record counsel/owner approval for model weights and images, and replace any uncleared branded demo data.

