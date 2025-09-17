#!/usr/bin/env node

/**
 * Script to migrate static assets (case studies and testimonials) to Vercel Blob Storage
 * This will improve loading performance and avoid Git LFS issues on Vercel
 */

const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function migrateAssetsToBlob() {
  console.log('🚀 Starting migration of static assets to Vercel Blob...');
  
  // Check if we have the static assets blob token
  const staticAssetsToken = process.env.STATIC_ASSETS_BLOB_TOKEN;
  if (!staticAssetsToken) {
    console.error('❌ STATIC_ASSETS_BLOB_TOKEN environment variable not found!');
    console.log('📋 Please:');
    console.log('1. Create a new Blob store in Vercel dashboard for static assets');
    console.log('2. Add STATIC_ASSETS_BLOB_TOKEN to your environment variables');
    process.exit(1);
  }
  
  const publicDir = path.join(process.cwd(), 'public');
  const assetDirs = ['caseStudies', 'testemunhos'];
  const uploadedFiles = {};
  
  for (const dir of assetDirs) {
    const dirPath = path.join(publicDir, dir);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️ Directory ${dir} not found, skipping...`);
      continue;
    }
    
    const files = fs.readdirSync(dirPath);
    uploadedFiles[dir] = {};
    
    console.log(`📁 Processing ${files.length} files in ${dir}...`);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      try {
        console.log(`⬆️ Uploading ${file}...`);
        
        const blob = await put(`${dir}/${file}`, fileBuffer, {
          access: 'public',
          token: staticAssetsToken,
        });
        
        uploadedFiles[dir][file] = blob.url;
        console.log(`✅ Uploaded ${file} -> ${blob.url}`);
        
      } catch (error) {
        console.error(`❌ Failed to upload ${file}:`, error.message);
      }
    }
  }
  
  // Save the mapping to a JSON file for reference
  const mappingFile = path.join(process.cwd(), 'blob-asset-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(uploadedFiles, null, 2));
  
  console.log('📝 Asset mapping saved to blob-asset-mapping.json');
  console.log('🎉 Migration completed!');
  
  // Print instructions
  console.log('\n📋 Next steps:');
  console.log('1. Update your code to use the Blob URLs instead of /public paths');
  console.log('2. Remove the large files from Git LFS to reduce repository size');
  console.log('3. Deploy the updated code');
}

// Run the migration
if (require.main === module) {
  migrateAssetsToBlob().catch(console.error);
}

module.exports = { migrateAssetsToBlob };
