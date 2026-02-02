# Basar AI - Implementation Plan

**Version**: 1.0.0
**Date**: 2026-01-28
**Status**: Approved
**Constitution**: v1.0.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Key Decisions](#key-decisions)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Platform Presets](#platform-presets)
6. [Brand Kit Interview](#brand-kit-interview)
7. [API Endpoints](#api-endpoints)
8. [Generation Pipeline](#generation-pipeline)
9. [Hard Delete Implementation](#hard-delete-implementation)
10. [Frontend Structure](#frontend-structure)
11. [Build Order](#build-order)
12. [Environment Variables](#environment-variables)
13. [Verification Checklist](#verification-checklist)
14. [Files to Create](#files-to-create)

---

## Executive Summary

Basar AI is a multi-brand SaaS for generating social images. Users create brands, complete a brand kit interview, add their own API keys (BYOK model), and generate images for various social platforms.

### Core Product Rules

- **Tenancy**: Brand-based (every resource belongs to exactly one brand)
- **Ownership**: One user owns brands; no sharing; owner role only
- **Billing**: None in MVP; users provide their own API keys (BYOK)
- **Output**: PNG format only
- **Providers**: OpenAI and Gemini (official endpoints only)

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preset structure | Single `platform_preset` field | Simplifies schema; format is always PNG |
| Platforms | Instagram, Facebook, Twitter/X, LinkedIn, TikTok, YouTube | Covers major social networks |
| Logo usage | Per-generation choice | Flexibility: none / prompt / watermark / both |
| Image URLs | Public (unguessable UUIDs) | Simpler for MVP; UUIDs provide practical privacy |
| Brand kit | 6 questions | Minimal viable set for brand context |
| Admin | Operator-only (email allowlist) | Users manage their brands; operator monitors system |
| AI Models | OpenAI `gpt-image-1` + Gemini `gemini-3-pro-image-preview` | Latest image generation models |
| Summary derivation | Template concatenation | Deterministic, fast, no extra API costs |
| History actions | View + Delete only | MVP scope; no prompt reuse |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Bunny Magic Containers                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         ┌─────────────────────────────────┐│
│  │   Next.js 15    │  HTTP   │          FastAPI               ││
│  │   (frontend)    │ ──────► │          (backend)             ││
│  │                 │         │                                 ││
│  │  - Auth UI      │         │  - Brand CRUD                  ││
│  │  - Brand Kit    │         │  - Brand Kit                   ││
│  │  - Generator    │         │  - Key Management              ││
│  │  - History      │         │  - Generation Pipeline         ││
│  │  - Admin        │         │  - History                     ││
│  └─────────────────┘         │  - Admin                       ││
│         │                    └──────────────┬──────────────────┘│
│         │                                   │                   │
└─────────┼───────────────────────────────────┼───────────────────┘
          │                                   │
          ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Supabase                                │
├─────────────────┬─────────────────┬──────────────┬──────────────┤
│      Auth       │       DB        │    Vault     │   Storage    │
│                 │   (with RLS)    │  (secrets)   │  (images)    │
└─────────────────┴─────────────────┴──────────────┴──────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │    Provider APIs         │
                    │  - OpenAI (gpt-image-1)  │
                    │  - Gemini API            │
                    │    (gemini-3-pro-image-  │
                    │     preview)             │
                    └──────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Backend | FastAPI (Python) |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Secrets | Supabase Vault |
| Storage | Supabase Storage |
| Hosting | Bunny Magic Containers |
| Providers | OpenAI, Google Gemini API |

---

## Database Schema

### Tables

#### 1. brands

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  logo_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_brands_owner ON brands(owner_user_id);
```

#### 2. brand_kits

```sql
CREATE TABLE brand_kits (
  brand_id UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'complete')),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Answers Schema**:
```json
{
  "name": "string",
  "tagline": "string | null",
  "tone": "formal | casual | playful | professional | friendly",
  "audience": "string",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "avoid_words": "string | null"
}
```

#### 3. provider_keys

```sql
CREATE TABLE provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini')),
  vault_secret_id TEXT NOT NULL,
  label TEXT,
  last_validated_at TIMESTAMPTZ,
  last_validation_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, provider)
);

CREATE INDEX idx_provider_keys_brand ON provider_keys(brand_id);
```

#### 4. generations

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini')),
  model TEXT NOT NULL,
  platform_preset TEXT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  logo_mode TEXT NOT NULL DEFAULT 'none'
    CHECK (logo_mode IN ('none', 'prompt', 'watermark', 'both')),
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_generations_brand_created ON generations(brand_id, created_at DESC);
```

### Row Level Security (RLS)

All tables enforce brand ownership:

```sql
-- brands: direct ownership check
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY brands_select ON brands FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY brands_insert ON brands FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY brands_update ON brands FOR UPDATE
  USING (owner_user_id = auth.uid());

CREATE POLICY brands_delete ON brands FOR DELETE
  USING (owner_user_id = auth.uid());

-- brand_kits: via brand ownership
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_kits_all ON brand_kits FOR ALL
  USING (brand_id IN (SELECT id FROM brands WHERE owner_user_id = auth.uid()));

-- provider_keys: via brand ownership
ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY provider_keys_all ON provider_keys FOR ALL
  USING (brand_id IN (SELECT id FROM brands WHERE owner_user_id = auth.uid()));

-- generations: via brand ownership
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY generations_all ON generations FOR ALL
  USING (brand_id IN (SELECT id FROM brands WHERE owner_user_id = auth.uid()));
```

### Storage

- **Bucket**: `brand-assets` (public)
- **Paths**:
  - `brands/{brandId}/logo.png` - Brand logo
  - `brands/{brandId}/generations/{generationId}.png` - Generated images

---

## Platform Presets

```typescript
export const PLATFORM_PRESETS = {
  // Instagram
  instagram_post: { width: 1080, height: 1080, label: 'Instagram Post' },
  instagram_story: { width: 1080, height: 1920, label: 'Instagram Story' },
  instagram_reel_cover: { width: 1080, height: 1920, label: 'Instagram Reel Cover' },

  // Facebook
  facebook_post: { width: 1200, height: 630, label: 'Facebook Post' },
  facebook_cover: { width: 820, height: 312, label: 'Facebook Cover' },
  facebook_story: { width: 1080, height: 1920, label: 'Facebook Story' },

  // Twitter/X
  twitter_post: { width: 1200, height: 675, label: 'Twitter Post' },
  twitter_header: { width: 1500, height: 500, label: 'Twitter Header' },

  // LinkedIn
  linkedin_post: { width: 1200, height: 627, label: 'LinkedIn Post' },
  linkedin_banner: { width: 1584, height: 396, label: 'LinkedIn Banner' },

  // TikTok
  tiktok_video_cover: { width: 1080, height: 1920, label: 'TikTok Video Cover' },

  // YouTube
  youtube_thumbnail: { width: 1280, height: 720, label: 'YouTube Thumbnail' },
  youtube_banner: { width: 2560, height: 1440, label: 'YouTube Banner' },
} as const;

export type PlatformPreset = keyof typeof PLATFORM_PRESETS;
```

### Grouped by Platform (for UI)

```typescript
export const PRESETS_BY_PLATFORM = {
  instagram: ['instagram_post', 'instagram_story', 'instagram_reel_cover'],
  facebook: ['facebook_post', 'facebook_cover', 'facebook_story'],
  twitter: ['twitter_post', 'twitter_header'],
  linkedin: ['linkedin_post', 'linkedin_banner'],
  tiktok: ['tiktok_video_cover'],
  youtube: ['youtube_thumbnail', 'youtube_banner'],
} as const;
```

### Aspect Ratio Mapping (for Gemini)

Gemini API requires `aspect_ratio` instead of explicit width/height. Map presets to closest supported ratio:

```typescript
export const PRESET_TO_ASPECT_RATIO: Record<PlatformPreset, string> = {
  // 1:1
  instagram_post: '1:1',

  // 9:16 (vertical)
  instagram_story: '9:16',
  instagram_reel_cover: '9:16',
  facebook_story: '9:16',
  tiktok_video_cover: '9:16',

  // 16:9 (horizontal)
  facebook_post: '16:9',
  twitter_post: '16:9',
  linkedin_post: '16:9',
  youtube_thumbnail: '16:9',

  // 3:1 (wide banners - use 16:9 and crop)
  twitter_header: '16:9',
  facebook_cover: '16:9',
  linkedin_banner: '16:9',
  youtube_banner: '16:9',
};
```

---

## Brand Kit Interview

### Questions (6 Standard Set)

| # | Field | Question | Type | Required |
|---|-------|----------|------|----------|
| 1 | `name` | What is your brand name? | text | Yes |
| 2 | `tagline` | What is your brand's tagline or slogan? | text | No |
| 3 | `tone` | What tone should your content have? | select | Yes |
| 4 | `audience` | Who is your target audience? | text | Yes |
| 5 | `colors` | What are your brand's primary colors? | color picker (up to 3) | Yes |
| 6 | `avoid_words` | Are there any words or themes to avoid? | text | No |

### Tone Options

- `formal` - Professional and business-like
- `casual` - Relaxed and conversational
- `playful` - Fun and lighthearted
- `professional` - Expert and authoritative
- `friendly` - Warm and approachable

### Summary Derivation Template

```python
def derive_summary(answers: dict) -> str:
    """Generate brand context summary from interview answers."""
    lines = [
        f"Brand: {answers['name']}",
        f"Tagline: {answers.get('tagline') or 'None specified'}",
        f"Tone: {answers['tone']}",
        f"Audience: {answers['audience']}",
        f"Colors: {', '.join(answers['colors'])}",
        f"Avoid: {answers.get('avoid_words') or 'None specified'}",
    ]
    return '\n'.join(lines)
```

### Status Transitions

```
not_started → in_progress → complete
     │              │
     └──────────────┘ (can go back to edit)
```

- `not_started`: No answers saved yet
- `in_progress`: Some answers saved, not all required fields complete
- `complete`: All required fields have values

---

## API Endpoints

### Authentication

All endpoints (except `/health`) require a valid Supabase JWT in the `Authorization` header.

```
Authorization: Bearer <supabase_access_token>
```

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "request_id": "uuid"
  }
}
```

### Endpoints

#### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (no auth) |

#### Brands

| Method | Path | Description |
|--------|------|-------------|
| GET | `/brands` | List user's brands |
| POST | `/brands` | Create a new brand |
| GET | `/brands/{id}` | Get brand details |
| DELETE | `/brands/{id}` | Hard delete brand (cascades) |
| POST | `/brands/{id}/logo` | Upload brand logo |
| DELETE | `/brands/{id}/logo` | Delete brand logo |

**Create Brand Request**:
```json
{
  "name": "My Brand"
}
```

**Brand Response**:
```json
{
  "id": "uuid",
  "name": "My Brand",
  "logo_url": "https://...",
  "kit_status": "not_started",
  "created_at": "2026-01-28T00:00:00Z"
}
```

#### Brand Kit

| Method | Path | Description |
|--------|------|-------------|
| GET | `/brands/{id}/kit` | Get brand kit |
| PUT | `/brands/{id}/kit` | Upsert brand kit answers |

**Upsert Kit Request**:
```json
{
  "answers": {
    "name": "My Brand",
    "tagline": "Innovation for everyone",
    "tone": "professional",
    "audience": "Small business owners aged 25-45",
    "colors": ["#FF5733", "#3498DB", "#2ECC71"],
    "avoid_words": "cheap, discount, budget"
  }
}
```

**Kit Response**:
```json
{
  "brand_id": "uuid",
  "answers": { ... },
  "summary": "Brand: My Brand\nTagline: Innovation for everyone\n...",
  "status": "complete",
  "updated_at": "2026-01-28T00:00:00Z"
}
```

#### Provider Keys

| Method | Path | Description |
|--------|------|-------------|
| GET | `/brands/{id}/keys` | List keys for brand |
| POST | `/brands/{id}/keys` | Add a provider key |
| POST | `/brands/{id}/keys/{keyId}/validate` | Validate a key |
| DELETE | `/brands/{id}/keys/{keyId}` | Delete a key |

**Add Key Request**:
```json
{
  "provider": "openai",
  "key": "sk-...",
  "label": "Production Key"
}
```

**Key Response** (key value never returned):
```json
{
  "id": "uuid",
  "provider": "openai",
  "label": "Production Key",
  "last_validated_at": "2026-01-28T00:00:00Z",
  "last_validation_error": null,
  "created_at": "2026-01-28T00:00:00Z"
}
```

**Validate Response**:
```json
{
  "valid": true,
  "validated_at": "2026-01-28T00:00:00Z",
  "error": null
}
```

#### Generations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/brands/{id}/generate` | Generate an image |
| GET | `/brands/{id}/generations` | List generations |
| GET | `/brands/{id}/generations/{genId}` | Get generation details |
| DELETE | `/brands/{id}/generations/{genId}` | Hard delete generation |

**Generate Request**:
```json
{
  "prompt": "A modern office space with natural lighting",
  "provider": "openai",
  "model": "gpt-image-1",
  "platform_preset": "instagram_post",
  "logo_mode": "watermark"
}
```

**Generate Response**:
```json
{
  "id": "uuid",
  "prompt": "A modern office space with natural lighting",
  "provider": "openai",
  "model": "gpt-image-1",
  "platform_preset": "instagram_post",
  "width": 1080,
  "height": 1080,
  "logo_mode": "watermark",
  "image_url": "https://...",
  "created_at": "2026-01-28T00:00:00Z"
}
```

**List Generations Query Params**:
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `provider` (optional filter: `openai` | `gemini`)

#### Admin (Operator Only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/brands` | List all brands with counts |
| GET | `/admin/stats` | Basic usage statistics |

Gated by `ADMIN_EMAILS` environment variable.

---

## Generation Pipeline

```python
async def generate_image(
    brand_id: UUID,
    request: GenerateRequest,
    current_user: User
) -> GenerationResponse:
    """
    Generate an image for a brand.

    Steps:
    1. Verify brand ownership (server-side)
    2. Get brand kit summary (if exists)
    3. Resolve dimensions from preset
    4. Fetch provider key from Vault
    5. Build full prompt (kit summary + user prompt + logo instruction)
    6. Call provider API (with provider-specific handling)
    7. Post-process image (resize/crop to exact preset dimensions)
    8. Apply logo watermark (if requested)
    9. Store PNG to Supabase Storage
    10. Insert generation record
    11. Return generation with public URL
    """

    # 1. Verify ownership
    brand = await get_brand_with_ownership_check(brand_id, current_user.id)
    if not brand:
        raise HTTPException(404, "Brand not found")

    # 2. Get brand kit
    kit = await get_brand_kit(brand_id)

    # 3. Build full prompt
    prompt_parts = []
    if kit and kit.summary:
        prompt_parts.append(f"Brand Context:\n{kit.summary}")

    if request.logo_mode in ('prompt', 'both') and brand.logo_path:
        prompt_parts.append("Incorporate the brand logo naturally into the image.")

    prompt_parts.append(f"Image Request:\n{request.prompt}")
    full_prompt = "\n\n".join(prompt_parts)

    # 4. Resolve preset dimensions
    preset = PLATFORM_PRESETS[request.platform_preset]
    target_width = preset['width']
    target_height = preset['height']

    # 5. Fetch key from Vault
    key = await get_provider_key(brand_id, request.provider)
    if not key:
        raise HTTPException(400, f"No {request.provider} key configured for this brand")

    api_key = await vault.get_secret(key.vault_secret_id)

    # 6. Call provider
    if request.provider == 'openai':
        image_bytes = await openai_generate(
            api_key=api_key,
            prompt=full_prompt,
            width=target_width,
            height=target_height,
            model=request.model or 'gpt-image-1'
        )
    else:
        # Gemini requires aspect_ratio and image_size, not width/height
        aspect_ratio = PRESET_TO_ASPECT_RATIO[request.platform_preset]
        image_bytes = await gemini_generate(
            api_key=api_key,
            prompt=full_prompt,
            aspect_ratio=aspect_ratio,
            image_size='1K',  # Default for MVP; can be '2K' or '4K' later
            model=request.model or 'gemini-3-pro-image-preview'
        )

    # 7. Post-process: resize/crop to exact preset dimensions
    # Gemini returns fixed resolutions per aspect_ratio/size combo,
    # so we must resize/crop to match the exact preset dimensions.
    image_bytes = resize_to_preset(image_bytes, target_width, target_height)

    # 8. Apply watermark if requested
    if request.logo_mode in ('watermark', 'both') and brand.logo_path:
        logo_bytes = await storage.download(brand.logo_path)
        image_bytes = apply_watermark(image_bytes, logo_bytes)

    # 9. Store to Supabase Storage
    generation_id = uuid4()
    image_path = f"brands/{brand_id}/generations/{generation_id}.png"
    await storage.upload(image_path, image_bytes, content_type='image/png')

    # 10. Insert record (store final dimensions after post-processing)
    generation = await db.insert(generations).values(
        id=generation_id,
        brand_id=brand_id,
        prompt=request.prompt,  # Store original, not full
        provider=request.provider,
        model=request.model,
        platform_preset=request.platform_preset,
        width=target_width,
        height=target_height,
        logo_mode=request.logo_mode,
        image_path=image_path
    ).returning()

    # 11. Return response
    return GenerationResponse(
        id=generation.id,
        prompt=generation.prompt,
        provider=generation.provider,
        model=generation.model,
        platform_preset=generation.platform_preset,
        width=generation.width,
        height=generation.height,
        logo_mode=generation.logo_mode,
        image_url=storage.get_public_url(image_path),
        created_at=generation.created_at
    )
```

### Provider Integration

#### OpenAI (gpt-image-1)

```python
async def openai_generate(
    api_key: str,
    prompt: str,
    width: int,
    height: int,
    model: str = 'gpt-image-1'
) -> bytes:
    """Generate image using OpenAI API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://api.openai.com/v1/images/generations',
            headers={'Authorization': f'Bearer {api_key}'},
            json={
                'model': model,
                'prompt': prompt,
                'size': f'{width}x{height}',
                'response_format': 'b64_json',
                'n': 1
            },
            timeout=120.0
        )
        response.raise_for_status()
        data = response.json()
        return base64.b64decode(data['data'][0]['b64_json'])
```

#### Gemini (Nano Banana Pro) via Google Gen AI SDK

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
**Auth**: `x-goog-api-key: <GEMINI_API_KEY>`
**Python SDK**: `google-genai` (import as `from google import genai`)

**Gemini Image Generation Constraints**:
- Uses `aspect_ratio` (e.g., `'1:1'`, `'16:9'`, `'9:16'`) instead of explicit width/height
- Uses `image_size`: `'1K'`, `'2K'`, or `'4K'` for Nano Banana Pro
- Returns fixed resolutions based on aspect_ratio + image_size combination
- Post-processing required to achieve exact preset dimensions

```python
from google import genai
from google.genai import types
import base64

async def gemini_generate(
    api_key: str,
    prompt: str,
    aspect_ratio: str,
    image_size: str = '1K',
    model: str = 'gemini-3-pro-image-preview'
) -> bytes:
    """
    Generate image using Gemini API via Google Gen AI SDK.

    Args:
        api_key: Gemini API key
        prompt: Full prompt including brand context
        aspect_ratio: One of '1:1', '16:9', '9:16', '4:3', '3:4'
        image_size: '1K', '2K', or '4K' (default '1K' for MVP)
        model: Model ID (default 'gemini-3-pro-image-preview')

    Returns:
        PNG image bytes
    """
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model,
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_modalities=['Image'],
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=image_size,
            ),
        ),
    )

    # Extract image data from response
    # Response structure: response.candidates[0].content.parts[0].inline_data
    for part in response.candidates[0].content.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
            return base64.b64decode(part.inline_data.data)

    raise ValueError("No image data in Gemini response")
```

### Post-Processing: Resize to Preset Dimensions

Because Gemini returns fixed resolutions per aspect ratio/size combination (not arbitrary dimensions), we must resize or crop the output to match the exact preset dimensions.

```python
from PIL import Image
import io

def resize_to_preset(
    image_bytes: bytes,
    target_width: int,
    target_height: int
) -> bytes:
    """
    Resize/crop image to exact preset dimensions.

    Strategy:
    1. Scale image to cover target dimensions (maintain aspect ratio)
    2. Center-crop to exact target size

    Args:
        image_bytes: Raw PNG bytes from provider
        target_width: Exact width required by preset
        target_height: Exact height required by preset

    Returns:
        PNG bytes at exact target dimensions
    """
    image = Image.open(io.BytesIO(image_bytes))
    img_width, img_height = image.size

    # Calculate scale factor to cover target (not fit)
    scale = max(target_width / img_width, target_height / img_height)

    # Resize to cover
    new_width = int(img_width * scale)
    new_height = int(img_height * scale)
    image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Center crop to exact target
    left = (new_width - target_width) // 2
    top = (new_height - target_height) // 2
    right = left + target_width
    bottom = top + target_height
    image = image.crop((left, top, right, bottom))

    # Convert back to PNG bytes
    output = io.BytesIO()
    image.save(output, format='PNG')
    return output.getvalue()
```

### Watermark Application

```python
from PIL import Image
import io

def apply_watermark(
    image_bytes: bytes,
    logo_bytes: bytes,
    position: str = 'bottom_right',
    opacity: float = 0.7,
    scale: float = 0.15
) -> bytes:
    """Apply logo watermark to generated image."""
    image = Image.open(io.BytesIO(image_bytes)).convert('RGBA')
    logo = Image.open(io.BytesIO(logo_bytes)).convert('RGBA')

    # Scale logo
    logo_width = int(image.width * scale)
    logo_height = int(logo.height * (logo_width / logo.width))
    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

    # Apply opacity
    logo.putalpha(Image.eval(logo.split()[3], lambda x: int(x * opacity)))

    # Position
    margin = 20
    if position == 'bottom_right':
        x = image.width - logo_width - margin
        y = image.height - logo_height - margin
    elif position == 'bottom_left':
        x = margin
        y = image.height - logo_height - margin
    # ... other positions

    # Composite
    image.paste(logo, (x, y), logo)

    # Convert back to PNG bytes
    output = io.BytesIO()
    image.convert('RGB').save(output, format='PNG')
    return output.getvalue()
```

---

## Hard Delete Implementation

### Constitution Requirement

> **Hard Delete**: When a user deletes a brand or generation, the system MUST remove both database rows AND stored assets; soft delete is forbidden.

### Delete Generation

```python
async def delete_generation(
    brand_id: UUID,
    generation_id: UUID,
    current_user: User
) -> None:
    """Hard delete a generation."""
    # Verify ownership
    generation = await get_generation_with_ownership_check(
        brand_id, generation_id, current_user.id
    )
    if not generation:
        raise HTTPException(404, "Generation not found")

    # 1. Delete from storage
    await storage.delete(generation.image_path)

    # 2. Delete DB row
    await db.delete(generations).where(generations.c.id == generation_id)
```

### Delete Brand (Cascade)

```python
async def delete_brand(
    brand_id: UUID,
    current_user: User
) -> None:
    """Hard delete a brand and all related resources."""
    # Verify ownership
    brand = await get_brand_with_ownership_check(brand_id, current_user.id)
    if not brand:
        raise HTTPException(404, "Brand not found")

    # 1. Get all generation paths
    generations = await db.select(
        generations.c.image_path
    ).where(generations.c.brand_id == brand_id)

    # 2. Delete all generation images from storage
    for gen in generations:
        try:
            await storage.delete(gen.image_path)
        except Exception as e:
            logger.warning(f"Failed to delete {gen.image_path}: {e}")

    # 3. Delete brand logo if exists
    if brand.logo_path:
        try:
            await storage.delete(brand.logo_path)
        except Exception as e:
            logger.warning(f"Failed to delete logo {brand.logo_path}: {e}")

    # 4. Get all provider keys
    keys = await db.select(
        provider_keys.c.vault_secret_id
    ).where(provider_keys.c.brand_id == brand_id)

    # 5. Delete secrets from Vault
    for key in keys:
        try:
            await vault.delete_secret(key.vault_secret_id)
        except Exception as e:
            logger.warning(f"Failed to delete vault secret: {e}")

    # 6. Delete brand row (cascades brand_kits, provider_keys, generations)
    await db.delete(brands).where(brands.c.id == brand_id)
```

---

## Frontend Structure

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page (redirect to login or dashboard)
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth layout (no nav)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout (nav, brand selector)
│   │   ├── brands/
│   │   │   ├── page.tsx            # Brand list
│   │   │   └── new/
│   │   │       └── page.tsx        # Create brand form
│   │   └── [brandId]/
│   │       ├── layout.tsx          # Brand-specific layout
│   │       ├── page.tsx            # Generator (main view)
│   │       ├── kit/
│   │       │   └── page.tsx        # Brand kit interview wizard
│   │       ├── keys/
│   │       │   └── page.tsx        # Provider keys management
│   │       ├── history/
│   │       │   └── page.tsx        # Generation history
│   │       └── settings/
│   │           └── page.tsx        # Brand settings, delete
│   └── admin/
│       ├── layout.tsx              # Admin layout (gated)
│       └── page.tsx                # Admin dashboard
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── brand-selector.tsx
│   ├── generator/
│   │   ├── generator-form.tsx
│   │   ├── preset-selector.tsx
│   │   ├── provider-selector.tsx
│   │   ├── logo-mode-selector.tsx
│   │   └── result-preview.tsx
│   ├── kit-wizard/
│   │   ├── wizard-container.tsx
│   │   ├── step-name.tsx
│   │   ├── step-tagline.tsx
│   │   ├── step-tone.tsx
│   │   ├── step-audience.tsx
│   │   ├── step-colors.tsx
│   │   └── step-avoid.tsx
│   ├── history/
│   │   ├── history-list.tsx
│   │   ├── history-card.tsx
│   │   └── image-modal.tsx
│   ├── keys/
│   │   ├── keys-tabs.tsx
│   │   ├── key-card.tsx
│   │   └── add-key-modal.tsx
│   └── brand/
│       ├── brand-card.tsx
│       ├── create-brand-modal.tsx
│       └── delete-brand-dialog.tsx
├── lib/
│   ├── api.ts                      # API client (fetch wrapper)
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client
│   ├── presets.ts                  # Platform presets
│   └── utils.ts                    # Utility functions
├── hooks/
│   ├── use-brand.ts
│   ├── use-brands.ts
│   ├── use-generations.ts
│   └── use-kit.ts
├── types/
│   └── index.ts                    # TypeScript types
└── middleware.ts                   # Auth middleware
```

### Key UI Components

#### Generator Form

- Provider selector (OpenAI / Gemini)
- Model selector (based on provider)
- Platform preset selector (grouped by platform)
- Prompt textarea
- Logo mode selector (none / prompt / watermark / both)
- Generate button
- Result preview with download

#### Brand Kit Wizard

- Step indicator (1-6)
- Form for current step
- Previous / Next / Skip buttons
- Auto-save on step completion
- Completion summary

#### History List

- Card grid with thumbnails
- Provider and platform badges
- Date display
- Click to view full image
- Delete button with confirmation

---

## Build Order

### Phase 1: Foundation

| Task | Description |
|------|-------------|
| 1.1 | Create repo structure (`frontend/`, `backend/`, `supabase/`) |
| 1.2 | Initialize Supabase project |
| 1.3 | Create database schema (all 4 tables) |
| 1.4 | Add RLS policies |
| 1.5 | Create storage bucket `brand-assets` |
| 1.6 | Initialize FastAPI project with dependencies |
| 1.7 | Add auth middleware (JWT verification) |
| 1.8 | Add health endpoint |
| 1.9 | Initialize Next.js 15 project |
| 1.10 | Configure Supabase auth |
| 1.11 | Add auth pages (login, signup) |
| 1.12 | Add protected route middleware |

**Checkpoint**: Both services run locally, auth works end-to-end.

### Phase 2: Brand CRUD

| Task | Description |
|------|-------------|
| 2.1 | API: List brands endpoint |
| 2.2 | API: Create brand endpoint |
| 2.3 | API: Get brand endpoint |
| 2.4 | API: Delete brand endpoint (with hard delete) |
| 2.5 | API: Logo upload endpoint |
| 2.6 | API: Logo delete endpoint |
| 2.7 | UI: Brand list page |
| 2.8 | UI: Create brand modal |
| 2.9 | UI: Brand selector in nav |
| 2.10 | UI: Brand settings page |
| 2.11 | UI: Delete brand confirmation (type name) |

**Checkpoint**: User can create, view, and delete brands. Hard delete verified.

### Phase 3: Provider Keys

| Task | Description |
|------|-------------|
| 3.1 | API: List keys endpoint |
| 3.2 | API: Add key endpoint (Vault integration) |
| 3.3 | API: Validate key endpoint (OpenAI) |
| 3.4 | API: Validate key endpoint (Gemini) |
| 3.5 | API: Delete key endpoint (Vault + DB) |
| 3.6 | UI: Keys page with tabs |
| 3.7 | UI: Add key modal |
| 3.8 | UI: Key card with validate button |
| 3.9 | UI: Validation status display |

**Checkpoint**: User can add, validate, and delete API keys. Keys never exposed to client.

### Phase 4: Brand Kit

| Task | Description |
|------|-------------|
| 4.1 | API: Get kit endpoint |
| 4.2 | API: Upsert kit endpoint |
| 4.3 | API: Summary derivation logic |
| 4.4 | UI: Wizard container |
| 4.5 | UI: Step 1 - Name |
| 4.6 | UI: Step 2 - Tagline |
| 4.7 | UI: Step 3 - Tone |
| 4.8 | UI: Step 4 - Audience |
| 4.9 | UI: Step 5 - Colors |
| 4.10 | UI: Step 6 - Avoid words |
| 4.11 | UI: Completion summary |
| 4.12 | UI: Status badge in nav |

**Checkpoint**: User can complete brand kit interview. Works with 0 answers and complete kit.

### Phase 5: Generation

| Task | Description |
|------|-------------|
| 5.1 | API: Generation pipeline skeleton |
| 5.2 | API: OpenAI integration |
| 5.3 | API: Gemini integration (with aspect_ratio mapping) |
| 5.4 | API: Post-processing resize/crop logic |
| 5.5 | API: Logo watermark logic |
| 5.6 | API: Generate endpoint |
| 5.7 | UI: Generator form |
| 5.8 | UI: Preset selector (grouped by platform) |
| 5.9 | UI: Provider/model selector |
| 5.10 | UI: Logo mode selector |
| 5.11 | UI: Result preview |
| 5.12 | UI: Download button |

**Checkpoint**: User can generate images with both providers, all presets, all logo modes.

### Phase 6: History

| Task | Description |
|------|-------------|
| 6.1 | API: List generations endpoint (pagination, filter) |
| 6.2 | API: Get generation endpoint |
| 6.3 | API: Delete generation endpoint (hard delete) |
| 6.4 | UI: History list page |
| 6.5 | UI: History card component |
| 6.6 | UI: Full image modal |
| 6.7 | UI: Delete confirmation |
| 6.8 | UI: Provider filter |

**Checkpoint**: User can view and delete history. Hard delete verified.

### Phase 7: Admin + Polish

| Task | Description |
|------|-------------|
| 7.1 | API: Admin brands endpoint |
| 7.2 | API: Admin stats endpoint |
| 7.3 | API: Admin gate (email allowlist) |
| 7.4 | UI: Admin page |
| 7.5 | Error handling polish |
| 7.6 | Loading states |
| 7.7 | Empty states |
| 7.8 | Definition of Done verification |

**Checkpoint**: All features complete. Definition of Done verified.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

```bash
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Storage
STORAGE_BUCKET=brand-assets

# Admin
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Server
HOST=0.0.0.0
PORT=8000
```

### Production Notes

- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side
- Never expose service role key to frontend
- `ADMIN_EMAILS` controls operator access

---

## Verification Checklist

### Definition of Done (per feature)

- [ ] Works for brand with 0 brand kit answers
- [ ] Works for brand with complete brand kit
- [ ] Works with OpenAI provider
- [ ] Works with Gemini provider
- [ ] RLS policies tested (query as different user fails)
- [ ] Hard delete verified (DB rows AND storage assets removed)

### Security Verification

- [ ] Provider keys never appear in:
  - [ ] API responses
  - [ ] Frontend state
  - [ ] Browser network tab
  - [ ] Server logs
- [ ] Brand isolation:
  - [ ] User A cannot access User B's brands
  - [ ] User A cannot access User B's generations
  - [ ] User A cannot access User B's keys
- [ ] Server-side validation:
  - [ ] Brand ID verified for all operations
  - [ ] User cannot forge brand ownership
- [ ] Public URLs are shareable. Brand isolation is enforced at DB and API layers. Storage privacy is deferred.

### RLS Test Cases

```sql
-- Test as User A (should see their brands)
SET request.jwt.claims = '{"sub": "user-a-id"}';
SELECT * FROM brands; -- Should return User A's brands

-- Test as User B (should NOT see User A's brands)
SET request.jwt.claims = '{"sub": "user-b-id"}';
SELECT * FROM brands WHERE id = 'user-a-brand-id'; -- Should return 0 rows
```

---

## Files to Create

### Backend (`backend/`)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app, CORS, routers
│   ├── config.py                   # Settings from env
│   ├── auth.py                     # JWT middleware
│   ├── models/
│   │   ├── __init__.py
│   │   ├── brand.py
│   │   ├── kit.py
│   │   ├── key.py
│   │   └── generation.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── brands.py
│   │   ├── kit.py
│   │   ├── keys.py
│   │   ├── generations.py
│   │   └── admin.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── storage.py              # Supabase Storage
│   │   ├── vault.py                # Supabase Vault
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── openai.py
│   │   │   └── gemini.py           # Uses google-genai SDK
│   │   ├── postprocess.py          # Resize/crop to preset dimensions
│   │   └── watermark.py
│   └── presets.py                  # Platform presets + aspect ratio mapping
├── requirements.txt
├── Dockerfile
└── .env.example
```

### Frontend (`frontend/`)

```
frontend/
├── app/                            # (structure shown above)
├── components/                     # (structure shown above)
├── lib/                            # (structure shown above)
├── hooks/                          # (structure shown above)
├── types/
│   └── index.ts
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── middleware.ts
├── .env.local.example
└── Dockerfile
```

### Supabase (`supabase/`)

```
supabase/
├── migrations/
│   ├── 00001_create_brands.sql
│   ├── 00002_create_brand_kits.sql
│   ├── 00003_create_provider_keys.sql
│   ├── 00004_create_generations.sql
│   └── 00005_add_rls_policies.sql
├── seed.sql                        # (optional test data)
└── config.toml
```

---

## Appendix: Model Reference

### OpenAI Image Models

| Model | Description |
|-------|-------------|
| `gpt-image-1` | Latest image generation model (default) |
| `dall-e-3` | Previous generation (fallback) |

### Gemini Image Models

| Model | Description |
|-------|-------------|
| `gemini-3-pro-image-preview` | Nano Banana Pro - highest quality (default) |

### Gemini Aspect Ratios and Sizes

Gemini image generation uses `aspect_ratio` and `image_size` instead of explicit dimensions:

| Aspect Ratio | Supported |
|--------------|-----------|
| `1:1` | Square |
| `16:9` | Landscape |
| `9:16` | Portrait |
| `4:3` | Standard landscape |
| `3:4` | Standard portrait |

| Image Size | Resolution Range |
|------------|------------------|
| `1K` | ~1024px on longest edge (default for MVP) |
| `2K` | ~2048px on longest edge |
| `4K` | ~4096px on longest edge |

Post-processing (resize/crop via Pillow) is required to achieve exact preset dimensions.

---

*End of Implementation Plan*