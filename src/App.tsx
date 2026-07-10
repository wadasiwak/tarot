import { useApp } from './state'
import { Home } from './components/Home'
import { Daily } from './components/Daily'
import { DrawFlow } from './components/DrawFlow'
import { ManualEntry } from './components/ManualEntry'
import { Reading } from './components/Reading'
import { Browse } from './components/Browse'
import { CardDetail } from './components/CardDetail'

export default function App() {
  const view = useApp((s) => s.view)
  const go = useApp((s) => s.go)

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="clickable" onClick={() => go({ name: 'home' })}>
          日常塔羅
        </h1>
        <span className="header-sub">偉特塔羅・78 張・正逆位</span>
      </header>

      {view.name === 'home' && <Home />}
      {view.name === 'daily' && <Daily date={view.date} />}
      {view.name === 'draw' && <DrawFlow spread={view.spread} key={view.spread} />}
      {view.name === 'manual' && <ManualEntry spread={view.spread} key={view.spread} />}
      {view.name === 'reading' && (
        <Reading spread={view.spread} cards={view.cards} question={view.question} />
      )}
      {view.name === 'browse' && <Browse />}
      {view.name === 'detail' && <CardDetail id={view.id} reversed={view.reversed} />}

      <footer className="app-footer">
        <p>
          牌義解讀為本站原創整理，僅供參考與自我對話，重大決定請以自己的判斷為主；
          牌面圖像為 1909 年偉特塔羅公版掃描（Pamela Colman Smith 繪）。
        </p>
        <p>© 2026 wadasiwak. All rights reserved.</p>
      </footer>
    </div>
  )
}
