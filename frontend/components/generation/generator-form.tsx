'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, Sparkles } from 'lucide-react'
import { useActiveKeys } from '@/hooks/use-active-keys'
import { useGenerate } from '@/hooks/use-generate'
import { LogoModeSelector } from '@/components/generation/logo-mode-selector'
import { PresetSelector } from '@/components/generation/preset-selector'
import { PromptInput } from '@/components/generation/prompt-input'
import { ProviderSelector } from '@/components/generation/provider-selector'
import { CanvasStage } from '@/components/generation/canvas-stage'
import { ErrorMessage } from '@/components/generation/error-message'
import { Button } from '@/components/ui/button'
import { downloadImageFile } from '@/lib/download'
import { PLATFORM_PRESETS } from '@/lib/presets'
import type { LogoMode, PlatformPreset, Provider } from '@/types'

interface GeneratorFormProps {
  brandId: string
  brandName: string
  brandHasLogo: boolean
}

export function GeneratorForm({ brandId, brandName, brandHasLogo }: GeneratorFormProps) {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState<Provider>('openai')
  const [preset, setPreset] = useState<PlatformPreset>('instagram_post')
  const [logoMode, setLogoMode] = useState<LogoMode>('none')
  const [providerInitialized, setProviderInitialized] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const { activeKeys, loading: keysLoading } = useActiveKeys(brandId)
  const { state, generate, reset } = useGenerate(brandId)

  useEffect(() => {
    setProviderInitialized(false)
  }, [brandId])

  useEffect(() => {
    if (keysLoading || providerInitialized) return
    if (activeKeys.openaiActive && !activeKeys.geminiActive) {
      setProvider('openai')
    } else if (!activeKeys.openaiActive && activeKeys.geminiActive) {
      setProvider('gemini')
    } else if (activeKeys.openaiActive && activeKeys.geminiActive) {
      setProvider('gemini')
    } else {
      setProvider('openai')
    }
    setProviderInitialized(true)
  }, [keysLoading, activeKeys, providerInitialized])

  const trimmedLen = prompt.trim().length
  const submitting = state.status === 'submitting'
  const hasActiveKey =
    (provider === 'openai' && activeKeys.openaiActive) ||
    (provider === 'gemini' && activeKeys.geminiActive)
  const generateDisabled =
    submitting ||
    trimmedLen < 3 ||
    trimmedLen > 4000 ||
    !hasActiveKey

  const presetInfo = PLATFORM_PRESETS[preset]
  const canvasStatus =
    state.status === 'submitting' ? 'generating' : state.status === 'success' ? 'done' : 'empty'

  function handlePresetChange(next: PlatformPreset) {
    if (state.status === 'success') reset()
    setPreset(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (generateDisabled) return
    setDownloadError(null)
    await generate({
      prompt: prompt.trim(),
      provider,
      platform_preset: preset,
      logo_mode: logoMode,
    })
  }

  async function handleDownload() {
    if (state.status !== 'success') return
    const { result } = state
    if (!result.image_url || !result.download_filename) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadImageFile(result.image_url, result.download_filename)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const result = state.status === 'success' ? state.result : null
  const canDownload = Boolean(result?.image_url && result?.download_filename)

  return (
    <div className="grid gap-[22px] xl:grid-cols-[minmax(360px,430px)_1fr] xl:items-start">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[13px] xl:max-h-[calc(100dvh-3rem)]"
      >
        <div className="shrink-0">
          <h1 className="text-[30px] font-semibold leading-[1.16] tracking-tight">Generate</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Describe the image. Basar paints it in {brandName}&apos;s voice.
          </p>
        </div>
        <div className="shrink-0">
          <PromptInput value={prompt} onChange={setPrompt} disabled={submitting} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <PresetSelector value={preset} onChange={handlePresetChange} disabled={submitting} />
        </div>
        <div className="shrink-0 space-y-3 border-t border-border-subtle pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ProviderSelector
              value={provider}
              onChange={setProvider}
              activeKeys={activeKeys}
              brandId={brandId}
              disabled={submitting}
            />
            <LogoModeSelector
              value={logoMode}
              onChange={setLogoMode}
              brandHasLogo={brandHasLogo}
              brandId={brandId}
              disabled={submitting}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={generateDisabled}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Painting…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
          {state.status === 'error' && (
            <ErrorMessage code={state.code} message={state.message} brandId={brandId} />
          )}
        </div>
      </form>

      <div className="flex min-w-0 flex-col gap-3">
        <CanvasStage
          status={canvasStatus}
          preset={presetInfo}
          brandName={brandName}
          imageUrl={result?.image_url}
          imageAlt={result?.prompt}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[12px] text-muted-foreground">
            {presetInfo.width} × {presetInfo.height} · {presetInfo.label} · {result?.provider ?? provider}
          </p>
          <Button
            type="button"
            variant={canDownload ? 'default' : 'secondary'}
            onClick={handleDownload}
            disabled={!canDownload || downloading}
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Downloading…' : 'Download'}
          </Button>
        </div>
        {downloadError && <p className="text-[12px] text-destructive">{downloadError}</p>}
      </div>
    </div>
  )
}
