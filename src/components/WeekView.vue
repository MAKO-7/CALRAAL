<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
    <!-- En-tête des 7 jours -->
    <div class="grid grid-cols-[56px_repeat(7,minmax(120px,1fr))] border-b border-slate-200 bg-slate-50/80 overflow-x-auto">
      <div class="p-2 text-[11px] font-semibold text-slate-400 flex items-end justify-center border-r border-slate-200">
        Heure
      </div>
      <div
        v-for="dateStr in weekDates"
        :key="dateStr"
        @click="$emit('select-day', dateStr)"
        class="p-2.5 text-center border-r border-slate-200 last:border-r-0 cursor-pointer transition-colors hover:bg-slate-100/80"
        :class="dateStr === TODAY ? 'bg-[#e6f4ed]' : ''"
      >
        <div
          class="text-xs font-semibold uppercase tracking-wide"
          :class="dateStr === TODAY ? 'text-[#007A43]' : 'text-slate-500'"
        >
          {{ formatDayShort(dateStr).split(' ')[0] }}
        </div>
        <div class="mt-1 flex items-center justify-center gap-1">
          <span
            class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
            :class="
              dateStr === TODAY
                ? 'bg-[#007A43] text-white shadow-xs'
                : 'text-slate-800'
            "
          >
            {{ formatDayShort(dateStr).split(' ')[1] }}
          </span>
        </div>
      </div>
    </div>

    <!-- ZONE 1 : Statuts du jour (Congés, Maladies, Télétravail à l'heure) + Tâches Kanban -->
    <div class="grid grid-cols-[56px_repeat(7,minmax(120px,1fr))] border-b-2 border-slate-200 bg-slate-50/40 overflow-x-auto">
      <div class="p-1.5 text-[10px] font-semibold text-slate-500 text-center border-r border-slate-200 flex flex-col justify-center leading-tight">
        <span>Statuts</span>
        <span class="text-slate-400">&amp; Tâches</span>
      </div>
      <div
        v-for="dateStr in weekDates"
        :key="'z1-' + dateStr"
        class="p-1.5 space-y-1 border-r border-slate-200 last:border-r-0 min-h-[58px]"
        :class="dateStr === TODAY ? 'bg-[#e6f4ed]/30' : ''"
      >
        <!-- Absences RH validées -->
        <button
          v-for="abs in dayData[dateStr].absences"
          :key="abs.id"
          @click="$emit('open-item', { kind: 'absence', item: abs })"
          class="w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 border transition hover:brightness-95 cursor-pointer"
          :style="{
            backgroundColor: abs.vis.bg,
            borderColor: abs.vis.border,
            color: abs.vis.text,
          }"
        >
          <Lock v-if="abs.vis.level === 'masked'" class="w-3.5 h-3.5 shrink-0" />
          <Stethoscope v-else-if="abs.type === 'maladie'" class="w-3.5 h-3.5 shrink-0" />
          <Palmtree v-else class="w-3.5 h-3.5 shrink-0" />
          <span class="truncate">{{ abs.vis.label }}</span>
        </button>

        <!-- Télétravail (à l'heure près) -->
        <button
          v-for="tw in dayData[dateStr].teleworks"
          :key="tw.id"
          @click="$emit('open-item', { kind: 'telework', item: tw })"
          class="w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 bg-[#0D9488] text-white shadow-2xs hover:bg-[#0f766e] transition cursor-pointer"
        >
          <Laptop class="w-3.5 h-3.5 shrink-0" />
          <span class="truncate">TT · {{ tw.startTime }}–{{ tw.endTime }}</span>
        </button>

        <!-- Tâches Kanban (échéances) -->
        <button
          v-for="task in dayData[dateStr].tasks"
          :key="task.id"
          @click="$emit('open-item', { kind: 'task', item: task })"
          class="w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 bg-amber-50 border border-[#CA8A04] text-amber-900 hover:bg-amber-100 transition cursor-pointer"
        >
          <CheckSquare class="w-3.5 h-3.5 shrink-0 text-[#CA8A04]" />
          <span class="truncate" :class="task.status === 'Terminé' ? 'line-through opacity-70' : ''">
            {{ task.title }}
          </span>
        </button>
      </div>
    </div>

    <!-- ZONES 2 & 3 : Grille horaire (Fond horaire habituel + RDV & Événements côte à côte) -->
    <div class="overflow-y-auto overflow-x-auto max-h-[600px]">
      <div class="grid grid-cols-[56px_repeat(7,minmax(120px,1fr))] relative">
        <!-- Colonne des heures -->
        <div class="border-r border-slate-200 bg-white">
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-[52px] pr-2 text-right text-[11px] font-medium text-slate-400 border-b border-slate-100 flex items-start justify-end pt-1"
          >
            {{ String(hour).padStart(2, '0') }}:00
          </div>
        </div>

        <!-- Colonnes des 7 jours -->
        <div
          v-for="dateStr in weekDates"
          :key="'grid-' + dateStr"
          class="relative border-r border-slate-200 last:border-r-0"
        >
          <!-- Zone 2 : Fond horaire habituel vs hors horaire -->
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-[52px] border-b border-slate-100 transition-colors"
            :class="
              isHourInSchedule(dateStr, hour, dayData[dateStr])
                ? dateStr === TODAY
                  ? 'bg-[#e6f4ed]/15'
                  : 'bg-white'
                : 'bg-slate-100/75'
            "
          ></div>

          <!-- Voile léger si absence journée entière -->
          <div
            v-if="dayData[dateStr].absences.length > 0"
            class="absolute inset-0 pointer-events-none bg-slate-200/25"
          ></div>

          <!-- Zone 3 : Blocs RDV (Bleu) & Événements Portail (Violet pointillé / plein) -->
          <button
            v-for="item in dayData[dateStr].timedItems"
            :key="item.kind + '-' + item.id"
            @click="$emit('open-item', { kind: item.kind, item })"
            class="absolute rounded-lg px-2 py-1 text-left transition shadow-2xs overflow-hidden cursor-pointer group"
            :style="getItemPositionStyle(item)"
            :class="getItemClasses(item)"
          >
            <div class="flex items-start justify-between gap-1">
              <div class="flex items-center gap-1 min-w-0">
                <Lock v-if="item.masked" class="w-3 h-3 shrink-0" />
                <Megaphone v-else-if="item.kind === 'event'" class="w-3 h-3 shrink-0" />
                <Users v-else class="w-3 h-3 shrink-0" />
                <span class="text-[11px] font-bold leading-tight truncate">
                  {{ item.title }}
                </span>
              </div>
              <AlertTriangle
                v-if="item.hasConfirmedConflict"
                class="w-3.5 h-3.5 shrink-0 text-amber-300"
                title="Conflit horaire confirmé avec un RDV"
              />
            </div>

            <div class="text-[10px] opacity-90 mt-0.5 flex items-center gap-1 flex-wrap">
              <span>{{ item.startTime }}–{{ item.endTime }}</span>
              <Repeat
                v-if="item.kind === 'meeting' && !item.masked && item.raw.repeat !== 'aucune'"
                class="w-2.5 h-2.5 inline"
                title="Répétition simple"
              />
            </div>

            <div
              v-if="item.kind === 'event' && item.rsvp === 'attente'"
              class="mt-0.5 inline-block text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800"
            >
              À confirmer
            </div>
            <div
              v-else-if="item.kind === 'meeting' && !item.masked && item.linkedTasksCount > 0"
              class="mt-0.5 inline-flex items-center gap-0.5 text-[9.5px] font-semibold bg-white/20 px-1 rounded"
            >
              <CheckSquare class="w-2.5 h-2.5" /> {{ item.linkedTasksCount }} tâche
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
  Repeat,
  AlertTriangle,
} from 'lucide-vue-next'
import { TODAY } from '../data/mockData'
import { getWeekDates, formatDayShort, timeToMinutes } from '../utils/dateUtils'
import { useCalendarStore } from '../composables/useCalendarStore'

