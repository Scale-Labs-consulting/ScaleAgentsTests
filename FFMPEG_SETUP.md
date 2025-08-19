# FFmpeg Setup Guide

## What is FFmpeg?
FFmpeg is a powerful multimedia framework that we use to convert video files to audio format, which significantly reduces file size and allows us to process much larger video files.

## Installation Instructions

### Windows
1. **Download FFmpeg:**
   - Go to https://ffmpeg.org/download.html
   - Click "Windows Builds" 
   - Download the latest release (choose "essentials" build)

2. **Install:**
   - Extract the downloaded zip file
   - Copy the extracted folder to `C:\ffmpeg`
   - Add `C:\ffmpeg\bin` to your system PATH

3. **Verify Installation:**
   ```bash
   ffmpeg -version
   ```

### macOS
1. **Using Homebrew (Recommended):**
   ```bash
   brew install ffmpeg
   ```

2. **Manual Installation:**
   - Download from https://ffmpeg.org/download.html
   - Extract and add to PATH

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### Linux (CentOS/RHEL)
```bash
sudo yum install ffmpeg
```

## Verify Installation
After installation, run this command to verify FFmpeg is working:
```bash
ffmpeg -version
```

You should see output like:
```
ffmpeg version 4.4.2 Copyright (c) 2000-2021 the FFmpeg developers
...
```

## How It Works in Our App
1. **Video Upload:** User uploads any video file (MP4, MOV, AVI, etc.)
2. **Audio Extraction:** FFmpeg converts video to MP3 audio (much smaller)
3. **Chunking:** If audio is still > 25MB, we split it into 20MB chunks
4. **Transcription:** Each chunk is sent to OpenAI Whisper
5. **Combination:** All transcriptions are combined into final result

## Benefits
- **No 25MB limit:** Can handle videos up to 500MB+
- **Better quality:** Audio-only processing is more reliable
- **Faster processing:** Smaller files upload faster
- **Universal support:** Works with any video format

## Troubleshooting
If you get "FFmpeg not found" errors:
1. Make sure FFmpeg is installed
2. Verify it's in your system PATH
3. Restart your development server
4. Check the console for detailed error messages
