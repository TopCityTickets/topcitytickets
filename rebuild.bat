@echo off
echo === REBUILDING PROJECT ===

echo 1. Installing Next.js with App Router...
npm install next@latest react@latest react-dom@latest

echo 2. Installing UI dependencies...
npm install @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-slot class-variance-authority clsx lucide-react tailwind-merge

echo 3. Installing Supabase...
npm install @supabase/ssr @supabase/supabase-js

echo 4. Installing dev dependencies...
npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next autoprefixer postcss tailwindcss tailwindcss-animate postcss-import

echo 5. Creating basic project structure...
mkdir src
mkdir src\app
mkdir src\components
mkdir src\lib
mkdir src\types

echo 6. Creating essential files...
echo // Basic App Router Setup > src\app\page.tsx
echo // Root Layout > src\app\layout.tsx

echo === REBUILD COMPLETE ===
echo Now run: npm run dev
pause
