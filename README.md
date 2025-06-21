# TopCityTickets

A simple event ticketing platform built with Next.js and Supabase.

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

#### Windows:
```bash
.\deploy-simple.bat
```

#### Mac/Linux:
```bash
chmod +x deploy.sh
./deploy.sh
```

## User Roles

- **User**: Browse events and purchase tickets
- **Seller**: Submit events for approval
- **Admin**: Review and approve events

## Environment Variables

These need to be set in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://vzndqhzpzdphiiblwplh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=your-vercel-domain
```

## Build Troubleshooting

If you encounter TypeScript errors during build:

1. Use the simplified build script:
   ```bash
   npm run build
   ```

2. For Vercel deployment issues, use:
   ```bash
   .\deploy-simple.bat
   ```

This will bypass TypeScript checking during the build process.
