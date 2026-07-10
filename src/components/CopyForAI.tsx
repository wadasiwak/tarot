import { useState } from 'react'
import type { SpreadId } from '../content/positions'
import type { DrawnCard } from '../lib/draw'
import { buildAIPrompt } from '../lib/share'
import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'

// 「複製給 AI 深度解讀」：把牌陣結果+問題組成 prompt 進剪貼簿，貼去任意 LLM（零 API 成本）
export function CopyForAI({ spread, cards, question }: { spread: SpreadId; cards: DrawnCard[]; question?: string }) {
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildAIPrompt(spread, cards, question, lang))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // 剪貼簿權限被拒就算了
    }
  }
  return (
    <button type="button" className="btn copy-ai" onClick={copy}>
      {copied ? T.copiedAI : T.copyAI}
    </button>
  )
}
