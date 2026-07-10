import { useApp } from './state'
import { STRINGS } from './lib/i18n'
import { Home } from './components/Home'
import { Daily } from './components/Daily'
import { DrawFlow } from './components/DrawFlow'
import { ManualEntry } from './components/ManualEntry'
import { Reading } from './components/Reading'
import { Browse } from './components/Browse'
import { CardDetail } from './components/CardDetail'
import { Journal } from './components/Journal'
import { Learn } from './components/Learn'

export default function App() {
  const view = useApp((s) => s.view)
  const go = useApp((s) => s.go)
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  const T = STRINGS[lang]

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="clickable" onClick={() => go({ name: 'home' })}>
          {T.siteTitle}
        </h1>
        <span className="header-sub">{T.headerSub}</span>
        <button
          type="button"
          className="btn tab lang-toggle"
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          aria-label="switch language"
        >
          {lang === 'zh' ? 'EN' : '中'}
        </button>
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
      {view.name === 'journal' && <Journal />}
      {view.name === 'learn' && <Learn />}

      <footer className="app-footer">
        <p>{T.footerLine1}</p>
        <p>© 2026 wadasiwak. All rights reserved.</p>
      </footer>
    </div>
  )
}
