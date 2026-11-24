<template>
  <div class="space-y-4">
    <div class="bg-orange-50 border border-orange-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <Palmtree class="w-6 h-6 text-[#EA580C] shrink-0 mt-0.5" />
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-[#EA580C]">
            Module RH — Écran statique de démonstration
          </div>
          <h2 class="text-lg font-bold text-slate-900">Gestion des congés, maladies et horaires</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            Conformément au principe « chacun son métier », toutes les demandes, justificatifs médicaux et validations restent dans ce module RH. Seules les absences <strong>validées</strong> remontent automatiquement dans le Calendrier.
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Soldes fictifs -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 class="text-sm font-bold text-slate-900">Soldes RH — {{ currentUser.name }}</h3>
        <div class="grid grid-cols-2 gap-2.5">
          <div class="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div class="text-xs text-orange-800 font-semibold">Congés restants</div>
            <div class="text-2xl font-black text-[#EA580C] mt-1">11 j</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div class="text-xs text-slate-600 font-semibold">Horaire contrat</div>
            <div class="text-sm font-bold text-slate-900 mt-2">
              {{ currentUser.workSchedule.start }} – {{ currentUser.workSchedule.end }}
            </div>
          </div>
        </div>
        <div class="pt-2 border-t border-slate-100 space-y-2">
          <div class="text-xs font-bold text-slate-700">Nouvelle demande (simulation statique)</div>
          <select disabled class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-500">
            <option>Demande de congé payé / Déclaration arrêt maladie</option>
          </select>
          <button
            @click="showToast('Simulation statique : dans CentRAAL, cette demande serait soumise au responsable RH avant de remonter dans le Calendrier.')"
            class="w-full py-2 rounded-lg text-xs font-bold bg-[#EA580C] text-white hover:bg-orange-700 cursor-pointer"
          >
            Simuler une demande RH
          </button>
        </div>
      </div>

      <!-- Suivi des demandes (Validées vs En attente) -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 class="text-sm font-bold text-slate-900">Suivi des demandes RH &amp; visibilité Calendrier</h3>
        <div class="space-y-2.5">
          <div
            v-for="req in RH_PORTAL_REQUESTS"
            :key="req.id"
            class="p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <div class="text-sm font-bold text-slate-900">{{ req.type }} · {{ req.dates }}</div>
              <div class="text-xs text-slate-500 mt-0.5">{{ req.note }}</div>
            </div>
            <span
              class="px-2.5 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-center"
              :class="
                req.status === 'Validé'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              "
            >
              {{ req.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Palmtree } from 'lucide-vue-next'
import { RH_PORTAL_REQUESTS } from '../data/mockData'
import { useCalendarStore } from '../composables/useCalendarStore'

defineEmits(['back-to-calendar'])
const { currentUser, showToast } = useCalendarStore()
</script>
