import { ref, computed } from 'vue'
import {
  TODAY,
  INITIAL_USERS,
  INITIAL_ABSENCES,
  INITIAL_TELEWORKS,
  INITIAL_MEETINGS,
  INITIAL_PORTAL_EVENTS,
  INITIAL_TASKS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData'
import {
  isDateInRange,
  expandMeetingOnDate,
  timesOverlap,
  getDayOfWeek,
} from '../utils/dateUtils'
import {
  resolveAbsenceVisibility,
  resolveMeetingVisibility,
  resolvePortalEventForCalendar,
  canViewTask,
  isPortalEventVisibleFor,
} from '../utils/rights'

const users = ref(structuredClone(INITIAL_USERS))
const absences = ref(structuredClone(INITIAL_ABSENCES))
const teleworks = ref(structuredClone(INITIAL_TELEWORKS))
const meetings = ref(structuredClone(INITIAL_MEETINGS))
const portalEvents = ref(structuredClone(INITIAL_PORTAL_EVENTS))
const tasks = ref(structuredClone(INITIAL_TASKS))
const notifications = ref(structuredClone(INITIAL_NOTIFICATIONS))

const currentUserId = ref('u1') // Julie Moreau par défaut
const viewedUserId = ref('u1') // Calendrier actuellement consulté
const currentDate = ref(TODAY)
const activeModule = ref('calendar') // 'calendar' | 'rh' | 'kanban' | 'portail'
const activeView = ref('week') // 'week' | 'month' | 'day' | 'list' | 'team'
const teamServiceFilter = ref('ALL')
const mobilePreviewMode = ref(false)
const toastMessage = ref('')

let toastTimer = null
function showToast(msg) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3800)
}

