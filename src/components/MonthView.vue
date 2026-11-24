<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
      <div
        v-for="d in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']"
        :key="d"
        class="py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 border-r border-slate-200 last:border-r-0"
      >
        {{ d }}
      </div>
    </div>

    <div class="grid grid-cols-7">
      <div
        v-for="cell in monthCells"
        :key="cell.iso"
        class="min-h-[112px] p-1.5 border-r border-b border-slate-200 last:border-r-0 flex flex-col gap-1 transition"
        :class="[
          cell.inMonth ? 'bg-white' : 'bg-slate-50/70 opacity-65',
          cell.iso === TODAY ? 'ring-2 ring-inset ring-[#007A43] bg-[#e6f4ed]/35' : '',
        ]"
      >
        <div class="flex items-center justify-between">
          <button
            @click="$emit('select-day', cell.iso)"
            class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition cursor-pointer"
            :class="
              cell.iso === TODAY
                ? 'bg-[#007A43] text-white'
                : 'text-slate-700 hover:bg-slate-200'
            "
          >
            {{ cell.dayNum }}
          </button>
          <span
            v-if="cell.data.teleworks.length > 0"
            class="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-[#0D9488] border border-teal-200"
          >
            TT
          </span>
        </div>

        <div class="space-y-1 overflow-hidden">
          <button
            v-for="abs in cell.data.absences"
            :key="abs.id"
            @click="$emit('open-item', { kind: 'absence', item: abs })"
            class="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border cursor-pointer"
            :style="{
              backgroundColor: abs.vis.bg,
              borderColor: abs.vis.border,
              color: abs.vis.text,
            }"
          >
            {{ abs.vis.label }}
          </button>

          <button
            v-for="task in cell.data.tasks.slice(0, 1)"
            :key="task.id"
            @click="$emit('open-item', { kind: 'task', item: task })"
            class="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate bg-amber-50 border border-[#CA8A04] text-amber-900 cursor-pointer"
          >
            ☐ {{ task.title }}
          </button>

          <button
            v-for="item in cell.data.timedItems.slice(0, 2)"
            :key="item.kind + '-' + item.id"
            @click="$emit('open-item', { kind: item.kind, item })"
            class="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate cursor-pointer"
            :class="badgeClass(item)"
          >
            {{ item.startTime }} {{ item.title }}
          </button>

          <button
            v-if="cell.data.timedItems.length > 2"
            @click="$emit('select-day', cell.iso)"
            class="text-[10px] font-semibold text-[#007A43] hover:underline pl-1 cursor-pointer"
          >
            +{{ cell.data.timedItems.length - 2 }} autres
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TODAY } from '../data/mockData'
import { getMonthGridDates } from '../utils/dateUtils'
import { useCalendarStore } from '../composables/useCalendarStore'

const props = defineProps({
  anchorDate: { type: String, required: true },
})
defineEmits(['open-item', 'select-day'])

const { getDayEntries } = useCalendarStore()

const monthCells = computed(() =>
  getMonthGridDates(props.anchorDate).map((c) => ({
    ...c,
    data: getDayEntries(c.iso),
  }))
)

function badgeClass(item) {
  if (item.masked) return 'bg-[#64748B] text-white'
  if (item.kind === 'event') {
    return item.rsvp === 'attente'
      ? 'bg-indigo-50 text-indigo-900 border border-dashed border-[#6366F1]'
      : 'bg-[#6366F1] text-white'
  }
  return 'bg-[#2563EB] text-white'
}
</script>
