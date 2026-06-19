export interface Profile {
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  full_name?: string | null
  avatar_url?: string | null
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    request_id: string
  }
}

export interface Brand {
  id: string
  name: string
  logo_url: string | null
  kit_status: KitStatus
  created_at: string
  updated_at: string
}

export interface BrandListItem {
  id: string
  name: string
  logo_url: string | null
  kit_status: KitStatus
  created_at: string
}

export interface CreateBrandRequest {
  name: string
}

export interface UpdateBrandRequest {
  name: string
}

export interface LogoUploadResponse {
  logo_url: string
}

export interface ProviderKey {
  id: string
  provider: 'openai' | 'gemini'
  label: string | null
  key_hint: string | null
  is_active: boolean
  is_valid: boolean | null
  last_validated_at: string | null
  last_validation_error: string | null
  created_at: string
}

export interface AddKeyRequest {
  provider: 'openai' | 'gemini'
  key: string
  label?: string | null
  make_active?: boolean
}

export interface ValidateKeyResponse {
  valid: boolean
  validated_at: string
  error: string | null
  key_id: string
}

export type ToneOption = 'formal' | 'casual' | 'playful' | 'professional' | 'friendly'
export type KitStatus = 'not_started' | 'in_progress' | 'complete'

export interface KitAnswers {
  tagline: string | null
  tone: ToneOption | null
  audience: string | null
  colors: string[]
  avoid_words: string | null
}

export interface BrandKit {
  brand_id: string
  brand_name: string
  answers: KitAnswers
  summary: string | null
  status: KitStatus
  completed_at: string | null
  updated_at: string | null
}

export interface UpsertKitRequest {
  answers: KitAnswers
}

export type Provider = 'openai' | 'gemini'
export type LogoMode = 'none' | 'prompt' | 'watermark' | 'both'
export type GenerationStatus = 'pending' | 'processing' | 'succeeded' | 'failed'

export type PlatformPreset =
  | 'instagram_post'
  | 'instagram_story'
  | 'instagram_reel_cover'
  | 'facebook_post'
  | 'facebook_cover'
  | 'facebook_story'
  | 'twitter_post'
  | 'twitter_header'
  | 'linkedin_post'
  | 'linkedin_banner'
  | 'tiktok_video_cover'
  | 'youtube_thumbnail'
  | 'youtube_banner'

export interface GenerateRequest {
  prompt: string
  provider: Provider
  platform_preset: PlatformPreset
  logo_mode: LogoMode
}

export interface GenerationResponse {
  id: string
  prompt: string
  provider: Provider
  model: string
  platform_preset: PlatformPreset
  width: number
  height: number
  logo_mode: LogoMode
  status: GenerationStatus
  image_url: string | null
  download_filename: string | null
  error_code: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export type GenerationHistoryStatus = 'succeeded' | 'failed'

export interface GenerationHistoryItem {
  id: string
  prompt_excerpt: string
  provider: Provider
  model: string
  platform_preset: PlatformPreset
  width: number
  height: number
  logo_mode: LogoMode
  status: GenerationHistoryStatus
  image_url: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface GenerationHistoryPage {
  items: GenerationHistoryItem[]
  next_cursor: string | null
  page_size: 24
}

export interface GenerationDetail extends GenerationResponse {
  provider_request_id: string | null
}

export interface GenerationStatusBreakdown {
  pending: number
  processing: number
  succeeded: number
  failed: number
}

export interface GenerationProviderBreakdown {
  openai: number
  gemini: number
}

export interface AdminStats {
  total_accounts: number
  total_brands: number
  total_generations: number
  generations_by_status: GenerationStatusBreakdown
  generations_by_provider: GenerationProviderBreakdown
  generations_last_7d: number
  generations_last_30d: number
  brand_kits_complete: number
  active_provider_keys: number
}

export interface AdminBrandListItem {
  id: string
  name: string
  owner_user_id: string
  owner_full_name: string | null
  kit_status: string
  generation_count: number
  has_active_key: boolean
  created_at: string
}

export interface AdminBrandsPage {
  items: AdminBrandListItem[]
  page: number
  per_page: number
  total: number
}
