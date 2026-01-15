# Publishing Kingsman to Open VSX

This guide explains how to publish Kingsman to Open VSX (the default marketplace for Antigravity IDE).

## Prerequisites

1. **Eclipse Account**: [Create one here](https://accounts.eclipse.org/user/register)
2. **GitHub Account**: Already linked to Open VSX
3. **Signed Publisher Agreement**: Done through Open VSX settings

## One-Time Setup

### 1. Create Eclipse Account

1. Go to [accounts.eclipse.org/user/register](https://accounts.eclipse.org/user/register)
2. Register with your email
3. **Important**: Add your GitHub username to your profile

### 2. Link Open VSX to Eclipse

1. Go to [open-vsx.org](https://open-vsx.org)
2. Click **"Log in with GitHub"** (top right)
3. Authorize Open VSX
4. Go to **Settings** (avatar → Settings)
5. Click **"Log in with Eclipse"**
6. Sign the **Publisher Agreement** when prompted

### 3. Generate Personal Access Token

1. On [open-vsx.org](https://open-vsx.org), go to **Settings → Access Tokens**
2. Click **"Generate New Token"**
3. Name: `kingsman-publish`
4. **Copy the token immediately** (won't be shown again)
5. Store in a secure location

### 4. Create Namespace

Run once to create the publisher namespace:

```powershell
npx ovsx create-namespace nilhan-demel -p <YOUR_PAT>
```

## Publishing a New Version

### Quick Publish

```powershell
cd "C:\Users\Nilhan Work\Documents\Nilhan_AI\Kingsman"

# Build and package
npm run compile
npm run package

# Publish to Open VSX
npx ovsx publish kingsman-0.1.1.vsix -p <YOUR_PAT>
```

### Using Environment Variable

```powershell
$env:OVSX_PAT = "<YOUR_PAT>"
npx ovsx publish kingsman-0.1.1.vsix
```

### Full Release Workflow

```powershell
# 1. Bump version in package.json
# 2. Update CHANGELOG.md
# 3. Commit changes
git add .
git commit -m "chore: release v0.1.1"

# 4. Build VSIX
npm run compile
npm run package

# 5. Publish to Open VSX
npx ovsx publish kingsman-0.1.1.vsix -p <YOUR_PAT>

# 6. Tag and push to GitHub
git tag v0.1.1
git push origin main v0.1.1

# 7. Create GitHub release
gh release create v0.1.1 kingsman-0.1.1.vsix --title "v0.1.1" --notes "Published to Open VSX"
```

## Verification

After publishing, verify the extension appears:

1. **Open VSX Website**: [open-vsx.org/extension/nilhan-demel/kingsman](https://open-vsx.org/extension/nilhan-demel/kingsman)

2. **In Antigravity IDE**:
   - Press `Ctrl+Shift+X`
   - Search: `Kingsman`
   - Should appear with Install button

## Troubleshooting

### "Namespace not found"

Create the namespace first:

```powershell
npx ovsx create-namespace nilhan-demel -p <YOUR_PAT>
```

### "Invalid token"

Generate a new PAT from [open-vsx.org Settings](https://open-vsx.org/user-settings/tokens)

### Extension not appearing in search

- Wait 5-10 minutes after publishing
- Try searching by full ID: `nilhan-demel.kingsman`
