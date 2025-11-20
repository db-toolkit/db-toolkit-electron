#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}DB Toolkit Version Bump Script${NC}"
echo "================================"
echo ""

# Get current version from pyproject.toml
CURRENT_VERSION=$(grep -m 1 'version = ' src/db-toolkit/pyproject.toml | sed 's/version = "\(.*\)"/\1/')
echo -e "Current version: ${YELLOW}${CURRENT_VERSION}${NC}"
echo ""

# Prompt for new version
read -p "Enter new version (e.g., 0.4.1): " NEW_VERSION

# Validate version format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid version format. Use X.Y.Z (e.g., 0.4.1)${NC}"
    exit 1
fi

echo ""
echo -e "Updating version from ${YELLOW}${CURRENT_VERSION}${NC} to ${GREEN}${NEW_VERSION}${NC}"
echo ""

# Update Backend
echo "Updating backend..."
sed -i '' "s/version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" src/db-toolkit/pyproject.toml
sed -i '' "s/version=\"$CURRENT_VERSION\"/version=\"$NEW_VERSION\"/" src/db-toolkit/main.py

# Update Frontend (Desktop App)
echo "Updating frontend..."
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src/db-toolkit-ui/package.json
sed -i '' "s/Version: $CURRENT_VERSION/Version: $NEW_VERSION/" src/db-toolkit-ui/electron/main.js

# Update Documentation Site
echo "Updating docs..."
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src/docs/package.json
sed -i '' "s/v$CURRENT_VERSION/v$NEW_VERSION/" src/docs/src/pages/ChangelogPage.tsx

# Update Website
echo "Updating web..."
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src/web/package.json
sed -i '' "s/v$CURRENT_VERSION/v$NEW_VERSION/" src/web/components/Hero.js

# Update Root Files
echo "Updating root files..."
sed -i '' "s/version-$CURRENT_VERSION-blue/version-$NEW_VERSION-blue/" README.md

echo ""
echo -e "${GREEN}✓ All files updated successfully!${NC}"
echo ""

# Git operations
echo "Committing changes..."
git add -A
git commit -m "Bump version to $NEW_VERSION"

echo ""
echo -e "${GREEN}✓ Changes committed${NC}"
echo ""
echo "Next steps:"
echo "1. git tag v$NEW_VERSION"
echo "2. git push origin main --tags"
echo ""
