## Summary

- Describe the user-visible or operational change.

## Validation

- [ ] Targeted tests for the changed behavior
- [ ] Ruff, mypy, pytest, and `npm run test:aidlc-validator`
- [ ] `npm run validate:aidlc` (canonical artifact and status validation)

## Review and merge gate

- [ ] Successful current-head `Cursor Bugbot` check for the final proposed commit
- [ ] Every Cursor review thread has a tested fix or evidence-backed disposition and is resolved
- [ ] `python3 scripts/bugbot_merge_gate.py PR_NUMBER` passes for the final head

Do not merge when Bugbot review is missing or stale; absence of comments is not a clean pass.
