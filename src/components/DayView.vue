<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    <!-- En-tête du jour -->
    <div
      class="px-4 py-3 border-b border-slate-200 flex items-center justify-between"
      :class="anchorDate === TODAY ? 'bg-[#e6f4ed]' : 'bg-slate-50'"
    >
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-[#007A43]">
          {{ anchorDate === TODAY ? "Aujourd'hui" : 'Vue journalière (3 zones)' }}
        </div>
        <h3 class="text-base font-bold text-slate-900 capitalize">
          {{ formatDayFull(anchorDate) }}
        </h3>
      </div>
      <div class="text-xs text-slate-500 font-medium">
        <span v-if="dayInfo.isWorkDay">
          Horaire habituel : {{ dayInfo.workSchedule.start }} – {{ dayInfo.workSchedule.end }}
        </span>
        <span v-else>Jour non travaillé (horaire de base)</span>
      </div>
    </div>

    <!-- Zone 1 : Statuts & Tâches -->
    <div class="p-3 bg-slate-50/70 border-b-2 border-slate-200">
      <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
        Zone 1 — Statuts du jour &amp; Échéances de tâches
      </div>
      <div
        v-if="
          dayInfo.absences.length === 0 &&
          dayInfo.teleworks.length === 0 &&
          dayInfo.tasks.length === 0
        "
        class="text-xs text-slate-400 italic"
      >
        Aucune absence, télétravail ou tâche à échéance ce jour.
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="abs in dayInfo.absences"
          :key="abs.id"
          @click="$emit('open-item', { kind: 'absence', item: abs })"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border cursor-pointer"
          :style="{
            backgroundColor: abs.vis.bg,
            borderColor: abs.vis.border,
            color: abs.vis.text,
          }"
        >
          <Lock v-if="abs.vis.level === 'masked'" class="w-4 h-4" />
          <Stethoscope v-else-if="abs.type === 'maladie'" class="w-4 h-4" />
          <Palmtree v-else class="w-4 h-4" />
          <span>{{ abs.vis.label }} (journée)</span>
        </button>

        <button
          v-for="tw in dayInfo.teleworks"
          :key="tw.id"
          @click="$emit('open-item', { kind: 'telework', item: tw })"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 bg-[#0D9488] text-white hover:bg-[#0f766e] cursor-pointer"
        >
          <Laptop class="w-4 h-4" />
          <span>Télétravail · {{ tw.startTime }} – {{ tw.endTime }}</span>
        </button>

        <button
          v-for="task in dayInfo.tasks"
          :key="task.id"
          @click="$emit('open-item', { kind: 'task', item: task })"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 bg-amber-50 border border-[#CA8A04] text-amber-900 hover:bg-amber-100 cursor-pointer"
        >
          <CheckSquare class="w-4 h-4 text-[#CA8A04]" />
          <span>{{ task.title }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80">{{ task.status }}</span>
        </button>
      </div>
    </div>

    <!-- Zones 2 & 3 : Grille horaire détaillée -->
    <div class="overflow-y-auto max-h-[560px]">
      <div class="grid grid-cols-[64px_1fr] relative">
        <div class="border-r border-slate-200 bg-white">
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-[58px] pr-2.5 text-right text-xs font-medium text-slate-400 border-b border-slate-100 pt-1"
          >
            {{ String(hour).padStart(2, '0') }}:00
          </div>
        </div>

        <div class="relative">
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-[58px] border-b border-slate-100"
            :class="isHourInSchedule(hour) ? 'bg-white' : 'bg-slate-100/75'"
          ></div>

          <button
            v-for="item in dayInfo.timedItems"
            :key="item.kind + '-' + item.id"
            @click="$emit('open-item', { kind: item.kind, item })"
            class="absolute rounded-xl px-3 py-2 text-left transition shadow-xs overflow-hidden cursor-pointer"
            :style="getItemStyle(item)"
            :class="getItemClasses(item)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <Lock v-if="item.masked" class="w-4 h-4 shrink-0" />
                <Megaphone v-else-if="item.kind === 'event'" class="w-4 h-4 shrink-0" />
                <Users v-else class="w-4 h-4 shrink-0" />
                <span class="text-sm font-bold truncate">{{ item.title }}</span>
              </div>
              <span
                v-if="item.hasConfirmedConflict"
                class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 shrink-0"
              >
                <AlertTriangle class="w-3 h-3" /> Conflit
              </span>
            </div>
            <div class="text-xs opacity-90 mt-1 flex items-center gap-2 flex-wrap">
              <span>{{ item.startTime }} – {{ item.endTime }}</span>
              <span v-if="item.location">· {{ item.location }}</span>
              <span
                v-if="item.kind === 'event' && item.rsvp === 'attente'"
                class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-semibold"
              >
                Non bloquant · À confirmer
              </span>
            </div>
          </button>
        </div>
      </div>
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
import { formatDayFull, timeToMinutes } from '../utils/dateUtils'
import { useCalendarStore } from '../composables/useCalendarStore'

const props = defineProps({
  anchorDate: { type: String, required: true },
})
defineEmits(['open-item'])

const { getDayEntries } = useCalendarStore()
const START_HOUR = 8
const END_HOUR = 21
const HOUR_HEIGHT = 58
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

const dayInfo = computed(() => getDayEntries(props.anchorDate))

function isHourInSchedule(hour) {
  if (!dayInfo.value.isWorkDay || !dayInfo.value.workSchedule) return false
  const hMin = hour * 60
  const sMin = timeToMinutes(dayInfo.value.workSchedule.start)
  const eMin = timeToMinutes(dayInfo.value.workSchedule.end)
  return hMin >= Math.floor(sMin / 60) * 60 && hMin < eMin
}

function getItemStyle(item) {
  const startMin = Math.max(START_HOUR * 60, timeToMinutes(item.startTime))
  const endMin = Math.min(END_HOUR * 60, timeToMinutes(item.endTime))
  const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const height = Math.max(44, ((endMin - startMin) / 60) * HOUR_HEIGHT - 3)
  const widthPct = 100 / item.totalCols
  const leftPct = item.col * widthPct
  return {
    top: `${top + 2}px`,
    height: `${height}px`,
    left: `calc(${leftPct}% + 6px)`,
    width: `calc(${widthPct}% - 12px)`,
    zIndex: item.kind === 'event' ? 15 : 10,
  }
}

function getItemClasses(item) {
  if (item.masked) return 'bg-[#64748B] text-white border border-slate-500'
  if (item.kind === 'event') {
    if (item.rsvp === 'attente') {
      return 'bg-indigo-50 text-indigo-950 border-2 border-dashed border-[#6366F1] hover:bg-indigo-100'
    }
    return 'bg-[#6366F1] text-white border border-indigo-700'
  }
  return 'bg-[#2563EB] text-white border border-blue-700'
}
</script>
