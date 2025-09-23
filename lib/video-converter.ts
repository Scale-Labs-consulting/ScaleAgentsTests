import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

export const initFFmpeg = async () => {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()

  // Load FFmpeg from CDN
  await ffmpeg.load({
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
  })

  return ffmpeg
}

export const convertVideoToAudio = async (videoFile: File): Promise<File> => {
  try {
    console.log('🎵 Starting video to audio conversion...')
    
    const ffmpeg = await initFFmpeg()
    
    // Write the video file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))
    
    // Check if it's a large file and use optimized settings
    const isLargeFile = videoFile.size > 500 * 1024 * 1024 // 500MB
    
    if (isLargeFile) {
      console.log('🔄 Converting large file with optimized settings for speed...')
      // Optimized settings for large files - faster conversion, still good quality
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vn', // No video
        '-acodec', 'mp3', // MP3 codec for better compatibility
        '-ar', '22050', // Lower sample rate for faster processing
        '-ac', '1', // Mono for faster processing
        '-b:a', '96k', // Lower bitrate for faster processing
        '-af', 'highpass=f=80,lowpass=f=8000', // Simplified filters for speed
        'output.mp3'
      ])
    } else {
      console.log('🔄 Converting video to high-quality audio...')
      // High-quality settings for smaller files
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vn', // No video
        '-acodec', 'mp3', // MP3 codec for better compatibility
        '-ar', '44100', // 44.1kHz sample rate
        '-ac', '2', // Stereo
        '-b:a', '128k', // 128kbps bitrate for good quality
        '-af', 'highpass=f=80,lowpass=f=8000,anlmdn=s=7:p=0.002:r=0.01,compand=0.3|0.3:1|1:-90/-60/-40/-30/-20/-10/-3/0:6:0:-90:0.2,volume=1.5', // Audio enhancement filters
        'output.mp3' // Use MP3 format for better compatibility
      ])
    }
    
    // Read the converted audio file
    const audioData = await ffmpeg.readFile('output.mp3')
    
    // Create a new File object with proper MP3 MIME type
    const audioBlob = new Blob([audioData], { type: 'audio/mpeg' })
    const audioFile = new File([audioBlob], videoFile.name.replace(/\.[^/.]+$/, '.mp3'), {
      type: 'audio/mpeg'
    })
    
    // Verify the file type is properly set
    console.log('🔍 Audio file details:')
    console.log('  - Name:', audioFile.name)
    console.log('  - Type:', audioFile.type)
    console.log('  - Size:', (audioFile.size / (1024 * 1024)).toFixed(2), 'MB')
    
    // Additional validation to ensure it's a proper audio file
    if (!audioFile.type.startsWith('audio/')) {
      console.warn('⚠️ Warning: File type is not audio/*, it is:', audioFile.type)
    }
    
    // Validate MP3 file headers
    const audioArrayBuffer = await audioFile.arrayBuffer()
    const header = new Uint8Array(audioArrayBuffer.slice(0, 3))
    const headerString = Array.from(header).map(b => String.fromCharCode(b)).join('')
    
    console.log('🔍 MP3 file validation:')
    console.log('  - Header starts with:', headerString)
    console.log('  - Is valid MP3:', headerString.startsWith('ID3') || headerString.startsWith('\xFF\xFB'))
    
    if (!headerString.startsWith('ID3') && !headerString.startsWith('\xFF\xFB')) {
      console.warn('⚠️ Warning: Generated file does not have proper MP3 headers')
    }
    
    console.log('✅ Video to audio conversion completed!')
    if (isLargeFile) {
      console.log('🎵 Optimized conversion for large file:')
      console.log('  - Sample rate: 22.05kHz (optimized for speed)')
      console.log('  - Channels: Mono (faster processing)')
      console.log('  - Bitrate: 96kbps (good quality, faster conversion)')
      console.log('  - Filters: Basic high-pass/low-pass (speed optimized)')
    } else {
      console.log('🎵 High-quality conversion applied:')
      console.log('  - High-pass filter: 80Hz (removes low-frequency noise)')
      console.log('  - Low-pass filter: 8000Hz (removes high-frequency noise)')
      console.log('  - Noise reduction: Advanced non-local means denoising')
      console.log('  - Dynamic range compression: Consistent audio levels')
      console.log('  - Volume boost: 1.5x for better speech clarity')
    }
    console.log('📊 File size reduction:', {
      original: `${(videoFile.size / (1024 * 1024)).toFixed(1)}MB`,
      converted: `${(audioFile.size / (1024 * 1024)).toFixed(1)}MB`,
      reduction: `${((1 - audioFile.size / videoFile.size) * 100).toFixed(1)}%`
    })
    
    return audioFile
    
  } catch (error) {
    console.error('❌ Video to audio conversion failed:', error)
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const getFileSizeReduction = (originalSize: number, convertedSize: number): string => {
  const reduction = ((originalSize - convertedSize) / originalSize) * 100
  return `${reduction.toFixed(1)}%`
}

export const shouldConvertVideo = (file: File): boolean => {
  // Convert all video files to ensure consistent high-quality audio processing
  // This ensures we always use the optimized audio settings for transcription
  return file.type.startsWith('video/')
}
