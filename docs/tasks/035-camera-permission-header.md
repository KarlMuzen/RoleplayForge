# Task 035: Remove the unused camera permission from the response headers

Review: required
Goal: Block camera access for the whole app by changing `camera=(self)` to `camera=()` in the production headers, because device sync (the only camera user, the QR scanner) was removed in card 034.
Files to touch: `vercel.json`, `public/_headers`
Do not touch: everything else. In particular not the `Content-Security-Policy` lines, not `test/securityHeaders.test.ts`, not `src/`, not `package.json`, not `docs/`, and not the other `Permissions-Policy` entries (`microphone`, `geolocation`, `payment`).
Changes:
1. Before editing, search `src/` for `getUserMedia`, `mediaDevices` and a `capture` attribute on any input. If any of them is found, stop and send one message (that conflicts with this card).
2. `vercel.json`: in the `Permissions-Policy` header value, replace `camera=(self)` with `camera=()`. The value becomes `camera=(), microphone=(), geolocation=(), payment=()`. Nothing else in the file changes.
3. `public/_headers`: the same one-line change in the `Permissions-Policy:` line. The result is `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`. Nothing else in the file changes.
Done when: `test-and-lint` is green; the diff is exactly 2 files and 2 changed lines; the merge commit has a READY production deployment. Owner can see (phone check, not a gate): the app loads normally and no camera prompt appears anywhere.
Decisions: 22 (deploy recovery if the merge commit has no READY deployment).
