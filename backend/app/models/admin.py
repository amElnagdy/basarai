from pydantic import BaseModel


class GenerationStatusBreakdown(BaseModel):
    pending: int
    processing: int
    succeeded: int
    failed: int


class GenerationProviderBreakdown(BaseModel):
    openai: int
    gemini: int


class AdminStatsResponse(BaseModel):
    total_accounts: int
    total_brands: int
    total_generations: int
    generations_by_status: GenerationStatusBreakdown
    generations_by_provider: GenerationProviderBreakdown
    generations_last_7d: int
    generations_last_30d: int
    brand_kits_complete: int
    active_provider_keys: int
