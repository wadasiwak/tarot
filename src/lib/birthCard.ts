// 塔羅數字學：生日牌／年度牌。
// 採最通行的「數字總和迭代縮減」算法（Birth Card digit-sum 變體）：
//   把西元年月日的每一個數字相加，總和 >22 就再把各位數字相加，
//   直到落在 1–22；1–21 對應同編號大牌，22 對應 0 號愚者。
//   例：1990-07-23 → 1+9+9+0+0+7+2+3=31 → 3+1=4 → 皇帝。
// 年度牌：生日的月、日 ＋ 當年年份，同法縮減（流派間或有出入，UI 有註明）。
// 回傳值 = 大牌編號 0–21，恰等於 registry index（major 佔 index 0–21）。

function digitSum(n: number): number {
  let s = 0
  for (const ch of String(n)) s += Number(ch)
  return s
}

export function reduceToMajor(sum: number): number {
  let n = sum
  while (n > 22) n = digitSum(n)
  return n === 22 ? 0 : n
}

export function birthCardNumber(year: number, month: number, day: number): number {
  return reduceToMajor(digitSum(year) + digitSum(month) + digitSum(day))
}

export function yearCardNumber(month: number, day: number, year: number): number {
  return reduceToMajor(digitSum(month) + digitSum(day) + digitSum(year))
}

// YYYY-MM-DD → [y, m, d]；不合法回 null
export function parseBirthday(s: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(`${s}T00:00:00`)
  if (Number.isNaN(dt.getTime()) || dt.getMonth() + 1 !== mo || dt.getDate() !== d) return null
  if (y < 1900 || dt.getTime() > Date.now()) return null
  return [y, mo, d]
}
