import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Check, Frame, History, KeyRound, Layers3, Palette } from 'lucide-react'
import { StudioPreview } from '@/components/landing/studio-preview'
import styles from './landing.module.css'

export const metadata: Metadata = {
  title: 'Basar — Make it unmistakably yours',
  description: 'Give every brand its own creative studio. Bring your identity and your OpenAI or Gemini key, then create images sized for social.',
}

function Wordmark() {
  return <span className={styles.wordmark}>
    <svg viewBox="0 0 32 32" width="27" height="27" fill="none" aria-hidden="true">
      <path d="M16 2C8 2 8 16 16 16S24 2 16 2Zm0 28c8 0 8-14 0-14S8 30 16 30ZM2 16c0 8 14 8 14 0S2 8 2 16Zm28 0c0-8-14-8-14 0s14 8 14 0Z" fill="currentColor" />
    </svg>
    Basar<span className={styles.arabicMark} lang="ar">بَصَر</span>
  </span>
}

export default async function Home() {
  const { userId } = await auth()
  const studioHref = userId ? '/brands' : '/signup'
  const studioLabel = userId ? 'Open your studio' : 'Create your studio'

  return (
    <div className={styles.landing}>
      <a className={styles.skipLink} href="#main">Skip to content</a>
      <header className={styles.header}>
        <Link href="/" aria-label="Basar home"><Wordmark /></Link>
        <nav className={styles.sectionNav} aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#inside-the-studio">The studio</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className={styles.headerActions}>
          <Link href={userId ? '/brands' : '/login'} className={`${styles.loginLink} ${userId ? styles.signedInLink : ''}`}>{userId ? 'My brands' : 'Log in'}</Link>
          <Link href={studioHref} className={styles.smallCta}>{userId ? 'Open studio' : 'Get started'}<ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.statusDot} /> A creative home for your brands</p>
            <h1 id="hero-heading">Good images.<br />Unmistakably<br /><em>your brand.</em></h1>
            <p className={styles.heroDescription}>Your colors. Your character. Your point of view.<br className={styles.desktopBreak} /> Bring them together in a brand studio that turns your ideas into images made for social.</p>
            <div className={styles.heroActions}>
              <Link href={studioHref} className={styles.primaryCta}>{studioLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
              <a href="#how-it-works" className={styles.textLink}>Take a look around<ArrowDown size={15} aria-hidden="true" /></a>
            </div>
            <p className={styles.keyNote}><KeyRound size={14} aria-hidden="true" /> Bring your own OpenAI or Gemini API key.</p>
          </div>
          <StudioPreview />
        </section>

        <div className={styles.productStrip} aria-label="Studio capabilities">
          <span>A little less starting over.<br /><strong>A little more creating.</strong></span>
          <p><Palette aria-hidden="true" /> One identity, remembered</p>
          <p><Frame aria-hidden="true" /> Sized for your platform</p>
          <p><History aria-hidden="true" /> A history worth keeping</p>
        </div>

        <section id="how-it-works" className={styles.section} aria-labelledby="process-heading">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>From identity to image</p><h2 id="process-heading">A familiar brand.<br /><em>A fresh possibility.</em></h2></div>
            <p>Set the direction once. Come back with an idea.<br />Your studio keeps the details together.</p>
          </div>
          <ol className={styles.steps}>
            <li><span className={styles.stepNumber}>01 / MAKE IT YOURS</span><div className={styles.stepVisual}><span className={styles.miniBrand}>morrow<span>BOTANICALS, DAILY.</span></span><div className={styles.swatches} aria-label="Example brand colors"><i /><i /><i /><i /></div></div><h3>Give your brand a home.</h3><p>Add a brand, upload its logo, and tell Basar about its colors, voice, and audience in a guided brand interview.</p></li>
            <li><span className={styles.stepNumber}>02 / SET THE DIRECTION</span><div className={styles.promptExample}><span>YOUR CREATIVE BRIEF</span><p>A quieter kind of morning.<br />Botanical skincare, soft light,<br />and room to breathe.</p><span><i /> OPENAI OR GEMINI</span></div><h3>Bring an idea. And your key.</h3><p>Connect your own image provider. Choose a social format and describe what you have in mind, with your brand kit as context.</p></li>
            <li><span className={styles.stepNumber}>03 / MAKE SOMETHING</span><div className={styles.formatExample} aria-hidden="true"><span /><span /><span /><Check size={15} /></div><h3>Find the right frame.</h3><p>Generate a platform-sized image, revisit it in your brand’s history, and download the finished PNG when you’re ready.</p></li>
          </ol>
        </section>

        <section id="inside-the-studio" className={styles.insideSection} aria-labelledby="inside-heading">
          <div className={styles.libraryPanel}>
            <p className={styles.eyebrow}>Different brands. Distinct worlds.</p>
            <h2 id="inside-heading">Keep every<br />identity <em>intact.</em></h2>
            <p>One place to work. A separate space for each brand’s identity, provider keys, and image history.</p>
            <div className={styles.brandLibrary} aria-label="Illustrative brand library">
              <div><span className={styles.brandMonogram}>m.</span><span><strong>Morrow Botanicals</strong><small>Grounded. Gentle. Everyday.</small></span><span className={styles.libraryPalette}><i /><i /><i /></span></div>
              <div><span className={styles.brandMonogram}>s.</span><span><strong>Sol Studio</strong><small>Warm. Playful. Full of life.</small></span><span className={styles.libraryPalette}><i /><i /><i /></span></div>
            </div>
            <small className={styles.exampleNote}>Fictional brands, shown for illustration.</small>
          </div>
          <div className={styles.featureList}>
            <div><Palette aria-hidden="true" /><h3>The details that make you, you.</h3><p>Logo, palette, audience, and tone of voice. Keep your brand kit close, so every new brief has a starting point.</p></div>
            <div><Layers3 aria-hidden="true" /><h3>One idea. The right dimensions.</h3><p>Choose presets for Instagram, Facebook, LinkedIn, and more. Square posts, stories, and covers each get their own canvas.</p></div>
            <div><History aria-hidden="true" /><h3>A creative trail to come back to.</h3><p>Your images and prompts stay in your brand’s history. Filter past work, open the details, and download it again.</p></div>
          </div>
        </section>

        <section id="questions" className={`${styles.section} ${styles.faqSection}`} aria-labelledby="faq-heading">
          <div><p className={styles.eyebrow}>Before you begin</p><h2 id="faq-heading">A few<br /><em>good questions.</em></h2></div>
          <div className={styles.faqList}>
            {[
              ['What do I need to get started?', 'Create an account and add a brand. To generate images, you’ll need your own OpenAI or Gemini API key with access to the supported image model and sufficient provider credit.'],
              ['Can I use it for more than one brand?', 'Yes. Create a separate workspace for each brand, with its own kit, logo, provider keys, and image history. Each brand belongs to your account.'],
              ['Does Basar include image-generation credits?', 'You connect your own provider account. OpenAI or Gemini charges for generation according to that account’s usage and pricing; Basar does not supply provider credits.'],
              ['What can I download?', 'Generated images are saved as PNG files in the selected social-platform dimensions. You can find and download previous images from your brand’s history.'],
            ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-heading">
          <p className={styles.eyebrow}>Your next idea starts here</p>
          <h2 id="closing-heading">Let’s make it<br /><em>feel like you.</em></h2>
          <Link href={studioHref} className={styles.lightCta}>{studioLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
          <p>Your brand. Your keys. Your creative direction.</p>
        </section>
      </main>
      <footer className={styles.footer}><Link href="/" aria-label="Basar home"><Wordmark /></Link><p>A little more vision. A lot more you.</p><a href="#main">Back to top ↑</a></footer>
    </div>
  )
}
