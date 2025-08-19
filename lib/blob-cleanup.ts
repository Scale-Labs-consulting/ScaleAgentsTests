import { list, del } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

export interface BlobCleanupOptions {
  maxAge?: number // Maximum age in hours before deletion
  dryRun?: boolean // If true, only list files without deleting
  userId?: string // Specific user's files to clean up
}

export interface BlobFile {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
}

export const cleanupOldBlobFiles = async (options: BlobCleanupOptions = {}) => {
  const {
    maxAge = 24, // Default: 24 hours
    dryRun = false,
    userId
  } = options

  try {
    console.log('🧹 Starting blob cleanup...')
    console.log('📊 Cleanup options:', { maxAge, dryRun, userId })

    // List all files in the blob store
    const { blobs } = await list()
    
    const cutoffTime = new Date(Date.now() - maxAge * 60 * 60 * 1000)
    const filesToDelete: BlobFile[] = []

    // Filter files based on criteria
    for (const blob of blobs) {
      const shouldDelete = 
        blob.uploadedAt < cutoffTime && // Older than maxAge
        (!userId || blob.pathname.startsWith(`${userId}/`)) // User-specific if specified

      if (shouldDelete) {
        filesToDelete.push({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt
        })
      }
    }

    console.log(`📋 Found ${filesToDelete.length} files to delete out of ${blobs.length} total`)

    if (dryRun) {
      console.log('🔍 DRY RUN - Files that would be deleted:')
      filesToDelete.forEach(file => {
        console.log(`  - ${file.pathname} (${(file.size / 1024 / 1024).toFixed(1)}MB, uploaded ${file.uploadedAt.toISOString()})`)
      })
      return { deleted: 0, totalSize: 0, files: filesToDelete }
    }

    // Delete files
    let deletedCount = 0
    let totalSizeDeleted = 0

    for (const file of filesToDelete) {
      try {
        await del(file.url)
        deletedCount++
        totalSizeDeleted += file.size
        console.log(`✅ Deleted: ${file.pathname}`)
      } catch (error) {
        console.error(`❌ Failed to delete ${file.pathname}:`, error)
      }
    }

    console.log(`🎉 Cleanup completed: ${deletedCount} files deleted, ${(totalSizeDeleted / 1024 / 1024).toFixed(1)}MB freed`)

    return {
      deleted: deletedCount,
      totalSize: totalSizeDeleted,
      files: filesToDelete
    }

  } catch (error) {
    console.error('❌ Blob cleanup failed:', error)
    throw error
  }
}

export const getBlobStorageStats = async () => {
  try {
    const { blobs } = await list()
    
    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0)
    const totalFiles = blobs.length
    
    // Group by user
    const userStats = blobs.reduce((acc, blob) => {
      const userId = blob.pathname.split('/')[0]
      if (!acc[userId]) {
        acc[userId] = { count: 0, size: 0 }
      }
      acc[userId].count++
      acc[userId].size += blob.size
      return acc
    }, {} as Record<string, { count: number; size: number }>)

    // Group by age
    const now = new Date()
    const ageGroups = {
      '1 hour': 0,
      '24 hours': 0,
      '7 days': 0,
      '30 days': 0,
      'older': 0
    }

    blobs.forEach(blob => {
      const ageHours = (now.getTime() - blob.uploadedAt.getTime()) / (1000 * 60 * 60)
      if (ageHours <= 1) ageGroups['1 hour']++
      else if (ageHours <= 24) ageGroups['24 hours']++
      else if (ageHours <= 168) ageGroups['7 days']++
      else if (ageHours <= 720) ageGroups['30 days']++
      else ageGroups['older']++
    })

    return {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(1),
      userStats,
      ageGroups
    }

  } catch (error) {
    console.error('❌ Failed to get blob stats:', error)
    throw error
  }
}

export const cleanupUserFiles = async (userId: string, options: BlobCleanupOptions = {}) => {
  return cleanupOldBlobFiles({
    ...options,
    userId,
    maxAge: options.maxAge || 1 // Default: 1 hour for user-specific cleanup
  })
}

export const cleanupAllOldFiles = async (maxAgeHours: number = 24) => {
  return cleanupOldBlobFiles({
    maxAge: maxAgeHours,
    dryRun: false
  })
}
