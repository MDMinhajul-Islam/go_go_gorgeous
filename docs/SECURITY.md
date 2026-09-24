# Security

The threat model prioritizes face-data exfiltration, supply-chain replacement, malicious uploads, stale async work and camera leaks. Controls include same-origin model delivery, SHA-256 verification, CSP/Permissions Policy, local-only inference, input size/type checks, worker isolation, session-based stale-result rejection and teardown of tracks/workers/object URLs.

No analytics SDK is installed. Future reporting must accept only allowlisted coarse events and must reject images, filenames, device labels, landmarks, masks and persistent face/session identifiers.

