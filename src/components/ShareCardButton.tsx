import { useState } from 'react'
import type { DrawnCard } from '../lib/draw'
import { makeShareImage, shareOrDownload } from '../lib/shareImage'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'

// 「存成圖卡」：抽牌結果生成美圖，手機開系統分享、桌機下載 PNG
export function ShareCardButton({
  title,
  subtitle,
  cards,
  positionTitles,
}: {
  title: string
  subtitle: string
  cards: DrawnCard[]
  positionTitles?: string[]
}) {
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (busy) return
    setBusy(true)
    try {
      const blob = await makeShareImage({ title, subtitle, cards, positionTitles, lang })
      await shareOrDownload(blob, `tarot-${subtitle.replaceAll('/', '-')}.png`)
    } catch {
      // 產圖失敗就算了，不擋主流程
    } finally {
      setBusy(false)
    }
  }
  return (
    <button type="button" className="btn share-image" onClick={save} disabled={busy}>
      {busy ? T.makingImage : T.saveImage}
    </button>
  )
}
