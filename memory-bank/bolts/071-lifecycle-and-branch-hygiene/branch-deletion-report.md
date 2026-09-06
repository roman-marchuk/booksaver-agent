---
created: 2026-09-06T21:35:40Z
bolt: 071-lifecycle-and-branch-hygiene
---

# Obsolete Branch Deletion

User explicitly authorized deletion of unused old branches after the branch-wide audit. No open PR referenced a candidate. The four squash predecessors had verified integrated tree equivalence; the two unmerged Cursor branches were rejected obsolete policy alternatives. Remote deletion used one atomic push with expected-SHA leases. Local deletion used a compare-and-delete ref transaction. Candidate absence was verified with fresh local refs and remote ls-remote.

Deleted 18 local and 16 remote refs. No worktree files were deleted. The clean tracked/untracked inventory-route worktree was detached at its existing commit, preserving ignored/generated files.

| Branch | Last commit | Local deleted | Remote deleted |
|---|---|---|---|
| `codex/accept-booking-202-baseline` | `07fba2b75d2cba9a5d2f9bfab95996655d28ad8e` | True | True |
| `codex/adaptive-booking-browser-resilience` | `f1d6bf023dc42a4217b16d95e824e40a75223d98` | True | True |
| `codex/connect-refresh-status` | `1479c284fafe0c9e7e0716cb4b87fe3725977988` | True | True |
| `codex/fix-browser-use-runtime-permissions` | `c19f06721accdf79832689000c42222b54e450ca` | True | True |
| `codex/fix-inventory-navigation-recovery` | `d645538cd71312d080d2791c8eb153d5eb571064` | True | True |
| `codex/hide-unobserved-genius` | `3b8cbceb6650a004b90b4bf6f86af7e827d00b15` | True | True |
| `codex/invitee-browser-use-admin-visibility` | `a8f6b0301e9d7a105cb98ac2fc759a5822050b4a` | True | True |
| `codex/llm-browser-recovery-hardening` | `18fcf83765f83defdec2ec2a5950b2343f49b58b` | True | True |
| `codex/network-first-remote-auth` | `d15a5929c3fed9ffbf581fa8c19cb1f44da32303` | True | True |
| `codex/purge-provider-auth-hardening` | `0c59a7f28358304896c3b9bd6c5708f24e4a3e97` | True | True |
| `codex/record-hide-genius-deployment` | `2c3d10418c0b1f598f32f769087c226780ad24d6` | True | True |
| `codex/record-llm-recovery-deployment` | `1e190db1031bfa953c37b203a673df9789f9edd1` | True | True |
| `codex/remote-auth-finalization-race` | `d15ce43735ab016fc56971c5483c08e7cfe26540` | True | True |
| `codex/remote-auth-gray-screen-hotfix` | `4ad321c254879f3ebda1f42ab89d0ba57717dda7` | True | True |
| `codex/browser-use-bookings` | `a72cc403614a01534446a030105f0ff128a56549` | True | False |
| `codex/bugbot-remote-auth-races` | `f6bd03a114d050fa9a7cfcad48e83728bdc0e361` | True | False |
| `codex/intent-017-current-rebook-opportunities` | `092e42762e199af924d5eb48421ea1b6ce30f889` | True | False |
| `codex/fix-browser-use-inventory-route` | `1971ad26db16883a57398b2b57714e4c66606f45` | True | False |
| `cursor/booksaver-logic-bugs-eca6` | `07791809db48dd32a0eee891776ae4f8cadee3f4` | False | True |
| `cursor/remote-auth-session-logic-9ef9` | `5c97b311d6eb6d768e249d8dcab1c45d65aee14a` | False | True |

## Preserved current work

- `codex/issue-3-multiple-llm-providers`
- `codex/performance-audit`
- `codex/performance-vps-validation`
- `codex/price-rejection-diagnostics`
- `codex/responsive-connect-viewer`
- `codex/streamline-retired-code`
- `main`

Main, this cleanup, current diagnostics/performance work and the issue-3 untracked draft remain intact. Final task inspection confirmed further local device-adaptive viewer work; that branch remains active. Diagnostics PR #47 merged during cleanup, and its current task/worktree remains preserved. Branch deletion does not approve committing, publishing, merging or deploying cleanup code.

## Final integration snapshot

The cleanup was advanced locally to main `4b52ea3` after PR #47 merged, with its uncommitted changes preserved and the story-index overlap resolved. No cleanup commit or merge commit was created. Fresh remote inspection verified that none of the deleted candidates reappeared. Current feature refs remain, including device-adaptive viewer work created by another active task during the final checks.
