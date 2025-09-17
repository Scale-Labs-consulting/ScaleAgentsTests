# Migrate Remaining Images to Blob Storage

This guide will help you migrate the remaining images from `/public` to Vercel Blob Storage.

## Prerequisites

1. **Vercel Blob Storage Token**: You need the `STATIC_ASSETS_BLOB_TOKEN` environment variable
2. **Node.js packages**: Make sure `@vercel/blob` is installed

## Steps

### 1. Set the Environment Variable

```bash
# Add this to your environment (replace with your actual token)
export STATIC_ASSETS_BLOB_TOKEN="your_blob_token_here"

# Or on Windows:
set STATIC_ASSETS_BLOB_TOKEN=your_blob_token_here
```

### 2. Run the Migration Script

```bash
# Make the script executable (Linux/Mac)
chmod +x scripts/migrate-remaining-images.js

# Run the migration
node scripts/migrate-remaining-images.js
```

### 3. What Gets Migrated

The script will upload:

**Images Directory (`/images/`):**
- background-1.png
- background-2.jpg  
- background-3.jpg
- background-4.jpg
- background-5.jpg
- brand-background.png
- logo-black.png
- logo-square.png
- logo-white.png
- scaleExpert.png

**Root Files:**
- trustFactor.png
- placeholder-logo.png
- placeholder-logo.svg
- placeholder-user.jpg
- placeholder.jpg
- placeholder.svg

### 4. After Migration

The script will:
1. Upload all files to blob storage
2. Update `blob-asset-mapping.json` with the new URLs
3. Show you a summary of uploaded files

### 5. Update Code References

After migration, you'll need to update any remaining code that references these images to use the blob URLs:

```javascript
// Old
src="/images/logo-square.png"

// New  
src="https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/logo-square.png"
```

## Troubleshooting

### Error: STATIC_ASSETS_BLOB_TOKEN not found
- Make sure you've set the environment variable
- Get the token from Vercel Dashboard > Storage > Blob

### Error: Module not found '@vercel/blob'
```bash
npm install @vercel/blob
# or
pnpm install @vercel/blob
```

### Files already exist in blob storage
The script will overwrite existing files with the same name.

## File Structure After Migration

```
blob-asset-mapping.json
├── testemunhos: { ... } (existing)
├── caseStudies: { ... } (existing)  
├── images: {
│   ├── "background-1.png": "https://...",
│   ├── "logo-black.png": "https://...",
│   └── ...
└── root: {
    ├── "trustFactor.png": "https://...",
    ├── "placeholder-logo.png": "https://...",
    └── ...
}
```
