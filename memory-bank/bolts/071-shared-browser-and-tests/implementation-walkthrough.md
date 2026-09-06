# Implementation Walkthrough

Browser Use inventory and price share a hardened session host and Agent/model configuration. Capability-specific tools, result schemas and authoritative application validation stay separate. Shared scalar normalization retains each payload's field constraints. Terminal diagnosis provenance has one domain mapping. Session leases use subject_id directly; test fakes live under tests/support.

Replay tests use the six packaged fixtures through curated_fixture_directory(); the duplicate test corpus and mirror-equality assertion are removed. Coordinator defaults and Browser Use cost setup use small builders while cancellation, admission, cap, revocation and race scenarios stay separate.

LLM key tests assert the exact adapter model/key and decryption path with ambient credentials removed. Remote-auth checks exercise real runtime assembly and server-evidence execution with forbidden model sentinels. Compose policy is tested with parsed YAML; Docker/Caddy checks inspect active directives and preserve meaningful dependency ordering.
