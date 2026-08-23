import type { ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

interface AuthShellProps {
  hero: ReactNode
  subcopy: string
  features: { icon: LucideIcon; label: string }[]
  children: ReactNode
}

export function AuthShell({ hero, subcopy, features, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section
        className="hidden flex-col justify-center gap-[18px] px-14 py-16 lg:flex"
        style={{
          background:
            'radial-gradient(130% 90% at 18% 8%, rgba(30,110,130,.42), transparent 55%), #0C1520',
        }}
      >
        <p className="flex items-baseline gap-3 text-[#F8FAFC]">
          <span className="font-display text-[40px] leading-none">Basar</span>
          <span className="font-display text-[30px] leading-none text-[#6FB2C0]">بَصَر</span>
        </p>
        <h1 className="max-w-[15ch] font-display text-[45px] leading-[1.1] text-[#F8FAFC]">
          {hero}
        </h1>
        <p className="max-w-[44ch] text-[15px] leading-[1.55] text-[#94A3B8]">{subcopy}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {features.map((feature) => (
            <li
              key={feature.label}
              className="flex items-center gap-3 whitespace-nowrap text-[12px] text-[#CBD5E1]"
            >
              <feature.icon className="h-4 w-4 shrink-0 text-[#6FB2C0]" />
              {feature.label}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[372px]">{children}</div>
      </section>
    </div>
  )
}
