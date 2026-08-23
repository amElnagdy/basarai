import type { PlatformPreset } from '@/types'

export interface PresetInfo {
  width: number
  height: number
  label: string
  shortLabel: string
}

export const PLATFORM_PRESETS: Record<PlatformPreset, PresetInfo> = {
  instagram_post:       { width: 1080, height: 1080, label: 'Instagram Post', shortLabel: 'Post' },
  instagram_story:      { width: 1080, height: 1920, label: 'Instagram Story', shortLabel: 'Story' },
  instagram_reel_cover: { width: 1080, height: 1920, label: 'Instagram Reel Cover', shortLabel: 'Reel' },
  facebook_post:        { width: 1200, height:  630, label: 'Facebook Post', shortLabel: 'Post' },
  facebook_cover:       { width:  820, height:  312, label: 'Facebook Cover', shortLabel: 'Cover' },
  facebook_story:       { width: 1080, height: 1920, label: 'Facebook Story', shortLabel: 'Story' },
  twitter_post:         { width: 1200, height:  675, label: 'Twitter Post', shortLabel: 'Post' },
  twitter_header:       { width: 1500, height:  500, label: 'Twitter Header', shortLabel: 'Header' },
  linkedin_post:        { width: 1200, height:  627, label: 'LinkedIn Post', shortLabel: 'Post' },
  linkedin_banner:      { width: 1584, height:  396, label: 'LinkedIn Banner', shortLabel: 'Banner' },
  tiktok_video_cover:   { width: 1080, height: 1920, label: 'TikTok Video Cover', shortLabel: 'Cover' },
  youtube_thumbnail:    { width: 1280, height:  720, label: 'YouTube Thumbnail', shortLabel: 'Thumb' },
  youtube_banner:       { width: 2560, height: 1440, label: 'YouTube Banner', shortLabel: 'Banner' },
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export function aspectRatioLabel(width: number, height: number): string {
  const g = gcd(width, height)
  return `${width / g}:${height / g}`
}

export const PRESETS_BY_PLATFORM: Record<string, PlatformPreset[]> = {
  Instagram: ['instagram_post', 'instagram_story', 'instagram_reel_cover'],
  Facebook:  ['facebook_post', 'facebook_cover', 'facebook_story'],
  'Twitter/X': ['twitter_post', 'twitter_header'],
  LinkedIn:  ['linkedin_post', 'linkedin_banner'],
  TikTok:    ['tiktok_video_cover'],
  YouTube:   ['youtube_thumbnail', 'youtube_banner'],
}
