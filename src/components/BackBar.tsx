import { useApp } from '../state'
import { STRINGS } from '../lib/i18n'

// 非首頁畫面頂端的返回列：站內有上一頁就退一頁，否則回首頁；右側永遠有首頁捷徑。
// 手機用戶靠這列（與系統返回鍵）在畫面間移動，不必回頭找 header 標題。
export function BackBar() {
  const back = useApp((s) => s.back)
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const T = STRINGS[lang]
  return (
    <nav className="back-bar" aria-label={T.navLabel}>
      <button type="button" className="btn subtle back-btn" onClick={back}>
        {T.back}
      </button>
      <button type="button" className="btn subtle home-btn" onClick={() => go({ name: 'home' })}>
        {T.homeLink}
      </button>
    </nav>
  )
}
