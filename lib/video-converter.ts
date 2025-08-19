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
    
    // Convert video to MP3 audio
    console.log('🔄 Converting video to MP3...')
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vn', // No video
      '-acodec', 'mp3',
      '-ab', '128k', // 128kbps bitrate
      '-ar', '44100', // 44.1kHz sample rate
      '-ac', '2', // Stereo
      'output.mp3'
    ])
    
    // Read the converted audio file
    const audioData = await ffmpeg.readFile('output.mp3')
    
    // Create a new File object
    const audioBlob = new Blob([audioData], { type: 'audio/mp3' })
    const audioFile = new File([audioBlob], videoFile.name.replace(/\.[^/.]+$/, '.mp3'), {
      type: 'audio/mp3'
    })
    
    console.log('✅ Video to audio conversion completed!')
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
  // Convert if it's a video file larger than 50MB
  return file.type.startsWith('video/') && file.size > 50 * 1024 * 1024
}
