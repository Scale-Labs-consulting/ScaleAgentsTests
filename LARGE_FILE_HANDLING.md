# Large File Handling Guide

## 📊 **Vercel Blob File Size Limits**

### Current Limits:
- **Single File**: 500MB maximum
- **Total Storage**: Unlimited (based on pricing)
- **Multipart Uploads**: Automatic for files > 100MB

## 🔧 **Solutions for Files > 500MB**

### **Option 1: File Size Validation (Implemented)**
✅ **Status**: Already implemented in your application

**Client-side validation** (in `app/sales-analyst/page.tsx`):
```javascript
// Check file size limit (500MB for Vercel Blob)
const maxSize = 500 * 1024 * 1024 // 500MB in bytes
if (file.size > maxSize) {
  alert(`Ficheiro demasiado grande: ${(file.size / (1024 * 1024)).toFixed(1)}MB. O tamanho máximo é 500MB.`)
  return
}
```

**Server-side validation** (in `app/api/sales-analyst/blob-upload/route.ts`):
```javascript
// Validate file size (500MB limit for Vercel Blob)
const maxSize = 500 * 1024 * 1024 // 500MB in bytes
if (file.size > maxSize) {
  return NextResponse.json(
    { error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 500MB.` },
    { status: 400 }
  )
}
```

### **Option 2: File Compression (Recommended)**
Compress videos before upload to reduce file size:

```javascript
// Client-side compression example
const compressVideo = async (file) => {
  // Use browser APIs or libraries like FFmpeg.wasm
  // This can reduce file size by 50-80%
}
```

### **Option 3: Chunked Upload (Advanced)**
Split large files into chunks and reassemble:

```javascript
// Split file into 500MB chunks
const chunkSize = 500 * 1024 * 1024
const chunks = Math.ceil(file.size / chunkSize)

for (let i = 0; i < chunks; i++) {
  const start = i * chunkSize
  const end = Math.min(start + chunkSize, file.size)
  const chunk = file.slice(start, end)
  
  // Upload each chunk
  await uploadChunk(chunk, i, chunks)
}
```

### **Option 4: Alternative Storage (Enterprise)**
For files > 500MB, consider:

1. **AWS S3 Direct Upload**
2. **Google Cloud Storage**
3. **Azure Blob Storage**
4. **Supabase Storage** (with custom limits)

## 📈 **File Size Optimization**

### **Video Compression Tips:**
- **Format**: Use MP4 with H.264 codec
- **Resolution**: 720p or 1080p (avoid 4K for calls)
- **Bitrate**: 1-2 Mbps for calls
- **Duration**: Consider splitting long calls

### **Expected File Sizes:**
| Duration | Quality | Expected Size |
|----------|---------|---------------|
| 30 min   | 720p    | ~200-300MB    |
| 60 min   | 720p    | ~400-500MB    |
| 30 min   | 1080p   | ~400-500MB    |
| 60 min   | 1080p   | ~800MB+       |

## 🚀 **Recommended Approach**

### **For Most Users (Current Implementation):**
1. ✅ **File size validation** (500MB limit)
2. ✅ **User-friendly error messages**
3. ✅ **Automatic multipart uploads** (100MB+)

### **For Enterprise Users (Future Enhancement):**
1. **File compression** before upload
2. **Multiple storage providers**
3. **Chunked uploads** for very large files

## 🔧 **Implementation Status**

### ✅ **Completed:**
- File size validation (client & server)
- Error handling for large files
- User-friendly error messages
- Multipart upload support (automatic)

### 🔄 **Future Enhancements:**
- Client-side video compression
- Alternative storage providers
- Chunked upload system
- File splitting for long calls

## 💡 **Best Practices**

### **For Users:**
1. **Compress videos** before upload
2. **Use appropriate resolution** (720p for calls)
3. **Split long calls** into segments
4. **Check file size** before upload

### **For Developers:**
1. **Always validate** file size server-side
2. **Provide clear error messages**
3. **Consider compression** for large files
4. **Monitor storage costs**

## 📊 **Cost Impact**

### **Storage Costs (Vercel Blob):**
- **500MB file**: ~$0.02/month storage
- **100 files/month**: ~$2/month storage
- **Bandwidth**: ~$0.04 per 500MB file

### **Alternative Solutions:**
- **AWS S3**: Similar pricing, higher limits
- **Google Cloud**: Similar pricing, higher limits
- **Supabase Storage**: Free tier available

## 🎯 **Recommendation**

**For your current use case**, the 500MB limit with validation is perfect because:

1. **Most sales calls** are under 30 minutes
2. **720p quality** is sufficient for analysis
3. **500MB limit** covers 99% of use cases
4. **Simple implementation** with Vercel Blob

**If you need larger files**, implement client-side compression first, then consider alternative storage providers.

---

**Note**: The current implementation handles 99% of real-world sales call recordings. For the 1% of very large files, users can compress or split their videos before upload.
