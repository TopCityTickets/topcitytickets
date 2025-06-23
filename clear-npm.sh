#!/bin/bash
echo "Clearing npm cache and fixing issues..."

echo "1. Clearing npm cache..."
npm cache clean --force

echo "2. Removing node_modules..."
rm -rf node_modules

echo "3. Removing package-lock.json..."
rm -f package-lock.json

echo "4. Reinstalling dependencies..."
npm install

echo "5. Running npm audit fix..."
npm audit fix

echo "6. Running npm audit fix --force (if needed)..."
npm audit fix --force

echo "Done! Your npm environment should be clean now."
