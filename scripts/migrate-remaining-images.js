#!/usr/bin/env node

/**
 * Script to migrate remaining static images to Vercel Blob Storage
 * This includes /images directory and root placeholder files
 */

const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function migrateRemainingImages() {
  console.log('🚀 Starting migration of remaining images to Vercel Blob...');
  
  // Check if we have the static assets blob token
  const staticAssetsToken = process.env.STATIC_ASSETS_BLOB_TOKEN;
  if (!staticAssetsToken) {
    console.error('❌ STATIC_ASSETS_BLOB_TOKEN environment variable not found!');
    console.log('📋 Please:');
    console.log('1. Make sure STATIC_ASSETS_BLOB_TOKEN is set in your environment');
    console.log('2. Get the token from your Vercel dashboard > Storage > Blob');
    process.exit(1);
  }
  
  const publicDir = path.join(process.cwd(), 'public');
  const uploadedFiles = {};
  let totalUploaded = 0;
  
  // Load existing mapping
  const mappingFile = path.join(process.cwd(), 'blob-asset-mapping.json');
  let existingMapping = {};
  if (fs.existsSync(mappingFile)) {
    existingMapping = JSON.parse(fs.readFileSync(mappingFile));
  }
  
  // 1. Migrate /images directory
  console.log('\n📁 Migrating /images directory...');
  const imagesDir = path.join(publicDir, 'images');
  
  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir);
    uploadedFiles.images = {};
    
    console.log(`📸 Found ${imageFiles.length} files in images directory`);
    
    for (const file of imageFiles) {
      const filePath = path.join(imagesDir, file);
      const stats = fs.statSync(filePath);
      
      // Skip if it's a directory
      if (stats.isDirectory()) continue;
      
      try {
        console.log(`⬆️  Uploading images/${file}...`);
        
        const fileBuffer = fs.readFileSync(filePath);
        const blob = await put(`images/${file}`, fileBuffer, {
          access: 'public',
          token: staticAssetsToken,
        });
        
        uploadedFiles.images[file] = blob.url;
        totalUploaded++;
        console.log(`✅ Uploaded images/${file} -> ${blob.url}`);
        
      } catch (error) {
        console.error(`❌ Failed to upload images/${file}:`, error.message);
      }
    }
  } else {
    console.log('⚠️  /images directory not found');
  }
  
  // 2. Migrate root files (trustFactor.png, placeholders, etc.)
  console.log('\n📁 Migrating root image files...');
  const rootImageFiles = [
    'trustFactor.png',
    'placeholder-logo.png', 
    'placeholder-logo.svg',
    'placeholder-user.jpg',
    'placeholder.jpg',
    'placeholder.svg'
  ];
  
  uploadedFiles.root = {};
  
  for (const file of rootImageFiles) {
    const filePath = path.join(publicDir, file);
    
    if (fs.existsSync(filePath)) {
      try {
        console.log(`⬆️  Uploading ${file}...`);
        
        const fileBuffer = fs.readFileSync(filePath);
        const blob = await put(file, fileBuffer, {
          access: 'public',
          token: staticAssetsToken,
        });
        
        uploadedFiles.root[file] = blob.url;
        totalUploaded++;
        console.log(`✅ Uploaded ${file} -> ${blob.url}`);
        
      } catch (error) {
        console.error(`❌ Failed to upload ${file}:`, error.message);
      }
    } else {
      console.log(`⚠️  ${file} not found, skipping...`);
    }
  }
  
  // 3. Update blob-asset-mapping.json
  console.log('\n📝 Updating blob-asset-mapping.json...');
  const newMapping = { 
    ...existingMapping, 
    ...uploadedFiles 
  };
  
  fs.writeFileSync(mappingFile, JSON.stringify(newMapping, null, 2));
  console.log('✅ Asset mapping updated successfully');
  
  // 4. Summary
  console.log('\n🎉 Migration completed!');
  console.log(`📊 Summary:`);
  console.log(`   • Total files uploaded: ${totalUploaded}`);
  console.log(`   • Images directory: ${Object.keys(uploadedFiles.images || {}).length} files`);
  console.log(`   • Root files: ${Object.keys(uploadedFiles.root || {}).length} files`);
  
  console.log('\n📋 Next steps:');
  console.log('1. Update your code to use the new Blob URLs');
  console.log('2. Test the application to ensure all images load correctly');
  console.log('3. Deploy the updated code');
  console.log('4. Consider removing the local files from /public to reduce repo size');
  
  console.log('\n🔗 Your blob storage base URL:');
  console.log('https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/');
}

// Run the migration
if (require.main === module) {
  migrateRemainingImages().catch(console.error);
}

module.exports = { migrateRemainingImages };
