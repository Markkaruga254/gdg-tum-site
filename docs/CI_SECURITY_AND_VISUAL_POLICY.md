# CI security and merge policy

## Required automated checks

The CI workflow treats high- and critical-severity dependency vulnerabilities as blocking:

- `npm audit --audit-level=high` audits the complete dependency tree, including development dependencies.
- The pull-request dependency review rejects newly introduced high- or critical-severity dependencies.
- CodeQL runs on pull requests and pushes to `main`, using the default query suite plus `security-extended` and `security-and-quality`.
- Firestore authorization tests run against the Firebase emulator with a demo project only.

No audit step may use `continue-on-error` or silently ignore a high/critical finding.

## Existing vulnerability debt

The Phase 1 engineering report recorded 20 dependency vulnerabilities in the complete dependency tree, including 4 high-severity findings. The production-only audit recorded the same 4 high findings. The earlier `npm audit fix --force` proposal would downgrade Firebase to 9.14.0 and was deliberately rejected.

The strict audit is expected to remain red until those findings are resolved through compatibility-reviewed dependency updates. Do not lower the severity threshold, skip development dependencies, or add broad audit exceptions to obtain a green check. Review the current npm audit output on the branch before selecting upgrades.

## Exception process

An exception must be narrowly scoped and reviewed before it is introduced. Record:

1. The exact advisory/GHSA and affected package/version.
2. The severity and reachable dependency path.
3. Why an upgrade or mitigation is not currently safe.
4. The compensating mitigation and owner.
5. An expiry date and a tracked remediation issue.

Exceptions must not silently suppress unrelated findings. Critical findings should not receive an exception without an explicit security review.

## Repository settings required

Workflow YAML cannot enable branch protection or code-scanning merge protection by itself. In GitHub repository settings, configure the `main` branch ruleset to:

- Require a pull request before merging.
- Require the `Required CI gate` status from the CI workflow.
- Require the CodeQL analysis check (currently named `Analyze (javascript-typescript)`).
- Require the dependency security check (currently named `Dependency security`).
- Require branches to be up to date before merging.
- Block force pushes and deletion of `main`.
- Enable code-scanning merge protection for new high- and critical-severity alerts when that setting is available.

The connected GitHub integration could not read branch-protection settings during the implementation audit (GitHub returned HTTP 403). These repository-level settings must therefore be verified in the GitHub UI by a repository administrator; this workflow does not claim to have configured them.

## Visual regression rollout

The approved HTML mockups in `docs/mockups/` are the visual source of truth. The visual job captures paired viewport screenshots and a per-pixel difference heatmap/ratio for the selected screens at 390px and 1280px.

The first run is a baseline-review stage: the artifact is evidence for human review, not a claim of pixel parity. After the owner reviews the paired images and the observed differences, add per-screen/per-viewport tolerances and make those comparisons blocking. Never regenerate or accept visual baselines automatically on every pull request.
