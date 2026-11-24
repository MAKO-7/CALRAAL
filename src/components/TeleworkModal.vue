<template>
  <div
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
      <div class="px-5 py-4 bg-[#0D9488] text-white flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Laptop class="w-5 h-5" />
          <h2 class="text-base font-bold">
            {{ existing ? 'Modifier le télétravail' : 'Poser du télétravail (à l’heure près)' }}
          </h2>
        </div>
        <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-white/15 cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <p class="text-xs text-slate-600 bg-teal-50 border border-teal-200 rounded-lg p-2.5">
          Le télétravail est géré de façon autonome dans le calendrier, à l'heure près. Il s'affiche sur votre planning en turquoise (#0D9488) sans bloquer les réunions en visioconférence.
        </p>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
          <input
            v-model="form.date"
            type="date"
            required
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Heure de début *</label>
            <input
              v-model="form.startTime"
              type="time"
              required
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Heure de fin *</label>
            <input
              v-model="form.endTime"
              type="time"
              required
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
        </div>

        <!-- Raccourcis pratiques tout en gardant la précision à l'heure -->
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            @click="setPreset('08:30', '10:30')"
            class="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            08h30 – 10h30
          </button>
          <button
            type="button"
            @click="setPreset('13:00', '17:00')"
            class="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            13h00 – 17h00
          </button>
          <button
            type="button"
            @click="setPreset('08:30', '17:00')"
            class="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            Journée (08h30 – 17h00)
          </button>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Note (facultatif)</label>
          <input
            v-model="form.note"
            type="text"
            placeholder="Ex. Télétravail matin avant réunion au stade"
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-200">
          <button
            v-if="existing"
            type="button"
            @click="handleDelete"
            class="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
          >
            Supprimer
          </button>
          <div v-else></div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0D9488] text-white hover:bg-[#0f766e] cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Laptop, X } from 'lucide-vue-next'
import { useCalendarStore } from '../composables/useCalendarStore'

const props = defineProps({
  initialDate: { type: String, required: true },
  existing: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const { saveTelework, deleteTelework } = useCalendarStore()

const form = reactive({
  id: props.existing?.id || null,
  date: props.existing?.date || props.initialDate,
  startTime: props.existing?.startTime || '13:00',
  endTime: props.existing?.endTime || '17:00',
  note: props.existing?.note || '',
})

function setPreset(s, e) {
  form.startTime = s
  form.endTime = e
}

function handleSubmit() {
  saveTelework({ ...form })
  emit('close')
}

function handleDelete() {
  if (props.existing) {
    deleteTelework(props.existing.id)
    emit('close')
  }
}
</script>
