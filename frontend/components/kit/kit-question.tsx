export function KitQuestion({
  before,
  emphasis,
  after,
  helper,
}: {
  before?: string
  emphasis: string
  after?: string
  helper?: string
}) {
  return (
    <div className="space-y-2">
      <h2 className="max-w-[20ch] font-display text-[31px] leading-[1.12] text-foreground">
        {before}
        <em className="text-brand">{emphasis}</em>
        {after}
      </h2>
      {helper && (
        <p className="max-w-[56ch] text-[14px] text-muted-foreground">{helper}</p>
      )}
    </div>
  )
}
