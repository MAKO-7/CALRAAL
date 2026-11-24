<template>
  <div
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
      <!-- En-tête coloré selon le type -->
      <div class="px-5 py-4 text-white flex items-center justify-between" :style="{ backgroundColor: headerColor }">
        <div class="flex items-center gap-2 min-w-0">
          <Lock v-if="isMasked" class="w-5 h-5 shrink-0" />
          <Megaphone v-else-if="selection.kind === 'event'" class="w-5 h-5 shrink-0" />
          <Users v-else-if="selection.kind === 'meeting'" class="w-5 h-5 shrink-0" />
          <Laptop v-else-if="selection.kind === 'telework'" class="w-5 h-5 shrink-0" />
          <CheckSquare v-else-if="selection.kind === 'task'" class="w-5 h-5 shrink-0" />
          <Stethoscope v-else-if="selection.kind === 'absence' && selection.item.type === 'maladie'" class="w-5 h-5 shrink-0" />
          <Palmtree v-else class="w-5 h-5 shrink-0" />
          <h2 class="text-base font-bold truncate">{{ headerTitle }}</h2>
        </div>
        <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-white/15 cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- CONTENU : MASQUÉ (Confidentialité 3 niveaux) -->
      <div v-if="isMasked" class="p-5 space-y-3">
        <div class="p-3 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-700 flex items-start gap-2.5">
          <ShieldAlert class="w-5 h-5 text-[#64748B] shrink-0 mt-0.5" />
          <div>
            <div class="font-bold text-slate-900">Information protégée par les droits d'accès</div>
            <p class="text-xs text-slate-600 mt-1">
              Conformément aux règles de confidentialité CentRAAL, ce créneau apparaît simplement comme
              <strong>« {{ selection.kind === 'absence' ? selection.item.vis.label : 'Occupé' }} »</strong>
              pour votre profil ({{ currentUser.name }} · {{ currentUser.service }}).
            </p>
          </div>
        </div>
        <div class="text-xs text-slate-500">
          Astuce démo : changez de profil dans la barre du haut (ex. <strong>Laurent Petit</strong> ou <strong>Sophie Vandenberg</strong>) pour voir comment les droits modifient cet affichage.
        </div>
      </div>

      <!-- CONTENU : ÉVÉNEMENT DU PORTAIL -->
      <div v-else-if="selection.kind === 'event'" class="p-5 space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
            Événement créé sur le Portail
          </span>
          <span
            class="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            :class="
              eventObj.targetType === 'public'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            "
          >
            {{
              eventObj.targetType === 'public'
                ? 'Public (tout le club)'
                : 'Restreint : ' + eventObj.targetServices.join(', ')
            }}
          </span>
        </div>

        <div class="space-y-1.5 text-sm text-slate-700">
          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-slate-400" />
            <span>{{ formatDayFull(eventObj.date) }} · {{ eventObj.startTime }} – {{ eventObj.endTime }}</span>
          </div>
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-slate-400" />
            <span>{{ eventObj.location }}</span>
          </div>
        </div>

        <p class="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          {{ eventObj.summary }}
        </p>

        <button
          @click="$emit('open-module', 'portail')"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] hover:underline cursor-pointer"
        >
          <ExternalLink class="w-3.5 h-3.5" />
          Voir la publication sur le Portail ({{ eventObj.likes }} j'aime · {{ eventObj.commentsCount }} commentaires)
        </button>

        <!-- Alerte douce de conflit avant confirmation -->
        <div
          v-if="pendingConflictMeetings.length > 0"
          class="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-2.5"
        >
          <div class="flex items-start gap-2 text-amber-950">
            <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div class="text-xs">
              <div class="font-bold text-sm">Conflit d'horaire détecté</div>
              <p class="mt-1">
                Vous avez déjà le rendez-vous
                <strong>« {{ pendingConflictMeetings[0].title }} »</strong>
                ({{ pendingConflictMeetings[0].startTime }}–{{ pendingConflictMeetings[0].endTime }}) sur ce créneau.
                Souhaitez-vous quand même confirmer votre participation ?
              </p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              @click="pendingConflictMeetings = []"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 cursor-pointer"
            >
              Annuler
            </button>
            <button
              @click="confirmWithConflict"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#6366F1] text-white hover:bg-indigo-700 cursor-pointer"
            >
              Confirmer quand même (garder côte à côte)
            </button>
          </div>
        </div>

        <!-- Boutons Participation -->
        <div
          v-if="currentUserId === viewedUserId && pendingConflictMeetings.length === 0"
          class="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap"
        >
          <div class="text-xs text-slate-500">
            Votre réponse :
            <strong class="text-slate-900">
              {{
                myEventRsvp === 'participe'
                  ? 'Je participe'
                  : myEventRsvp === 'refuse'
                    ? 'Je ne participe pas'
                    : 'À confirmer (non bloquant)'
              }}
            </strong>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="tryParticipate"
              class="px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
              :class="
                myEventRsvp === 'participe'
                  ? 'bg-[#6366F1] text-white ring-2 ring-indigo-300'
                  : 'bg-[#007A43] text-white hover:bg-[#005730]'
              "
            >
              Je participe
            </button>
            <button
              @click="refuseEvent"
              class="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 border border-slate-300 transition cursor-pointer"
            >
              Je ne participe pas
            </button>
          </div>
        </div>
      </div>

      <!-- CONTENU : RENDEZ-VOUS (RDV) -->
      <div v-else-if="selection.kind === 'meeting'" class="p-5 space-y-4">
        <div class="space-y-1.5 text-sm text-slate-700">
          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-slate-400" />
            <span>{{ formatDayFull(meetingObj.date) }} · {{ meetingObj.startTime }} – {{ meetingObj.endTime }}</span>
            <span
              v-if="meetingObj.repeat !== 'aucune'"
              class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800"
            >
              <Repeat class="w-3 h-3" />
              {{ meetingObj.repeat === 'hebdo' ? 'Chaque semaine' : 'Chaque mois' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-slate-400" />
            <span>{{ meetingObj.location }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <Eye class="w-4 h-4 text-slate-400" />
            <span>
              Visibilité :
              {{
                meetingObj.visibility === 'prive'
                  ? 'Privé (affiché « Occupé » aux tiers)'
                  : meetingObj.visibility === 'public'
                    ? 'Public'
                    : 'Équipe (' + meetingObj.service + ')'
              }}
            </span>
          </div>
        </div>

        <p v-if="meetingObj.description" class="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          {{ meetingObj.description }}
        </p>

        <!-- Participants -->
        <div>
          <div class="text-xs font-bold text-slate-700 mb-1.5">Participants</div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="p in meetingObj.participants"
              :key="p.userId"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
            >
              <span>{{ userName(p.userId) }}</span>
              <span
                class="text-[10px] font-bold px-1.5 py-0.2 rounded-full"
                :class="
                  p.status === 'accepte'
                    ? 'bg-emerald-100 text-emerald-800'
                    : p.status === 'refuse'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800'
                "
              >
                {{ p.status === 'accepte' ? 'Accepté' : p.status === 'refuse' ? 'Refusé' : 'En attente' }}
              </span>
            </span>
          </div>
        </div>

        <!-- Tâches Kanban liées (créées et reliées depuis le Kanban) -->
        <div v-if="linkedTasks.length > 0" class="rounded-xl bg-amber-50 border border-amber-300 p-3 space-y-2">
          <div class="text-xs font-bold text-amber-900 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <CheckSquare class="w-4 h-4 text-[#CA8A04]" />
              Tâche(s) reliée(s) depuis le Kanban
            </span>
            <button
              @click="$emit('open-module', 'kanban')"
              class="text-[11px] font-semibold underline cursor-pointer"
            >
              Ouvrir le Kanban
            </button>
          </div>
          <div
            v-for="t in linkedTasks"
            :key="t.id"
            class="bg-white rounded-lg p-2 border border-amber-200 flex items-center justify-between text-xs"
          >
            <span class="font-semibold text-slate-800">{{ t.title }}</span>
            <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">{{ t.status }}</span>
          </div>
        </div>

        <!-- Actions réponse / suppression -->
        <div class="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <button
            v-if="meetingObj.creatorId === currentUserId"
            @click="handleDeleteMeeting"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
          >
            Supprimer ce RDV
          </button>
          <div v-else></div>

          <div
            v-if="isInvitedToMeeting"
            class="flex items-center gap-2"
          >
            <button
              @click="handleMeetingResponse('accepte')"
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#007A43] text-white hover:bg-[#005730] cursor-pointer"
            >
              Accepter
            </button>
            <button
              @click="handleMeetingResponse('refuse')"
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-red-50 hover:text-red-700 cursor-pointer"
            >
              Refuser
            </button>
          </div>
        </div>
      </div>

      <!-- CONTENU : TÂCHE KANBAN -->
      <div v-else-if="selection.kind === 'task'" class="p-5 space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
            Projet : {{ selection.item.project }}
          </span>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Statut : {{ selection.item.status }}
          </span>
        </div>

        <div class="text-sm text-slate-700 space-y-1">
          <div><strong>Échéance :</strong> {{ formatDayFull(selection.item.dueDate) }}</div>
          <div><strong>Responsable :</strong> {{ userName(selection.item.ownerId) }}</div>
          <div v-if="taskLinkedMeeting">
            <strong>RDV relié (depuis le Kanban) :</strong> {{ taskLinkedMeeting.title }} ({{ taskLinkedMeeting.date }}, {{ taskLinkedMeeting.startTime }})
          </div>
        </div>

        <div v-if="selection.item.comments.length > 0" class="space-y-1.5">
          <div class="text-xs font-bold text-slate-700">Derniers commentaires Kanban</div>
          <div
            v-for="(c, i) in selection.item.comments"
            :key="i"
            class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
          >
            <span class="font-bold text-slate-800">{{ c.author }} :</span>
            <span class="text-slate-600"> {{ c.text }}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">Le lien Tâche ↔ RDV se gère dans le Kanban.</span>
          <button
            @click="$emit('open-module', 'kanban')"
            class="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#CA8A04] text-white hover:bg-amber-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Ouvrir dans le Kanban
          </button>
        </div>
      </div>

      <!-- CONTENU : ABSENCE RH VALIDÉE -->
      <div v-else-if="selection.kind === 'absence'" class="p-5 space-y-4">
        <div class="text-sm text-slate-700 space-y-1.5">
          <div><strong>Nature :</strong> {{ selection.item.vis.label }} (validé par le module RH)</div>
          <div>
            <strong>Période :</strong>
            {{ formatDayFull(selection.item.startDate) }}
            <span v-if="selection.item.endDate !== selection.item.startDate">
              → {{ formatDayFull(selection.item.endDate) }}
            </span>
          </div>
          <div class="text-xs text-slate-500">{{ selection.item.note }}</div>
        </div>

        <div class="p-3 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-900">
          Les congés et maladies sont gérés et validés exclusivement dans le <strong>Module RH</strong>. Le calendrier les affiche uniquement en lecture seule une fois validés.
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-200">
          <button
            @click="$emit('open-module', 'rh')"
            class="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#EA580C] text-white hover:bg-orange-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Ouvrir le Portail RH
          </button>
        </div>
      </div>

      <!-- CONTENU : TÉLÉTRAVAIL -->
      <div v-else-if="selection.kind === 'telework'" class="p-5 space-y-4">
        <div class="text-sm text-slate-700 space-y-1.5">
          <div><strong>Collaborateur :</strong> {{ userName(selection.item.userId) }}</div>
          <div><strong>Date :</strong> {{ formatDayFull(selection.item.date) }}</div>
          <div><strong>Horaires exacts :</strong> {{ selection.item.startTime }} – {{ selection.item.endTime }}</div>
          <div class="text-xs text-slate-500">{{ selection.item.note }}</div>
        </div>
        <div
          v-if="selection.item.userId === currentUserId"
          class="pt-3 border-t border-slate-200 flex items-center justify-end gap-2"
        >
          <button
            @click="$emit('edit-telework', selection.item)"
            class="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#0D9488] text-white hover:bg-[#0f766e] cursor-pointer"
          >
            Modifier les heures
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  X,
  Lock,
  Megaphone,
  Users,
  Laptop,
  CheckSquare,
  Stethoscope,
  Palmtree,
  ShieldAlert,
  Clock,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Repeat,
  Eye,
} from 'lucide-vue-next'
import { formatDayFull } from '../utils/dateUtils'
import { useCalendarStore } from '../composables/useCalendarStore'

const props = defineProps({
  selection: { type: Object, required: true },
})
const emit = defineEmits(['close', 'open-module', 'edit-telework'])

const {
  users,
  meetings,
  tasks,
  currentUser,
  currentUserId,
  viewedUserId,
  findConflictsForEvent,
  setPortalParticipation,
  respondToMeeting,
  deleteMeeting,
} = useCalendarStore()

const pendingConflictMeetings = ref([])

const isMasked = computed(() => {
  if (props.selection.kind === 'meeting') return props.selection.item.masked
  if (props.selection.kind === 'absence') return props.selection.item.vis.level === 'masked'
  return false
})

const eventObj = computed(() =>
  props.selection.kind === 'event' ? props.selection.item.raw || props.selection.item : null
)
const meetingObj = computed(() =>
  props.selection.kind === 'meeting' ? props.selection.item.raw || props.selection.item : null
)

const myEventRsvp = computed(() => {
  if (!eventObj.value) return 'attente'
  return eventObj.value.participations[currentUserId.value] || 'attente'
})

const linkedTasks = computed(() => {
  if (!meetingObj.value) return []
  return tasks.value.filter((t) => t.linkedMeetingId === meetingObj.value.id)
})

const taskLinkedMeeting = computed(() => {
  if (props.selection.kind !== 'task' || !props.selection.item.linkedMeetingId) return null
  return meetings.value.find((m) => m.id === props.selection.item.linkedMeetingId) || null
})

const isInvitedToMeeting = computed(() => {
  if (!meetingObj.value) return false
  return meetingObj.value.participants.some((p) => p.userId === currentUserId.value)
})

const headerColor = computed(() => {
  if (isMasked.value) return '#64748B'
  if (props.selection.kind === 'event') return '#6366F1'
  if (props.selection.kind === 'meeting') return '#2563EB'
  if (props.selection.kind === 'telework') return '#0D9488'
  if (props.selection.kind === 'task') return '#CA8A04'
  if (props.selection.kind === 'absence') {
    return props.selection.item.type === 'maladie' ? '#DC2626' : '#EA580C'
  }
  return '#007A43'
})

const headerTitle = computed(() => {
  if (isMasked.value) {
    return props.selection.kind === 'absence' ? props.selection.item.vis.label : 'Créneau occupé'
  }
  if (props.selection.kind === 'event') return eventObj.value.title
  if (props.selection.kind === 'meeting') return meetingObj.value.title
  if (props.selection.kind === 'telework') return 'Télétravail déclaré'
  if (props.selection.kind === 'task') return props.selection.item.title
  if (props.selection.kind === 'absence') return props.selection.item.vis.label + ' (validé RH)'
  return 'Détails'
})

function userName(uid) {
  return users.value.find((u) => u.id === uid)?.name || 'Membre'
}

function tryParticipate() {
  const conflicts = findConflictsForEvent(eventObj.value.id, currentUserId.value)
  if (conflicts.length > 0 && myEventRsvp.value !== 'participe') {
    pendingConflictMeetings.value = conflicts
    return
  }
  setPortalParticipation(eventObj.value.id, 'participe')
  emit('close')
}

function confirmWithConflict() {
  setPortalParticipation(eventObj.value.id, 'participe')
  pendingConflictMeetings.value = []
  emit('close')
}

function refuseEvent() {
  setPortalParticipation(eventObj.value.id, 'refuse')
  emit('close')
}

function handleMeetingResponse(status) {
  respondToMeeting(meetingObj.value.id, status)
  emit('close')
}

function handleDeleteMeeting() {
  deleteMeeting(meetingObj.value.id)
  emit('close')
}
</script>
