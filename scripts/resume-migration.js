#!/usr/bin/env node

/**
 * Script to resume migration from a specific file
 */

const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function resumeMigration() {
  console.log('🚀 Resuming migration of static assets to Vercel Blob...');
  
  // Check if we have the static assets blob token
  const staticAssetsToken = process.env.STATIC_ASSETS_BLOB_TOKEN;
  if (!staticAssetsToken) {
    console.error('❌ STATIC_ASSETS_BLOB_TOKEN environment variable not found!');
    process.exit(1);
  }
  
  const publicDir = path.join(process.cwd(), 'public');
  const uploadedFiles = {};
  
  // Only process testemunhos (videos) since caseStudies are already done
  const dir = 'testemunhos';
  const dirPath = path.join(publicDir, dir);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Directory ${dir} not found, skipping...`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  uploadedFiles[dir] = {};
  
  // Find the index of João Pereira file
  const joaoPereira = files.find(file => file.includes('João Pereira'));
  const startIndex = joaoPereira ? files.indexOf(joaoPereira) : 0;
  
  console.log(`📁 Found ${files.length} files in ${dir}...`);
  console.log(`🎯 Starting from file ${startIndex + 1}: ${files[startIndex]}`);
  
  // Process files starting from João Pereira
  for (let i = startIndex; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dirPath, file);
    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeMB = Math.round(fileBuffer.length / 1024 / 1024 * 100) / 100;
    
    try {
      console.log(`⬆️ Uploading ${file} (${fileSizeMB}MB)...`);
      
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
  
  // Load existing mapping if it exists
  const mappingFile = path.join(process.cwd(), 'blob-asset-mapping.json');
  let existingMapping = {};
  if (fs.existsSync(mappingFile)) {
    existingMapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  }
  
  // Merge with existing mapping
  const finalMapping = {
    ...existingMapping,
    ...uploadedFiles
  };
  
  // Save the updated mapping
  fs.writeFileSync(mappingFile, JSON.stringify(finalMapping, null, 2));
  
  console.log('📝 Asset mapping updated in blob-asset-mapping.json');
  console.log('🎉 Migration resumed and completed!');
}

// Run the migration
if (require.main === module) {
  resumeMigration().catch(console.error);
}

module.exports = { resumeMigration };