export function useCalendarStore() {
  const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value))
  const viewedUser = computed(() => users.value.find((u) => u.id === viewedUserId.value))

  const myNotifications = computed(() =>
    notifications.value.filter((n) => n.userId === currentUserId.value)
  )
  const unreadNotifCount = computed(() => myNotifications.value.filter((n) => !n.read).length)

  function switchCurrentUser(userId) {
    currentUserId.value = userId
    viewedUserId.value = userId
    const u = users.value.find((x) => x.id === userId)
    if (u) showToast(`Connecté en tant que ${u.name} (${u.service})`)
  }

  function setViewedUser(userId) {
    viewedUserId.value = userId
  }

  function setProfileStatus(statusKey) {
    const u = users.value.find((x) => x.id === currentUserId.value)
    if (u) {
      u.profileStatus = statusKey
      const labels = {
        disponible: 'Disponible',
        occupe: 'Occupé (concentration tâches)',
        indisponible: 'Indisponible (en réunion)',
      }
      showToast(`Statut du profil mis à jour : ${labels[statusKey]}`)
    }
  }

  function markNotificationRead(id) {
    const n = notifications.value.find((x) => x.id === id)
    if (n) n.read = true
  }

  function markAllNotificationsRead() {
    notifications.value.forEach((n) => {
      if (n.userId === currentUserId.value) n.read = true
    })
  }

  /**
   * Calcule tous les éléments visibles d'une journée pour un utilisateur cible (targetUser)
   * vu par l'utilisateur connecté (viewer), en appliquant la matrice des droits 3.3.
   */
  function getDayEntries(dateStr, targetUserId = viewedUserId.value) {
    const viewer = currentUser.value
    const target = users.value.find((u) => u.id === targetUserId)
    if (!viewer || !target) {
      return { absences: [], teleworks: [], tasks: [], timedItems: [], isWorkDay: false, workSchedule: null }
    }

    const dow = getDayOfWeek(dateStr)
    const isWorkDay = target.workSchedule.days.includes(dow)

    // 1. Absences RH validées (Zone 1)
    const dayAbsences = absences.value
      .filter((a) => a.userId === target.id && isDateInRange(dateStr, a.startDate, a.endDate))
      .map((a) => ({
        ...a,
        vis: resolveAbsenceVisibility(a, viewer, target),
      }))

    // 2. Télétravail à l'heure près (Zone 1)
    const dayTeleworks = teleworks.value.filter(
      (tw) => tw.userId === target.id && tw.date === dateStr
    )

    // 3. Tâches Kanban à échéance (Zone 1)
    const dayTasks = tasks.value.filter(
      (t) =>
        t.dueDate === dateStr &&
        (t.ownerId === target.id || t.participantIds.includes(target.id)) &&
        canViewTask(t, viewer, target)
    )

    // 4. Rendez-vous (Zone 3)
    const dayMeetings = meetings.value
      .filter(
        (m) =>
          expandMeetingOnDate(m, dateStr) &&
          (m.creatorId === target.id ||
            m.participants.some((p) => p.userId === target.id && p.status !== 'refuse'))
      )
      .map((m) => {
        const vis = resolveMeetingVisibility(m, viewer, target)
        const myPart = m.participants.find((p) => p.userId === target.id)
        const linkedTasks = tasks.value.filter((t) => t.linkedMeetingId === m.id)
        return {
          kind: 'meeting',
          id: m.id,
          raw: m,
          title: vis.title,
          masked: vis.level === 'masked',
          startTime: m.startTime,
          endTime: m.endTime,
          location: vis.level === 'detail' ? m.location : '',
          myStatus: myPart?.status || 'accepte',
          linkedTasksCount: vis.level === 'detail' ? linkedTasks.length : 0,
        }
      })

    // 5. Événements du Portail (Zone 3 — non bloquants si 'attente', disparaissent si 'refuse')
    const dayEvents = portalEvents.value
      .filter((e) => e.date === dateStr)
      .map((e) => {
        const vis = resolvePortalEventForCalendar(e, viewer, target)
        if (!vis) return null
        return {
          kind: 'event',
          id: e.id,
          raw: e,
          title: e.title,
          masked: false,
          startTime: e.startTime,
          endTime: e.endTime,
          location: e.location,
          rsvp: vis.rsvp, // 'attente' | 'participe'
        }
      })
      .filter(Boolean)

    // Détection des conflits / superpositions côte à côte (Zone 3)
    const timedItems = [...dayMeetings, ...dayEvents].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )

    // Calcul simple de colonnes pour affichage côte à côte (ex. RDV Bleu + Événement Violet)
    const laidOut = assignOverlapColumns(timedItems)

    // Marquer conflit explicite si un événement "participe" chevauche un RDV (ou 2 RDV)
    for (const item of laidOut) {
      const overlaps = laidOut.filter(
        (other) =>
          other.id !== item.id &&
          timesOverlap(item.startTime, item.endTime, other.startTime, other.endTime)
      )
      item.hasOverlap = overlaps.length > 0
      item.hasConfirmedConflict =
        item.kind === 'event' &&
        item.rsvp === 'participe' &&
        overlaps.some((o) => o.kind === 'meeting')
    }

    return {
      absences: dayAbsences,
      teleworks: dayTeleworks,
      tasks: dayTasks,
      timedItems: laidOut,
      isWorkDay,
      workSchedule: target.workSchedule,
    }
  }

  /**
   * Calcule les créneaux grisés d'un collègue pour la modale "+ Nouveau RDV"
   */
  function getUserBusySlots(userId, dateStr) {
    const target = users.value.find((u) => u.id === userId)
    if (!target) return { fullDayBusy: false, fullDayLabel: '', slots: [] }

    const abs = absences.value.find(
      (a) => a.userId === userId && isDateInRange(dateStr, a.startDate, a.endDate)
    )
    if (abs) {
      const vis = resolveAbsenceVisibility(abs, currentUser.value, target)
      return {
        fullDayBusy: true,
        fullDayLabel: vis.label,
        slots: [{ startTime: '08:00', endTime: '20:00', label: vis.label }],
      }
    }

    const slots = []
    meetings.value.forEach((m) => {
      if (
        expandMeetingOnDate(m, dateStr) &&
        (m.creatorId === userId ||
          m.participants.some((p) => p.userId === userId && p.status !== 'refuse'))
      ) {
        slots.push({ startTime: m.startTime, endTime: m.endTime, label: 'Occupé' })
      }
    })
    portalEvents.value.forEach((e) => {
      if (e.date === dateStr && e.participations[userId] === 'participe') {
        slots.push({ startTime: e.startTime, endTime: e.endTime, label: 'Occupé (Événement)' })
      }
    })

    return { fullDayBusy: false, fullDayLabel: '', slots }
  }

  /**
   * Vérifie si participer à un événement du Portail crée un conflit avec un RDV existant
   */
  function findConflictsForEvent(eventId, userId = currentUserId.value) {
    const ev = portalEvents.value.find((e) => e.id === eventId)
    if (!ev) return []
    return meetings.value.filter(
      (m) =>
        expandMeetingOnDate(m, ev.date) &&
        (m.creatorId === userId ||
          m.participants.some((p) => p.userId === userId && p.status !== 'refuse')) &&
        timesOverlap(ev.startTime, ev.endTime, m.startTime, m.endTime)
    )
  }

  function setPortalParticipation(eventId, status, userId = currentUserId.value) {
    const ev = portalEvents.value.find((e) => e.id === eventId)
    if (!ev) return
    ev.participations[userId] = status
    if (status === 'refuse') {
      showToast('Événement retiré de votre calendrier (toujours consultable sur le Portail).')
    } else if (status === 'participe') {
      showToast(`Participation confirmée : « ${ev.title} »`)
    } else {
      showToast(`Réponse remise en attente pour « ${ev.title} »`)
    }
  }

  function respondToMeeting(meetingId, status, userId = currentUserId.value) {
    const m = meetings.value.find((x) => x.id === meetingId)
    if (!m) return
    const p = m.participants.find((x) => x.userId === userId)
    if (p) {
      p.status = status
    } else {
      m.participants.push({ userId, status })
    }
    const labels = { accepte: 'acceptée', refuse: 'refusée', attente: 'en attente' }
    showToast(`Invitation ${labels[status]} : « ${m.title} »`)
  }

  function createMeeting(payload) {
    const id = `m-${Date.now()}`
    const participants = [
      { userId: currentUserId.value, status: 'accepte' },
      ...payload.participantIds
        .filter((uid) => uid !== currentUserId.value)
        .map((uid) => ({ userId: uid, status: 'attente' })),
    ]
    const newMeeting = {
      id,
      title: payload.title.trim(),
      location: payload.location.trim() || 'Easi Arena',
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      creatorId: currentUserId.value,
      service: currentUser.value.service,
      visibility: payload.visibility,
      repeat: payload.repeat || 'aucune',
      description: payload.description?.trim() || '',
      participants,
    }
    meetings.value.push(newMeeting)

    // Créer une notif in-app pour chaque invité
    payload.participantIds
      .filter((uid) => uid !== currentUserId.value)
      .forEach((uid) => {
        notifications.value.unshift({
          id: `n-${Date.now()}-${uid}`,
          userId: uid,
          type: 'meeting',
          targetId: id,
          title: 'Nouvelle invitation RDV',
          message: `${currentUser.value.name} vous invite à « ${newMeeting.title} » (${newMeeting.date}, ${newMeeting.startTime}).`,
          time: "À l'instant",
          read: false,
        })
      })

    showToast(`Rendez-vous « ${newMeeting.title} » créé !`)
    return newMeeting
  }

  function deleteMeeting(meetingId) {
    meetings.value = meetings.value.filter((m) => m.id !== meetingId)
    showToast('Rendez-vous supprimé.')
  }

  function saveTelework(payload) {
    if (payload.id) {
      const idx = teleworks.value.findIndex((t) => t.id === payload.id)
      if (idx !== -1) {
        teleworks.value[idx] = { ...teleworks.value[idx], ...payload }
        showToast(`Télétravail mis à jour (${payload.startTime} – ${payload.endTime}).`)
        return
      }
    }
    teleworks.value.push({
      id: `tw-${Date.now()}`,
      userId: currentUserId.value,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      note: payload.note?.trim() || 'Télétravail déclaré dans le calendrier',
    })
    showToast(`Télétravail enregistré : ${payload.date} (${payload.startTime} – ${payload.endTime})`)
  }

  function deleteTelework(id) {
    teleworks.value = teleworks.value.filter((t) => t.id !== id)
    showToast('Télétravail supprimé.')
  }

  // Lien Tâche <-> RDV géré depuis le module Kanban
  function linkTaskToMeeting(taskId, meetingId) {
    const t = tasks.value.find((x) => x.id === taskId)
    if (!t) return
    t.linkedMeetingId = meetingId || null
    showToast(
      meetingId
        ? 'Lien Tâche ↔ RDV mis à jour depuis le Kanban.'
        : 'Lien RDV retiré depuis le Kanban.'
    )
  }

  function toggleTaskStatus(taskId) {
    const t = tasks.value.find((x) => x.id === taskId)
    if (!t) return
    const order = ['À faire', 'En cours', 'Terminé']
    const next = order[(order.indexOf(t.status) + 1) % order.length]
    t.status = next
    showToast(`Statut Kanban : « ${t.title} » → ${next}`)
  }

  function getVisiblePortalEventsForCurrentUser() {
    return portalEvents.value.filter((e) => isPortalEventVisibleFor(e, currentUser.value))
  }

  return {
    users,
    absences,
    teleworks,
    meetings,
    portalEvents,
    tasks,
    notifications,
    currentUserId,
    viewedUserId,
    currentUser,
    viewedUser,
    currentDate,
    activeModule,
    activeView,
    teamServiceFilter,
    mobilePreviewMode,
    toastMessage,
    myNotifications,
    unreadNotifCount,
    showToast,
    switchCurrentUser,
    setViewedUser,
    setProfileStatus,
    markNotificationRead,
    markAllNotificationsRead,
    getDayEntries,
    getUserBusySlots,
    findConflictsForEvent,
    setPortalParticipation,
    respondToMeeting,
    createMeeting,
    deleteMeeting,
    saveTelework,
    deleteTelework,
    linkTaskToMeeting,
    toggleTaskStatus,
    getVisiblePortalEventsForCurrentUser,
  }
}

function assignOverlapColumns(items) {
  const result = items.map((item) => ({ ...item, col: 0, totalCols: 1 }))
  for (let i = 0; i < result.length; i++) {
    const group = [result[i]]
    for (let j = 0; j < result.length; j++) {
      if (
        i !== j &&
        timesOverlap(result[i].startTime, result[i].endTime, result[j].startTime, result[j].endTime)
      ) {
        group.push(result[j])
      }
    }
    if (group.length > 1) {
      const sorted = group.sort((a, b) => a.id.localeCompare(b.id))
      const idx = sorted.findIndex((x) => x.id === result[i].id)
      result[i].col = idx
      result[i].totalCols = sorted.length
    }
  }
  return result
}
