import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadLang } from './lib/i18n'

// 開站就把儲存的語言偏好寫回 <html lang>——姊妹作 widget 與無障礙工具都靠它判斷語言
document.documentElement.lang = loadLang() === 'en' ? 'en' : 'zh-Hant-TW'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
