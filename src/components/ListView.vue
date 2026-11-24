<template>
  <div class="space-y-3">
    <div
      v-for="day in upcomingDays"
      :key="day.iso"
      class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
      :class="day.iso === TODAY ? 'ring-2 ring-[#007A43]' : ''"
    >
      <div
        class="px-4 py-2.5 flex items-center justify-between border-b border-slate-100"
        :class="day.iso === TODAY ? 'bg-[#e6f4ed]' : 'bg-slate-50'"
      >
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm capitalize text-slate-900">
            {{ formatDayFull(day.iso) }}
          </span>
          <span
            v-if="day.iso === TODAY"
            class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#007A43] text-white"
          >
            Aujourd'hui
          </span>
        </div>
        <button
          @click="$emit('select-day', day.iso)"
          class="text-xs font-semibold text-[#007A43] hover:underline cursor-pointer"
        >
          Ouvrir le jour
        </button>
      </div>

      <div class="p-3 space-y-2">
        <!-- Absences -->
        <div
          v-for="abs in day.data.absences"
          :key="abs.id"
          @click="$emit('open-item', { kind: 'absence', item: abs })"
          class="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer"
          :style="{
            backgroundColor: abs.vis.bg,
            borderColor: abs.vis.border,
            color: abs.vis.text,
          }"
        >
          <Lock v-if="abs.vis.level === 'masked'" class="w-4 h-4 shrink-0" />
          <Stethoscope v-else-if="abs.type === 'maladie'" class="w-4 h-4 shrink-0" />
          <Palmtree v-else class="w-4 h-4 shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold">{{ abs.vis.label }}</div>
            <div class="text-xs opacity-80">Journée entière · Validé par le module RH</div>
          </div>
        </div>

        <!-- Télétravail -->
        <div
          v-for="tw in day.data.teleworks"
          :key="tw.id"
          @click="$emit('open-item', { kind: 'telework', item: tw })"
          class="flex items-center gap-3 p-2.5 rounded-lg bg-teal-50 border border-[#0D9488] text-teal-950 cursor-pointer hover:bg-teal-100/70"
        >
          <Laptop class="w-4 h-4 text-[#0D9488] shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold">Télétravail · {{ tw.startTime }} – {{ tw.endTime }}</div>
            <div class="text-xs text-teal-800">{{ tw.note }}</div>
          </div>
        </div>

        <!-- Tâches Kanban -->
        <div
          v-for="task in day.data.tasks"
          :key="task.id"
          @click="$emit('open-item', { kind: 'task', item: task })"
          class="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-[#CA8A04] text-amber-950 cursor-pointer hover:bg-amber-100/70"
        >
          <CheckSquare class="w-4 h-4 text-[#CA8A04] shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold">{{ task.title }}</div>
            <div class="text-xs text-amber-800">
              Échéance Kanban · {{ task.project }} · {{ task.status }}
            </div>
          </div>
        </div>

        <!-- RDV & Événements -->
        <div
          v-for="item in day.data.timedItems"
          :key="item.kind + '-' + item.id"
          @click="$emit('open-item', { kind: item.kind, item })"
          class="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg cursor-pointer transition"
          :class="rowClasses(item)"
        >
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <Lock v-if="item.masked" class="w-4 h-4 shrink-0" />
            <Megaphone v-else-if="item.kind === 'event'" class="w-4 h-4 shrink-0" />
            <Users v-else class="w-4 h-4 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="text-sm font-bold flex items-center gap-1.5 flex-wrap">
                <span>{{ item.title }}</span>
                <span
                  v-if="item.hasConfirmedConflict"
                  class="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-900"
                >
                  <AlertTriangle class="w-3 h-3" /> Conflit
                </span>
              </div>
              <div class="text-xs opacity-90">
                {{ item.startTime }} – {{ item.endTime }}
                <span v-if="item.location"> · {{ item.location }}</span>
              </div>
            </div>
          </div>

          <div
            v-if="item.kind === 'event' && item.rsvp === 'attente' && isOwnCalendar"
            class="flex items-center gap-1.5 shrink-0"
            @click.stop
          >
            <button
              @click="$emit('quick-rsvp', { eventId: item.id, status: 'participe' })"
              class="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#007A43] text-white hover:bg-[#005730] cursor-pointer"
            >
              Je participe
            </button>
            <button
              @click="$emit('quick-rsvp', { eventId: item.id, status: 'refuse' })"
              class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Non
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="upcomingDays.length === 0"
      class="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500"
    >
      Aucune entrée sur les 10 prochains jours pour cette période.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Palmtree,
  Stethoscope,
  Lock,
  Laptop,
  CheckSquare,
  Users,
  Megaphone,
  AlertTriangle,
} from 'lucide-vue-next'
import { TODAY } from '../data/mockData'
import { getWeekDates, addDays, formatDayFull } from '../utils/dateUtils'
import { useCalendarStore } from '../composables/useCalendarStore'

const props = defineProps({
  anchorDate: { type: String, required: true },
})
defineEmits(['open-item', 'select-day', 'quick-rsvp'])

const { getDayEntries, currentUserId, viewedUserId } = useCalendarStore()
const isOwnCalendar = computed(() => currentUserId.value === viewedUserId.value)

const upcomingDays = computed(() => {
  const start = getWeekDates(props.anchorDate)[0]
  const days = Array.from({ length: 10 }, (_, i) => {
    const iso = addDays(start, i)
    return { iso, data: getDayEntries(iso) }
  })
  return days.filter(
    (d) =>
      d.iso === TODAY ||
      d.data.absences.length > 0 ||
      d.data.teleworks.length > 0 ||
      d.data.tasks.length > 0 ||
      d.data.timedItems.length > 0
  )
})

function rowClasses(item) {
  if (item.masked) return 'bg-[#64748B] text-white'
  if (item.kind === 'event') {
    return item.rsvp === 'attente'
      ? 'bg-indigo-50 text-indigo-950 border-2 border-dashed border-[#6366F1]'
      : 'bg-[#6366F1] text-white'
  }
  return 'bg-[#2563EB] text-white'
}
</script>
