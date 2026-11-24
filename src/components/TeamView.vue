<template>
  <div class="space-y-3">
    <!-- Filtre service + rappel confidentialité -->
    <div class="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-semibold text-slate-500">Filtrer par service :</span>
        <button
          @click="teamServiceFilter = 'ALL'"
          class="px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
          :class="
            teamServiceFilter === 'ALL'
              ? 'bg-[#007A43] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          "
        >
          Tout le club
        </button>
        <button
          v-for="srv in SERVICES"
          :key="srv"
          @click="teamServiceFilter = srv"
          class="px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
          :class="
            teamServiceFilter === srv
              ? 'bg-[#007A43] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          "
        >
          {{ srv }}
        </button>
      </div>
      <div class="text-[11px] text-slate-500 flex items-center gap-1.5">
        <ShieldCheck class="w-4 h-4 text-[#007A43]" />
        <span>Filtré selon les droits de <strong>{{ currentUser.name }}</strong></span>
      </div>
    </div>

    <!-- MODE MOBILE ("Équipe aujourd'hui") -->
    <div v-if="compactMobile" class="space-y-2">
      <div class="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
        Équipe aujourd'hui ({{ formatDayShort(anchorDate) }})
      </div>
      <div
        v-for="u in filteredUsers"
        :key="'mob-' + u.id"
        @click="$emit('view-user-calendar', u.id)"
        class="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-[#007A43]"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="relative shrink-0">
            <div class="w-9 h-9 rounded-full bg-[#e6f4ed] text-[#007A43] font-bold text-xs flex items-center justify-center">
              {{ u.initials }}
            </div>
            <span
              class="w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5"
              :style="{ backgroundColor: statusColor(u.profileStatus) }"
            ></span>
          </div>
          <div class="min-w-0">
            <div class="text-sm font-bold text-slate-900 truncate">{{ u.name }}</div>
            <div class="text-xs text-slate-500 truncate">{{ u.service }}</div>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span
            v-if="cellFor(u.id, anchorDate).absences.length > 0"
            class="inline-block px-2 py-1 rounded-md text-xs font-semibold border"
            :style="{
              backgroundColor: cellFor(u.id, anchorDate).absences[0].vis.bg,
              borderColor: cellFor(u.id, anchorDate).absences[0].vis.border,
              color: cellFor(u.id, anchorDate).absences[0].vis.text,
            }"
          >
            {{ cellFor(u.id, anchorDate).absences[0].vis.label }}
          </span>
          <span
            v-else-if="cellFor(u.id, anchorDate).teleworks.length > 0"
            class="inline-block px-2 py-1 rounded-md text-xs font-semibold bg-[#0D9488] text-white"
          >
            TT {{ cellFor(u.id, anchorDate).teleworks[0].startTime }}–{{ cellFor(u.id, anchorDate).teleworks[0].endTime }}
          </span>
          <span
            v-else
            class="inline-block px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
          >
            Au club · {{ cellFor(u.id, anchorDate).timedItems.length }} créneau(x)
          </span>
        </div>
      </div>
    </div>

    <!-- MODE DESKTOP : Planning Équipe (Personnes en lignes, Jours en colonnes) -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
      <table class="w-full border-collapse min-w-[820px]">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="p-3 text-left text-xs font-bold text-slate-600 w-[210px] border-r border-slate-200">
              Membre &amp; Statut
            </th>
            <th
              v-for="dateStr in weekDates"
              :key="'th-' + dateStr"
              class="p-2.5 text-center text-xs font-bold border-r border-slate-200 last:border-r-0"
              :class="dateStr === TODAY ? 'bg-[#e6f4ed] text-[#007A43]' : 'text-slate-600'"
            >
              {{ formatDayShort(dateStr) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in filteredUsers"
            :key="u.id"
            class="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/60"
          >
            <td class="p-2.5 border-r border-slate-200 align-top">
              <button
                @click="$emit('view-user-calendar', u.id)"
                class="w-full text-left flex items-center gap-2.5 group cursor-pointer"
              >
                <div class="relative shrink-0">
                  <div class="w-8 h-8 rounded-full bg-[#e6f4ed] text-[#007A43] font-bold text-xs flex items-center justify-center group-hover:bg-[#007A43] group-hover:text-white transition">
                    {{ u.initials }}
                  </div>
                  <span
                    class="w-2.5 h-2.5 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5"
                    :style="{ backgroundColor: statusColor(u.profileStatus) }"
                    :title="statusLabel(u.profileStatus)"
                  ></span>
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-bold text-slate-900 group-hover:text-[#007A43] truncate">
                    {{ u.name }}
                  </div>
                  <div class="text-[10.5px] text-slate-500 truncate">{{ u.service }}</div>
                </div>
              </button>
            </td>

            <td
              v-for="dateStr in weekDates"
              :key="u.id + '-' + dateStr"
              class="p-1.5 border-r border-slate-200 last:border-r-0 align-top min-w-[100px]"
              :class="[
                !cellFor(u.id, dateStr).isWorkDay ? 'bg-slate-100/70' : '',
                dateStr === TODAY ? 'bg-[#e6f4ed]/25' : '',
              ]"
            >
              <div class="space-y-1">
                <!-- Absence -->
                <div
                  v-for="abs in cellFor(u.id, dateStr).absences"
                  :key="abs.id"
                  class="px-1.5 py-1 rounded text-[10.5px] font-semibold flex items-center gap-1 border"
                  :style="{
                    backgroundColor: abs.vis.bg,
                    borderColor: abs.vis.border,
                    color: abs.vis.text,
                  }"
                >
                  <Lock v-if="abs.vis.level === 'masked'" class="w-3 h-3 shrink-0" />
                  <Stethoscope v-else-if="abs.type === 'maladie'" class="w-3 h-3 shrink-0" />
                  <Palmtree v-else class="w-3 h-3 shrink-0" />
                  <span class="truncate">{{ abs.vis.label }}</span>
                </div>

                <!-- Télétravail -->
                <div
                  v-for="tw in cellFor(u.id, dateStr).teleworks"
                  :key="tw.id"
                  class="px-1.5 py-1 rounded text-[10px] font-semibold bg-[#0D9488] text-white flex items-center gap-1"
                >
                  <Laptop class="w-3 h-3 shrink-0" />
                  <span class="truncate">{{ tw.startTime }}–{{ tw.endTime }}</span>
                </div>

                <!-- Présence / RDV résumés -->
                <div
                  v-for="item in cellFor(u.id, dateStr).timedItems.slice(0, 2)"
                  :key="item.kind + '-' + item.id"
                  @click="$emit('open-item', { kind: item.kind, item })"
                  class="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer"
                  :class="miniClass(item)"
                >
                  {{ item.startTime }} {{ item.title }}
                </div>

                <div
                  v-if="
                    cellFor(u.id, dateStr).isWorkDay &&
                    cellFor(u.id, dateStr).absences.length === 0 &&
                    cellFor(u.id, dateStr).teleworks.length === 0 &&
                    cellFor(u.id, dateStr).timedItems.length === 0
                  "
                  class="text-[10px] text-slate-400 px-1 py-0.5"
                >
                  Au club
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ShieldCheck, Palmtree, Stethoscope, Lock, Laptop } from 'lucide-vue-next'
import { TODAY, SERVICES, PROFILE_STATUSES } from '../data/mockData'
import { getWeekDates, formatDayShort } from '../utils/dateUtils'
import { useCalendarStore } from '../composables/useCalendarStore'

const props = defineProps({
  anchorDate: { type: String, required: true },
  compactMobile: { type: Boolean, default: false },
})
defineEmits(['view-user-calendar', 'open-item'])

const { users, currentUser, teamServiceFilter, getDayEntries } = useCalendarStore()

const weekDates = computed(() => getWeekDates(props.anchorDate))

const filteredUsers = computed(() => {
  if (teamServiceFilter.value === 'ALL') return users.value
  return users.value.filter((u) => u.service === teamServiceFilter.value)
})

function cellFor(userId, dateStr) {
  return getDayEntries(dateStr, userId)
}

function statusColor(key) {
  return PROFILE_STATUSES.find((s) => s.key === key)?.dot || '#16A34A'
}

function statusLabel(key) {
  return PROFILE_STATUSES.find((s) => s.key === key)?.label || 'Disponible'
}

function miniClass(item) {
  if (item.masked) return 'bg-slate-200 text-slate-700'
  if (item.kind === 'event') {
    return item.rsvp === 'attente'
      ? 'bg-indigo-50 text-indigo-800 border border-dashed border-[#6366F1]'
      : 'bg-[#6366F1] text-white'
  }
  return 'bg-blue-50 text-blue-900 border border-blue-200'
}
</script>
