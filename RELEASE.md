# Release Process

This monorepo uses `release-it` to automate the release process for both `@declarative-dom/types` and `@declarative-dom/lib` packages.

## Prerequisites

1. Ensure you have NPM publish permissions for both packages
2. Be on the `main` branch
3. Have a clean working directory (no uncommitted changes)
4. Install dependencies: `npm install`

## Release Commands

### Standard Releases

```bash
# Patch release (0.1.4 → 0.1.5)
npm run release:patch

# Minor release (0.1.4 → 0.2.0)
npm run release:minor

# Major release (0.1.4 → 1.0.0)
npm run release:major
```

### Pre-releases

```bash
# Beta release (0.1.4 → 0.1.5-beta.0)
npm run release:beta

# Alpha release (0.1.4 → 0.1.5-alpha.0)
npm run release:alpha
```

### Interactive Release

```bash
# Interactive mode - choose version bump
npm run release
```

## What Happens During Release

1. **Pre-checks**: Verifies clean working directory and correct branch
2. **Build**: Cleans and rebuilds both packages (`npm run build`)
3. **Test**: Runs tests for both packages (`npm run test`)
4. **Version Bump**: Updates version in root package.json
5. **Package Updates**: Updates version in both `lib/package.json` and `types/package.json`
6. **Git Operations**: Creates commit and tag
7. **GitHub Release**: Creates GitHub release with changelog
8. **NPM Publishing**: Publishes both packages to NPM
9. **Git Push**: Pushes commits and tags to remote

## Manual Steps

If you need to publish manually:

```bash
# Build both packages
npm run build

# Update versions manually in package.json files
# Then publish individually:
cd types && npm publish
cd ../lib && npm publish
```

## Troubleshooting

### NPM Authentication

If you get authentication errors:

```bash
npm login
# Or set NPM_TOKEN environment variable
export NPM_TOKEN=your_token_here
```

### Failed Release

If a release fails partway through:

1. Check what was published: `npm view @declarative-dom/lib` and `npm view @declarative-dom/types`
2. If packages were published but git operations failed, manually push:
   ```bash
   git push origin main --tags
   ```
3. If git operations succeeded but NPM publish failed, manually publish the remaining packages

### Rollback

To rollback a release:

```bash
# Deprecate the NPM versions (don't unpublish unless absolutely necessary)
npm deprecate @declarative-dom/lib@version "Rolled back due to issues"
npm deprecate @declarative-dom/types@version "Rolled back due to issues"

# Reset git if needed
git reset --hard HEAD~1
git tag -d v${version}
git push origin :refs/tags/v${version}
```

## Configuration

The release process is configured in:

- Root `package.json` - Release scripts and workspace configuration
