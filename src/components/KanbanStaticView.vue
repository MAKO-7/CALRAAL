<template>
  <div class="space-y-4">
    <div class="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <Kanban class="w-6 h-6 text-[#CA8A04] shrink-0 mt-0.5" />
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-[#CA8A04]">
            Module Tâches / Kanban — Démonstration interactive
          </div>
          <h2 class="text-lg font-bold text-slate-900">Projets, tâches et liaison avec les rendez-vous</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            C'est <strong>depuis ce tableau Kanban</strong> qu'une tâche est reliée à un rendez-vous. Le Calendrier récupère ensuite son échéance (en ambre #CA8A04) et le lien vers le RDV associé.
          </p>
        </div>
      </div>
      <button
        @click="$emit('back-to-calendar')"
        class="px-4 py-2 rounded-lg text-xs font-bold bg-[#007A43] text-white hover:bg-[#005730] shrink-0 cursor-pointer"
      >
        ← Retour au Calendrier
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="col in ['À faire', 'En cours', 'Terminé']"
        :key="col"
        class="bg-slate-100/80 rounded-xl border border-slate-200 p-3 space-y-3"
      >
        <div class="flex items-center justify-between px-1">
          <h3 class="text-sm font-bold text-slate-800">{{ col }}</h3>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
            {{ tasksInCol(col).length }}
          </span>
        </div>

        <div
          v-for="t in tasksInCol(col)"
          :key="t.id"
          class="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10.5px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              {{ t.project }}
            </span>
            <span class="text-[11px] font-semibold text-slate-500">
              Échéance : {{ t.dueDate }}
            </span>
          </div>

          <div class="text-sm font-bold text-slate-900">{{ t.title }}</div>
          <div class="text-xs text-slate-500">
            Responsable : <strong>{{ userName(t.ownerId) }}</strong> · {{ t.comments.length }} commentaire(s)
          </div>

          <!-- Sélecteur de liaison Tâche <-> RDV (géré ICI dans le Kanban !) -->
          <div class="pt-2 border-t border-slate-100 space-y-1.5">
            <label class="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Link2 class="w-3.5 h-3.5 text-[#2563EB]" />
              Rendez-vous relié (Calendrier) :
            </label>
            <select
              :value="t.linkedMeetingId || ''"
              @change="linkTaskToMeeting(t.id, $event.target.value)"
              class="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#CA8A04]"
            >
              <option value="">Aucun rendez-vous lié</option>
              <option v-for="m in meetings" :key="m.id" :value="m.id">
                {{ m.title }} ({{ m.date }} · {{ m.startTime }})
              </option>
            </select>
          </div>

          <button
            @click="toggleTaskStatus(t.id)"
            class="w-full py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            Passer à l'étape suivante →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Kanban, Link2 } from 'lucide-vue-next'
import { useCalendarStore } from '../composables/useCalendarStore'

defineEmits(['back-to-calendar'])

const { tasks, meetings, users, linkTaskToMeeting, toggleTaskStatus } = useCalendarStore()

function tasksInCol(status) {
  return tasks.value.filter((t) => t.status === status)
}

function userName(uid) {
  return users.value.find((u) => u.id === uid)?.name || 'Membre'
}
</script>
