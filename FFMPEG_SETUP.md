# FFmpeg.wasm Setup Guide

## 🎵 **Video to Audio Conversion**

This guide explains how to set up FFmpeg.wasm for client-side video-to-audio conversion, which dramatically reduces file sizes and eliminates the 500MB upload limit.

## 📦 **Installation**

The required packages are already installed:

```bash
pnpm add @ffmpeg/ffmpeg @ffmpeg/util
```

## 🔧 **Setup Steps**

### 1. **Download FFmpeg Core Files**

Create a `public/ffmpeg/` directory and download the core files:

```bash
mkdir -p public/ffmpeg
cd public/ffmpeg
```

Download these files from the FFmpeg.wasm CDN:
- `ffmpeg-core.js`
- `ffmpeg-core.wasm`

### 2. **Alternative: Use CDN (Recommended)**

Update the `lib/video-converter.ts` file to use CDN URLs:

```typescript
// Load FFmpeg from CDN
await ffmpeg.load({
  coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
  wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
})
```

## 🚀 **How It Works**

### **Conversion Process:**
1. **User selects video file** (> 50MB)
2. **Client-side conversion** (MP4 → MP3)
3. **File size reduction** (90%+ smaller)
4. **Upload to Vercel Blob** (no size limits)
5. **Process with OpenAI Whisper** (audio only)

### **File Size Comparison:**
| Original Video | Converted Audio | Reduction |
|----------------|-----------------|-----------|
| 500MB MP4      | 50MB MP3        | 90%       |
| 1GB MP4        | 100MB MP3       | 90%       |
| 2GB MP4        | 200MB MP3       | 90%       |

## 📊 **Benefits**

### **For Users:**
- ✅ **No file size limits** (converts large videos)
- ✅ **Faster uploads** (smaller files)
- ✅ **Better processing** (audio optimized)
- ✅ **Cost savings** (less storage/bandwidth)

### **For Developers:**
- ✅ **Simplified processing** (audio only)
- ✅ **Reduced server load** (client-side conversion)
- ✅ **Better reliability** (no size limits)
- ✅ **Lower costs** (smaller files)

## 🔧 **Configuration**

### **Conversion Settings:**
```typescript
// MP3 settings (optimized for speech)
'-acodec', 'mp3',      // MP3 codec
'-ab', '128k',         // 128kbps bitrate
'-ar', '44100',        // 44.1kHz sample rate
'-ac', '2',            // Stereo
```

### **Quality vs Size:**
- **128kbps**: Good for speech, ~90% reduction
- **192kbps**: Better quality, ~85% reduction
- **256kbps**: High quality, ~80% reduction

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **FFmpeg not loading**
   - Check network connection
   - Verify CDN URLs
   - Check browser console for errors

2. **Conversion fails**
   - Try smaller files first
   - Check file format support
   - Verify browser compatibility

3. **Memory issues**
   - Reduce file size before conversion
   - Use lower quality settings
   - Close other browser tabs

### **Browser Support:**
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (may have issues)
- ❌ Internet Explorer

## 📈 **Performance Tips**

### **Optimization:**
1. **Convert only large files** (> 50MB)
2. **Use appropriate quality** (128kbps for calls)
3. **Show progress** during conversion
4. **Handle errors gracefully**

### **User Experience:**
1. **Clear status messages**
2. **Progress indicators**
3. **Fallback to original** if conversion fails
4. **File size comparison** display

## 🎯 **Implementation Status**

### ✅ **Completed:**
- FFmpeg.wasm integration
- Video-to-audio conversion
- File size validation
- Error handling
- Progress tracking

### 🔄 **Future Enhancements:**
- Multiple quality options
- Batch conversion
- Format selection
- Advanced settings

## 💡 **Best Practices**

### **For Users:**
1. **Use modern browsers** (Chrome/Edge)
2. **Allow time** for conversion
3. **Check file size** before upload
4. **Use stable internet** connection

### **For Developers:**
1. **Test with various file sizes**
2. **Monitor conversion performance**
3. **Provide clear error messages**
4. **Optimize for speech quality**

---

**Note**: Video-to-audio conversion eliminates the 500MB file size limit and provides better processing for speech analysis. Most sales calls will be converted to ~50MB MP3 files, making uploads fast and reliable.
