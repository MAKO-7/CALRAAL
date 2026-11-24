/**
 * Matrice des droits, rôles et confidentialité (3 niveaux : detail | masked | hidden)
 * Implémentation stricte du tableau 3.3 du rapport d'analyse CentRAAL.
 */

export function isManagerOf(viewer, targetUser) {
  if (!viewer || !targetUser) return false
  if (targetUser.managerId === viewer.id) return true
  if (viewer.managesServices && viewer.managesServices.includes(targetUser.service)) return true
  return false
}

export function isSameTeam(viewer, targetUser) {
  if (!viewer || !targetUser) return false
  return viewer.service === targetUser.service
}

export function isRH(viewer) {
  return viewer?.role === 'rh'
}

/**
 * Congé / Maladie validé(e) (source : Module RH)
 * - Congé : Moi / Équipe / Manager / RH -> Détail (« Congé ») | Autre service -> Grisé (« Indisponible »)
 * - Maladie : Moi / Manager / RH -> Détail (« Maladie ») | Équipe / Autre service -> Grisé (« Indisponible »)
 */
export function resolveAbsenceVisibility(absence, viewer, targetUser) {
  const isSelf = viewer.id === targetUser.id
  const mgr = isManagerOf(viewer, targetUser)
  const rh = isRH(viewer)
  const sameTeam = isSameTeam(viewer, targetUser)

  if (absence.type === 'maladie') {
    if (isSelf || mgr || rh) {
      return {
        level: 'detail',
        label: 'Maladie',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#DC2626',
        text: '#991B1B',
      }
    }
    return {
      level: 'masked',
      label: 'Indisponible',
      color: '#64748B',
      bg: '#F1F5F9',
      border: '#64748B',
      text: '#334155',
    }
  }

  // Congé validé
  if (isSelf || sameTeam || mgr || rh) {
    return {
      level: 'detail',
      label: 'Congé',
      color: '#EA580C',
      bg: '#FFF7ED',
      border: '#EA580C',
      text: '#9A3412',
    }
  }
  return {
    level: 'masked',
    label: 'Indisponible',
    color: '#64748B',
    bg: '#F1F5F9',
    border: '#64748B',
    text: '#334155',
  }
}

/**
 * RDV (équipe / public / privé)
 * - Privé : Moi -> Détail | Tous les autres -> Grisé (« Occupé »)
 * - Équipe : Moi / Invité / Même équipe / Manager de l'équipe -> Détail | Autre service / RH -> Grisé (« Occupé »)
 * - Public : Détail pour tous
 */
export function resolveMeetingVisibility(meeting, viewer, targetUser) {
  const isSelf = viewer.id === targetUser.id
  const isParticipant = meeting.participants.some((p) => p.userId === viewer.id)
  const sameTeam = isSameTeam(viewer, targetUser) || viewer.service === meeting.service
  const mgr = isManagerOf(viewer, targetUser)

  if (meeting.visibility === 'prive') {
    if (isSelf || meeting.creatorId === viewer.id) {
      return { level: 'detail', title: meeting.title }
    }
    return { level: 'masked', title: 'Occupé' }
  }

  if (meeting.visibility === 'public') {
    return { level: 'detail', title: meeting.title }
  }

  // visibility === 'equipe'
  if (isSelf || isParticipant || sameTeam || mgr) {
    return { level: 'detail', title: meeting.title }
  }
  return { level: 'masked', title: 'Occupé' }
}

/**
 * Événement du Portail (Public ou Ciblé par service/rôle)
 * - Si ciblé et le viewer (ou targetUser) n'est pas dans les services ciblés -> Caché (null)
 * - Si l'utilisateur consulté a cliqué "Je ne participe pas" ('refuse') -> disparaît de son calendrier
 */
export function isPortalEventVisibleFor(event, user) {
  if (!user) return false
  if (event.targetType === 'public') return true
  if (event.targetServices.includes(user.service)) return true
  if (user.managesServices && event.targetServices.some((s) => user.managesServices.includes(s))) {
    return true
  }
  return false
}

export function resolvePortalEventForCalendar(event, viewer, targetUser) {
  // Si le viewer n'est pas autorisé à voir un événement ciblé -> totalement caché
  if (!isPortalEventVisibleFor(event, viewer)) return null
  // Si la personne consultée n'est pas ciblée par cet événement -> pas dans son agenda
  if (!isPortalEventVisibleFor(event, targetUser)) return null

  const rsvp = event.participations[targetUser.id] || 'attente'
  // Si refusé -> disparaît du calendrier (reste visible sur le Portail)
  if (rsvp === 'refuse') return null

  return {
    level: 'detail',
    rsvp, // 'attente' (pointillé non bloquant) | 'participe' (plein)
  }
}

/**
 * Tâche Kanban
 * - Moi / participant / même service (même projet) / Manager de l'équipe -> Détail
 * - Autre service -> Caché
 */
export function canViewTask(task, viewer, targetUser) {
  if (viewer.id === targetUser.id) return true
  if (task.ownerId === viewer.id || task.participantIds.includes(viewer.id)) return true
  if (viewer.service === task.service) return true
  if (isManagerOf(viewer, targetUser)) return true
  if (isRH(viewer) && task.service === 'Ressources Humaines') return true
  return false
}
