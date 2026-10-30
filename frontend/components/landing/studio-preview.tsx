'use client'

import { useState } from 'react'
import { ArrowUpRight, SlidersHorizontal } from 'lucide-react'
import styles from '@/app/landing.module.css'

const formats = {
  square: { label: 'Instagram post', size: '1080 × 1080', ratio: '1 / 1' },
  story: { label: 'Instagram story', size: '1080 × 1920', ratio: '9 / 16' },
  landscape: { label: 'LinkedIn post', size: '1200 × 627', ratio: '1200 / 627' },
}

export function StudioPreview() {
  const [brand, setBrand] = useState<'morrow' | 'sol'>('morrow')
  const [format, setFormat] = useState<keyof typeof formats>('square')
  const selected = formats[format]
  const isMorrow = brand === 'morrow'

  return (
    <div className={styles.preview} data-brand={brand}>
      <div className={styles.previewTop}><span><span className={styles.statusDot} /> A GLIMPSE OF YOUR STUDIO</span><SlidersHorizontal size={15} aria-hidden="true" /></div>
      <div className={styles.previewControls}>
        <div className={styles.brandSwitch} role="group" aria-label="Example brand">
          <button type="button" aria-pressed={isMorrow} onClick={() => setBrand('morrow')}>morrow</button>
          <button type="button" aria-pressed={!isMorrow} onClick={() => setBrand('sol')}>sol studio</button>
        </div>
        <label className={styles.formatSelect} htmlFor="preview-format"><span className={styles.srOnly}>Preview format</span><select id="preview-format" aria-label="Preview format" value={format} onChange={(e) => setFormat(e.target.value as keyof typeof formats)}>{Object.entries(formats).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
      </div>
      <div className={styles.artStage}>
        <div className={styles.artwork} data-format={format} style={{ aspectRatio: selected.ratio }}>
          <div className={styles.artBrand}>{isMorrow ? 'morrow' : 'sol studio'}<span>{isMorrow ? 'BOTANICALS, DAILY.' : 'A LITTLE SUN, EVERY DAY.'}</span></div>
          <h2 className={styles.artHeadline}>{isMorrow ? <>A softer<br />start.</> : <>Hello,<br />bright side.</>}</h2>
          <span className={styles.artCircle} />
          <svg className={styles.botanical} viewBox="0 0 300 320" fill="none" aria-hidden="true">
            <path d="M33 320C81 264 122 190 180 51M88 245C68 192 56 158 33 138M123 183C160 160 190 141 232 135M155 111C137 76 131 57 131 22" stroke="currentColor" strokeWidth="2" />
            <path d="M66 195C12 209 0 166 10 134c42 0 64 20 56 61ZM47 161C-4 144 0 112 4 96c37 6 54 27 43 65ZM113 207c14-57 57-65 81-49-20 44-42 58-81 49ZM150 135c12-55 55-61 78-47-21 40-46 52-78 47ZM161 100c-40-10-53-44-35-68 28 17 38 35 35 68ZM177 64c-3-43 21-64 49-61 5 36-14 55-49 61Z" fill="currentColor" />
          </svg>
          <div className={styles.bottle} aria-hidden="true"><div className={styles.bottleCap} /><div className={styles.bottleBody}><div className={styles.bottleLabel}><span>{isMorrow ? 'morrow' : 'sol'}</span><i />{isMorrow ? <>THE DAILY<br />BOTANICAL SERUM</> : <>A LITTLE<br />DAILY SUNSHINE</>}<small>30 ml / 1 fl oz</small></div></div></div>
          <div className={styles.artFoot}><span>{isMorrow ? 'GOOD THINGS TAKE ROOT.' : 'FIND YOUR EVERYDAY GLOW.'}</span><ArrowUpRight size={21} aria-hidden="true" /></div>
        </div>
      </div>
      <div className={styles.previewFooter}><div className={styles.previewPalette} aria-label={`${isMorrow ? 'Morrow' : 'Sol'} example palette`}><i /><i /><i /><i /></div><span aria-live="polite">{selected.size} px <span className={styles.dotDivider}>·</span> PNG</span></div>
      <p className={styles.previewCaption}>Illustrative preview. Change the brand or format to explore.</p>
    </div>
  )
}
