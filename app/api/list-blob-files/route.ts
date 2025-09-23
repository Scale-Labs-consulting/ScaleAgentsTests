// List all files in Vercel Blob storage using the list() function
import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export async function GET(request: NextRequest) {
  try {
    console.log(`\n📁 ===== LISTING ALL BLOB FILES =====`)
    
    // Use the list() function from @vercel/blob to get all files
    const { blobs } = await list()
    
    console.log(`📊 Total files in blob storage: ${blobs.length}`)
    
    // Filter files in the SalesAnalystKnowledge folder
    const knowledgeFiles = blobs.filter(blob => 
      blob.pathname.startsWith('SalesAnalystKnowledge/')
    )
    
    console.log(`📚 Files in SalesAnalystKnowledge folder: ${knowledgeFiles.length}`)
    
    // Group files by folder
    const filesByFolder = blobs.reduce((acc, blob) => {
      const folder = blob.pathname.split('/')[0] || 'root'
      if (!acc[folder]) {
        acc[folder] = []
      }
      acc[folder].push({
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size,
        sizeMB: (blob.size / 1024 / 1024).toFixed(2),
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType || 'unknown'
      })
      return acc
    }, {} as Record<string, any[]>)
    
    // Log all folders and their file counts
    console.log(`\n📁 Folders in blob storage:`)
    Object.entries(filesByFolder).forEach(([folder, files]) => {
      console.log(`   📁 ${folder}: ${files.length} files`)
    })
    
    // Log SalesAnalystKnowledge files specifically
    if (knowledgeFiles.length > 0) {
      console.log(`\n📚 SalesAnalystKnowledge files:`)
      knowledgeFiles.forEach((file, index) => {
        const fileName = file.pathname.split('/').pop() || file.pathname
        console.log(`   ${index + 1}. ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.contentType || 'unknown'})`)
      })
    } else {
      console.log(`\n❌ No files found in SalesAnalystKnowledge folder`)
    }
    
    console.log(`📁 ===== LISTING ALL BLOB FILES END =====\n`)
    
    return NextResponse.json({
      success: true,
      totalFiles: blobs.length,
      knowledgeFiles: knowledgeFiles.length,
      knowledgeFilesList: knowledgeFiles.map(file => ({
        fileName: file.pathname.split('/').pop() || file.pathname,
        pathname: file.pathname,
        url: file.url,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        uploadedAt: file.uploadedAt,
        contentType: file.contentType || 'unknown'
      })),
      filesByFolder,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`❌ List blob files error:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
