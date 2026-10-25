# Gateway Access Handoff

The image route now requires `Authorization: Bearer <caller key>`. The health route stays public. The gateway returns 503 until `GATEWAY_API_KEY` is configured with a unique, printable 32 to 512 character value. Configure it only in the server's secret store; do not put the value in a repository, report or log.

The previously committed Google key must be rotated by Max. `GEMINI_API_KEY` must be supplied through the server's secret store; the repository fallback is removed. Any approved caller must supply the new header. Rotation and rollout are separate from this PR. No key was generated, changed or deployed by this fix.

The offline test uses synthetic credentials and does not call Google.
