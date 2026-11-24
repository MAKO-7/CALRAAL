<template>
  <div class="space-y-4">
    <div class="bg-indigo-50 border border-indigo-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <Megaphone class="w-6 h-6 text-[#6366F1] shrink-0 mt-0.5" />
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-[#6366F1]">
            Module Portail — Page d'accueil &amp; Création d'événements
          </div>
          <h2 class="text-lg font-bold text-slate-900">Actualités internes &amp; Événements du club</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            Seul le Portail crée les événements du club. Si vous avez cliqué « Je ne participe pas » dans votre calendrier, l'événement disparaît de votre agenda mais reste consultable ici à tout moment.
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

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="ev in visibleEvents"
        :key="ev.id"
        class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between gap-3"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span
              class="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              :class="
                ev.targetType === 'public'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              "
            >
              {{
                ev.targetType === 'public'
                  ? 'Public (tout le club)'
                  : 'Ciblé : ' + ev.targetServices.join(', ')
              }}
            </span>
            <span class="text-xs font-semibold text-slate-500">
              {{ ev.date }} · {{ ev.startTime }}–{{ ev.endTime }}
            </span>
          </div>

          <h3 class="text-base font-bold text-slate-900">{{ ev.title }}</h3>
          <p class="text-xs text-slate-600 leading-relaxed">{{ ev.summary }}</p>
          <div class="text-xs text-slate-500 flex items-center gap-3">
            <span>📍 {{ ev.location }}</span>
            <span>❤️ {{ ev.likes }} j'aime</span>
            <span>💬 {{ ev.commentsCount }} commentaires</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs text-slate-500">
            Statut calendrier :
            <strong class="text-slate-900">
              {{
                rsvpOf(ev) === 'participe'
                  ? 'Je participe'
                  : rsvpOf(ev) === 'refuse'
                    ? 'Masqué (refusé)'
                    : 'À confirmer'
              }}
            </strong>
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="setPortalParticipation(ev.id, 'participe')"
              class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
              :class="
                rsvpOf(ev) === 'participe'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
              "
            >
              Je participe
            </button>
            <button
              @click="setPortalParticipation(ev.id, 'refuse')"
              class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
              :class="
                rsvpOf(ev) === 'refuse'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
              "
            >
              Ne pas participer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Megaphone } from 'lucide-vue-next'
import { useCalendarStore } from '../composables/useCalendarStore'

defineEmits(['back-to-calendar'])

const { currentUserId, getVisiblePortalEventsForCurrentUser, setPortalParticipation } =
  useCalendarStore()

const visibleEvents = computed(() => getVisiblePortalEventsForCurrentUser())

function rsvpOf(ev) {
  return ev.participations[currentUserId.value] || 'attente'
}
</script>
