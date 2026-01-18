# Versioning Strategy

This project follows [Semantic Versioning 2.0.0](https://semver.org/).

## Version Numbering

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes or complete re-writes.
- **MINOR**: Backward-compatible functionality (new features).
- **PATCH**: Backward-compatible bug fixes.

## Release Process

1. **Update Changelog**: Add a new entry in `CHANGELOG.md` under `## [Unreleased]`.
2. **Bump Version**: Update version strings in:
   - `crm-dashboard/package.json`
   - `api/server.py`
3. **Commit**: `git commit -m "chore: release vX.Y.Z"`
4. **Tag**: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
5. **Push**: `git push origin master --tags`

## Branching Model

- `master`: Stable, deployable production code.
- `feature/*`: New features (e.g., `feature/kanban-board`).
- `fix/*`: Bug fixes (e.g., `fix/header-layout`).
