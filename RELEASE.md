# Release Guide

This monorepo uses release-it with conventional-changelog for automated releases and NPM publishing.

## Prerequisites

1. Make sure you're logged into NPM: `npm login`
2. Ensure you have write access to the @declarative-dom organization
3. Make sure your working directory is clean (or use `--ci` flag)

## Release Process

### 1. Standard Release
```bash
npm run release
```

This will:
1. Release the `types` package first
2. Release the `lib` package (with updated dependency versions)
3. Create a git tag and GitHub release at the root level
4. Generate CHANGELOG.md files for each package and the root
5. Publish both packages to NPM

### 2. Dry Run
```bash
npm run release -- --dry-run
```

Test the release process without making any changes.

### 3. Prerelease
```bash
npm run release -- --preRelease=beta
```

Create a beta release.

### 4. CI Mode
```bash
npm run release -- --ci
```

Skip interactive prompts (useful for CI/CD).

## Conventional Commits

This setup uses conventional commits for automated changelog generation. Use these commit prefixes:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### Breaking Changes
Add `BREAKING CHANGE:` in the commit footer for major version bumps:

```
feat: new API design

BREAKING CHANGE: The old API has been removed
```

## Package Structure

- **Root**: Handles git tagging, GitHub releases, and root changelog
- **types**: TypeScript definitions package
- **lib**: Main library package (depends on types)

The lib package automatically updates its dependency on the types package during releases.

## Generated Files

After releases, you'll see:
- `CHANGELOG.md` in root, types/, and lib/
- Updated version numbers in all package.json files
- Git tags and GitHub releases

## Manual Publishing

If you need to publish manually:

```bash
# Types package
cd types
npm run build
npm publish

# Lib package
cd lib
npm run build
npm publish
```