const props = defineProps({
  anchorDate: { type: String, required: true },
})

defineEmits(['open-item', 'select-day'])

const { getDayEntries } = useCalendarStore()

const START_HOUR = 8
const END_HOUR = 21
const HOUR_HEIGHT = 52
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

const weekDates = computed(() => getWeekDates(props.anchorDate))

const dayData = computed(() => {
  const map = {}
  for (const d of weekDates.value) {
    map[d] = getDayEntries(d)
  }
  return map
})

function isHourInSchedule(dateStr, hour, info) {
  if (!info.isWorkDay || !info.workSchedule) return false
  const hMin = hour * 60
  const sMin = timeToMinutes(info.workSchedule.start)
  const eMin = timeToMinutes(info.workSchedule.end)
  return hMin >= Math.floor(sMin / 60) * 60 && hMin < eMin
}

function getItemPositionStyle(item) {
  const startMin = Math.max(START_HOUR * 60, timeToMinutes(item.startTime))
  const endMin = Math.min(END_HOUR * 60, timeToMinutes(item.endTime))
  const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const height = Math.max(28, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2)
  const widthPct = 100 / item.totalCols
  const leftPct = item.col * widthPct

  return {
    top: `${top + 1}px`,
    height: `${height}px`,
    left: `calc(${leftPct}% + 3px)`,
    width: `calc(${widthPct}% - 6px)`,
    zIndex: item.kind === 'event' ? 15 : 10,
  }
}

function getItemClasses(item) {
  if (item.masked) {
    return 'bg-[#64748B] text-white border border-slate-500 hover:bg-slate-600'
  }
  if (item.kind === 'event') {
    if (item.rsvp === 'attente') {
      return 'bg-indigo-50/95 text-indigo-950 border-2 border-dashed border-[#6366F1] hover:bg-indigo-100'
    }
    return 'bg-[#6366F1] text-white border border-indigo-700 hover:bg-indigo-600'
  }
  return 'bg-[#2563EB] text-white border border-blue-700 hover:bg-blue-700'
}
</script>
