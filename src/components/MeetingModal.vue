<template>
  <div
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
      <div class="px-5 py-4 bg-[#007A43] text-white flex items-center justify-between rounded-t-2xl">
        <div class="flex items-center gap-2">
          <CalendarPlus class="w-5 h-5" />
          <h2 class="text-base font-bold">Nouveau rendez-vous</h2>
        </div>
        <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-white/15 cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Titre du rendez-vous *</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Ex. Point sponsors, Réunion organisation match..."
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A43]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
            <input
              v-model="form.date"
              type="date"
              required
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A43]"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Début *</label>
              <input
                v-model="form.startTime"
                type="time"
                required
                class="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A43]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Fin *</label>
              <input
                v-model="form.endTime"
                type="time"
                required
                class="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A43]"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Lieu</label>
            <input
              v-model="form.location"
              type="text"
              placeholder="Salle des Loups, Easi Arena, Visio..."
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A43]"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Visibilité</label>
              <select
                v-model="form.visibility"
                class="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007A43]"
              >
                <option value="equipe">Équipe</option>
                <option value="public">Public (Club)</option>
                <option value="prive">Privé (Occupé aux tiers)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Répétition simple</label>
              <select
                v-model="form.repeat"
                class="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#007A43]"
              >
                <option value="aucune">Aucune</option>
                <option value="hebdo">Chaque semaine</option>
                <option value="mensuel">Chaque mois</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sélection des invités -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Inviter des collègues (leurs disponibilités s'affichent en grisé ci-dessous)
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="u in otherUsers"
              :key="u.id"
              type="button"
              @click="toggleParticipant(u.id)"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer"
              :class="
                form.participantIds.includes(u.id)
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              "
            >
              <span>{{ u.name }}</span>
              <span class="opacity-75 text-[10px]">({{ u.service }})</span>
            </button>
          </div>
        </div>

        <!-- PANNEAU DISPONIBILITÉS GRISÉES EN TEMPS RÉEL (Point 2.5 du rapport) -->
        <div
          v-if="form.participantIds.length > 0"
          class="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5"
        >
          <div class="flex items-center justify-between flex-wrap gap-1">
            <div class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Eye class="w-4 h-4 text-[#007A43]" />
              <span>Disponibilités des invités le {{ form.date }} (08h – 20h)</span>
            </div>
            <div class="flex items-center gap-3 text-[10.5px] text-slate-500">
              <span class="inline-flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-xs bg-[#64748B] inline-block"></span>
                Grisé = Absent / Occupé
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-xs bg-[#2563EB]/30 border border-[#2563EB] inline-block"></span>
                Votre créneau
              </span>
            </div>
          </div>

          <!-- Échelle horaire -->
          <div class="pl-[124px] flex justify-between text-[10px] font-medium text-slate-400">
            <span>08h</span><span>10h</span><span>12h</span><span>14h</span><span>16h</span><span>18h</span><span>20h</span>
          </div>

          <div
            v-for="row in availabilityRows"
            :key="row.user.id"
            class="flex items-center gap-2"
          >
            <div class="w-[116px] shrink-0">
              <div class="text-xs font-semibold text-slate-800 truncate">{{ row.user.name }}</div>
              <div
                v-if="row.busy.fullDayBusy"
                class="text-[10px] font-semibold text-slate-500"
              >
                {{ row.busy.fullDayLabel }} (journée)
              </div>
            </div>
            <div class="flex-1 h-7 bg-white rounded-md border border-slate-200 relative overflow-hidden">
              <!-- Blocs grisés (absences validées ou réunions existantes) -->
              <div
                v-for="(slot, idx) in row.busy.slots"
                :key="idx"
                class="absolute top-0 bottom-0 bg-[#64748B]/80 text-white text-[9.5px] font-semibold flex items-center justify-center px-1 truncate"
                :style="barStyle(slot.startTime, slot.endTime)"
                :title="`${slot.label} (${slot.startTime}–${slot.endTime})`"
              >
                {{ slot.label }}
              </div>
              <!-- Créneau en cours de création -->
              <div
                class="absolute top-0 bottom-0 bg-[#2563EB]/25 border-x-2 border-[#2563EB] pointer-events-none"
                :style="barStyle(form.startTime, form.endTime)"
              ></div>
            </div>
          </div>

          <!-- Avertissement si le créneau tombe sur un invité grisé -->
          <div
            v-if="conflictingInvitees.length > 0"
            class="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2"
          >
            <AlertTriangle class="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Créneau indisponible détecté :</strong>
              {{ conflictingInvitees.join(', ') }} apparaît déjà grisé(e) sur ce créneau. Vous pouvez décaler l'horaire ou envoyer quand même l'invitation.
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Description / ordre du jour</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Détails facultatifs..."
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A43]"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg text-sm font-semibold bg-[#007A43] text-white hover:bg-[#005730] shadow-xs cursor-pointer"
          >
            Créer le rendez-vous
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { CalendarPlus, X, Eye, AlertTriangle } from 'lucide-vue-next'
import { useCalendarStore } from '../composables/useCalendarStore'
import { timeToMinutes, timesOverlap } from '../utils/dateUtils'

const props = defineProps({
  initialDate: { type: String, required: true },
})
const emit = defineEmits(['close'])

const { users, currentUserId, getUserBusySlots, createMeeting } = useCalendarStore()

const form = reactive({
  title: '',
  date: props.initialDate,
  startTime: '14:00',
  endTime: '15:00',
  location: '',
  visibility: 'equipe',
  repeat: 'aucune',
  description: '',
  participantIds: ['u2'], // Thomas pré-sélectionné pour illustrer immédiatement les dispos grisées !
})

const otherUsers = computed(() => users.value.filter((u) => u.id !== currentUserId.value))

const availabilityRows = computed(() =>
  form.participantIds
    .map((uid) => {
      const user = users.value.find((u) => u.id === uid)
      if (!user) return null
      return {
        user,
        busy: getUserBusySlots(uid, form.date),
      }
    })
    .filter(Boolean)
)

const conflictingInvitees = computed(() =>
  availabilityRows.value
    .filter((row) =>
      row.busy.slots.some((s) => timesOverlap(form.startTime, form.endTime, s.startTime, s.endTime))
    )
    .map((row) => row.user.name)
)

function toggleParticipant(uid) {
  const idx = form.participantIds.indexOf(uid)
  if (idx === -1) form.participantIds.push(uid)
  else form.participantIds.splice(idx, 1)
}

function barStyle(startStr, endStr) {
  const minStart = 8 * 60
  const span = 12 * 60 // 08h -> 20h
  const s = Math.max(minStart, Math.min(20 * 60, timeToMinutes(startStr || '08:00')))
  const e = Math.max(s + 15, Math.min(20 * 60, timeToMinutes(endStr || '09:00')))
  const left = ((s - minStart) / span) * 100
  const width = ((e - s) / span) * 100
  return { left: `${left}%`, width: `${width}%` }
}

function handleSubmit() {
  if (!form.title.trim()) return
  createMeeting({ ...form })
  emit('close')
}
</script>
