// 進行中的抽牌／手動輸入狀態暫存（sessionStorage，只在這個分頁存活）。
// 凱爾特十字選到第 9 張時手機殺掉分頁或誤觸重新整理，不用整個重來。
// 不進 URL、不進 localStorage：問題文字是個資，抽牌流程也不該跨天殘留。
const KEY = 'tarot.inflight.v1'

export interface InflightState<T> {
  kind: 'draw' | 'manual'
  spread: string
  data: T
}

export function loadInflight<T>(kind: InflightState<T>['kind'], spread: string): T | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const obj = JSON.parse(raw) as InflightState<T>
    if (!obj || obj.kind !== kind || obj.spread !== spread) return null
    return obj.data ?? null
  } catch {
    return null
  }
}

export function saveInflight<T>(kind: InflightState<T>['kind'], spread: string, data: T): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ kind, spread, data }))
  } catch {
    // 私密模式等寫入失敗就算了，只是少了續抽
  }
}

export function clearInflight(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
