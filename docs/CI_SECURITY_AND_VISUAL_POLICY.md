# CI security and merge policy

## Required automated checks

The CI workflow treats high- and critical-severity dependency vulnerabilities as blocking:

- `npm audit --audit-level=high` audits the complete dependency tree, including development dependencies.
- The pull-request dependency review rejects newly introduced high- or critical-severity dependencies.
- CodeQL runs on pull requests and pushes to `main`, using the default query suite plus `security-extended` and `security-and-quality`.
- Firestore authorization tests run against the Firebase emulator with a demo project only.

No audit step may use `continue-on-error` or silently ignore a high/critical finding.

The dependency-review action requires GitHub's Dependency graph feature. The first PR run showed that Dependency graph is currently disabled for this repository, so the action returned `Dependency review is not supported on this repository`. Enable it in **Settings → Security → Advanced Security → Dependency graph**, then rerun CI. Until enabled, the action cannot provide PR-introduced dependency review; the full-tree `npm audit` remains an independent blocking check.

## Existing vulnerability debt

The Phase 1 engineering report recorded 20 dependency vulnerabilities in the complete dependency tree, including 4 high-severity findings. The new strict full-tree audit on this branch reports 21 vulnerabilities (16 moderate, 5 high); its current high-severity report identifies vulnerable @grpc/grpc-js versions pulled through the Firebase dependency tree. The earlier `npm audit fix --force` proposal would downgrade Firebase to 9.14.0 and was deliberately rejected.

The strict audit currently reports 21 vulnerabilities (16 moderate, 5 high). The high findings are in the Firebase dependency chain: `@firebase/firestore@4.8.0` pins `@grpc/grpc-js` to `~1.9.0`, resolving to vulnerable `1.9.16`. The Firebase SDK maintainers have an open issue documenting this exact dependency pin: https://github.com/firebase/firebase-js-sdk/issues/10400. The patched `@grpc/grpc-js` release line is 1.13.6, but forcing it beyond the SDK's declared `~1.9.0` range requires compatibility testing. Do not add an override without validating the SDK, emulator, E2E, and production build. The audit's `--force` suggestion downgrades Firebase to 9.14.0 and is not an acceptable remediation.

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
- Enable the repository Dependency graph so the pull-request dependency-review action can run.
- Block force pushes and deletion of `main`.
- Enable code-scanning merge protection for new high- and critical-severity alerts when that setting is available.

The connected GitHub integration could not read branch-protection settings during the implementation audit (GitHub returned HTTP 403). These repository-level settings must therefore be verified in the GitHub UI by a repository administrator; this workflow does not claim to have configured them.

## Visual regression rollout

The approved HTML mockups in `docs/mockups/` are the visual source of truth. The visual job captures paired viewport screenshots and a per-pixel difference heatmap/ratio for the selected screens at 390px and 1280px.

The first run is a baseline-review stage: the artifact is evidence for human review, not a claim of pixel parity. After the owner reviews the paired images and the observed differences, add per-screen/per-viewport tolerances and make those comparisons blocking. Never regenerate or accept visual baselines automatically on every pull request.


## First visual-review run

CI run 42578419027 generated 32 viewport comparisons (16 selected screens at 390px and 1280px), including full-page side-by-side screenshots, first-viewport difference heatmaps, and JSON pixel-difference ratios. The initial first-viewport ratios ranged from 6.45% to 54.02%. These are diagnostic comparisons, not accepted thresholds or evidence of pixel parity.

This run compared the approved mockups with `main` at base commit `f763e3febabededc65fdf2125a0345557fcb22a9`. PR #21, which adds the leadership directory and seven canonical track routes, was still unmerged. Review and refresh the visual evidence after PR #21 is merged and this branch is updated to the new main before approving per-screen tolerances.
