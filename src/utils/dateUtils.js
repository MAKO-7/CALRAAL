const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS_FULL = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(dateStr, days) {
  const dt = parseDate(dateStr)
  dt.setDate(dt.getDate() + days)
  return formatDateISO(dt)
}

export function getMondayOfWeek(dateStr) {
  const dt = parseDate(dateStr)
  const day = dt.getDay() // 0 = Sun, 1 = Mon...
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  return formatDateISO(dt)
}

export function getWeekDates(anchorDateStr) {
  const monday = getMondayOfWeek(anchorDateStr)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function getMonthGridDates(anchorDateStr) {
  const dt = parseDate(anchorDateStr)
  const firstOfMonth = new Date(dt.getFullYear(), dt.getMonth(), 1)
  const startGrid = getMondayOfWeek(formatDateISO(firstOfMonth))
  return Array.from({ length: 42 }, (_, i) => {
    const iso = addDays(startGrid, i)
    const dObj = parseDate(iso)
    return {
      iso,
      dayNum: dObj.getDate(),
      inMonth: dObj.getMonth() === dt.getMonth(),
    }
  })
}

export function formatDayShort(dateStr) {
  const dt = parseDate(dateStr)
  return `${DAYS_SHORT[dt.getDay()]} ${dt.getDate()}`
}

export function formatDayFull(dateStr) {
  const dt = parseDate(dateStr)
  return `${DAYS_FULL[dt.getDay()]} ${dt.getDate()} ${MONTHS_FULL[dt.getMonth()]} ${dt.getFullYear()}`
}

export function formatMonthTitle(dateStr) {
  const dt = parseDate(dateStr)
  const label = `${MONTHS_FULL[dt.getMonth()]} ${dt.getFullYear()}`
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatWeekRange(anchorDateStr) {
  const dates = getWeekDates(anchorDateStr)
  const first = parseDate(dates[0])
  const last = parseDate(dates[6])
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${MONTHS_FULL[first.getMonth()]} ${first.getFullYear()}`
  }
  return `${first.getDate()} ${MONTHS_FULL[first.getMonth()]} – ${last.getDate()} ${MONTHS_FULL[last.getMonth()]} ${last.getFullYear()}`
}

export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function timesOverlap(s1, e1, s2, e2) {
  const a1 = timeToMinutes(s1)
  const b1 = timeToMinutes(e1)
  const a2 = timeToMinutes(s2)
  const b2 = timeToMinutes(e2)
  return a1 < b2 && a2 < b1
}

export function isDateInRange(dateStr, startDate, endDate) {
  return dateStr >= startDate && dateStr <= endDate
}

export function getDayOfWeek(dateStr) {
  return parseDate(dateStr).getDay()
}

export function expandMeetingOnDate(meeting, dateStr) {
  if (meeting.date === dateStr) return true
  if (!meeting.repeat || meeting.repeat === 'aucune') return false
  if (dateStr < meeting.date) return false
  const base = parseDate(meeting.date)
  const target = parseDate(dateStr)
  if (meeting.repeat === 'hebdo') {
    const diffDays = Math.round((target - base) / 86400000)
    return diffDays > 0 && diffDays % 7 === 0 && diffDays <= 84
  }
  if (meeting.repeat === 'mensuel') {
    return target.getDate() === base.getDate()
  }
  return false
}
