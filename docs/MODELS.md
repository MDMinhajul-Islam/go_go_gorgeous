# Model and runtime inventory

| Asset | Version/source | Purpose | SHA-256 / license |
|---|---|---|---|
| MediaPipe Tasks Vision | npm `0.10.35` | Face landmarks | Apache-2.0 |
| `face_landmarker.task` | Google MediaPipe float16 bundle, version path `1` | Face detection and mesh | `64184E229B263107BC2B804C6625DB1341FF2BB731874B0BCC2FE6544E0BC9FF`; confirm model redistribution terms before commercial launch |
| `face-parsing-resnet18.onnx` | `yakhyo/face-parsing`, release `v0.0.1` | 19-class facial segmentation | `0D9BD318E46987C3BDBFACAE9E2C0F461CAE1C6AC6EA6D43BBE541A91727E33F`; MIT repository license |
| ONNX Runtime Web | npm `1.27.0` | Browser ONNX inference | MIT |

The face parser is reported by its upstream project as trained on CelebAMask-HQ. That dataset/model lineage can contain demographic or capture-condition bias. Validate false boundaries and quality across skin tones, ages, facial hair, makeup states, lighting, pose and camera quality before expanding claims.

Runtime files are served from `/models/mediapipe/` and `/models/face-parsing-resnet18.onnx`; customer runtime does not fetch them from Google or jsDelivr.

