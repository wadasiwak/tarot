import { useState } from 'react'
import type { SpreadId } from '../content/positions'
import type { DrawnCard } from '../lib/draw'
import { buildAIPrompt } from '../lib/share'

// 「複製給 AI 深度解讀」：把牌陣結果+問題組成 prompt 進剪貼簿，貼去任意 LLM（零 API 成本）
export function CopyForAI({ spread, cards, question }: { spread: SpreadId; cards: DrawnCard[]; question?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildAIPrompt(spread, cards, question))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // 剪貼簿權限被拒就算了
    }
  }
  return (
    <button type="button" className="btn copy-ai" onClick={copy}>
      {copied ? '✓ 已複製，貼給你慣用的 AI 吧' : '🔮 複製給 AI 深度解讀'}
    </button>
  )
}
