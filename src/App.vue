<template>
  <div class="min-h-screen flex flex-col bg-slate-100 text-slate-900">
    <!-- BARRE SUPÉRIEURE CENTRAAL (Vert RAAL #007A43 + Logo RAAL La Louvière) -->
    <header class="bg-[#007A43] text-white shadow-sm sticky top-0 z-40">
      <div class="max-w-[1440px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2">
        <!-- Logo RAAL + Identité CentRAAL -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            @click="activeModule = 'calendar'"
            class="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <RaalLogo size-class="w-9 h-10 drop-shadow-xs group-hover:scale-105 transition" />
            <div class="text-left leading-tight">
              <div class="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                <span>CentRAAL</span>
                <span class="hidden sm:inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/15 text-emerald-100">
                  Maquette
                </span>
              </div>
              <div class="text-[10.5px] text-emerald-100/90 hidden sm:block">
                RAAL La Louvière · Intranet du club
              </div>
            </div>
          </button>

          <!-- Navigation modules (desktop) -->
          <nav class="hidden lg:flex items-center gap-1 ml-4 bg-black/15 p-1 rounded-xl">
            <button
              v-for="tab in moduleTabs"
              :key="tab.key"
              @click="activeModule = tab.key"
              class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              :class="
                activeModule === tab.key
                  ? 'bg-white text-[#007A43] shadow-xs'
                  : 'text-emerald-50 hover:bg-white/10'
              "
            >
              <component :is="tab.icon" class="w-3.5 h-3.5" />
              <span>{{ tab.label }}</span>
            </button>
          </nav>
        </div>

        <!-- Contrôles droite : Mode Mobile PWA, Statut Profil, Cloche Notifs, Sélecteur Profil Démo -->
        <div class="flex items-center gap-1.5 sm:gap-2.5">
          <!-- Bouton Aperçu Mobile PWA (desktop uniquement, idéal pour l'entretien) -->
          <button
            @click="toggleMobilePreview"
            class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer"
            :class="
              mobilePreviewMode
                ? 'bg-white text-[#007A43] border-white'
                : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
            "
            title="Basculer entre affichage PC et aperçu téléphone (PWA)"
          >
            <Smartphone class="w-3.5 h-3.5" />
            <span>{{ mobilePreviewMode ? 'Quitter Mobile' : 'Aperçu Mobile' }}</span>
          </button>

          <!-- Sélecteur de Statut Profil (Disponible / Occupé / Indisponible) -->
          <div class="relative">
            <button
              @click="statusMenuOpen = !statusMenuOpen; notifMenuOpen = false; userMenuOpen = false"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-xs font-semibold transition cursor-pointer"
              title="Statut de disponibilité sur votre profil"
            >
              <span
                class="w-2.5 h-2.5 rounded-full ring-2 ring-white/80"
                :style="{ backgroundColor: currentStatusObj.dot }"
              ></span>
              <span class="hidden sm:inline">{{ currentStatusObj.label }}</span>
              <ChevronDown class="w-3 h-3 opacity-80" />
            </button>

            <div
              v-if="statusMenuOpen"
              class="absolute right-0 mt-2 w-60 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 p-1.5 z-50"
            >
              <div class="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                Statut du profil (Socle commun)
              </div>
              <button
                v-for="st in PROFILE_STATUSES"
                :key="st.key"
                @click="setProfileStatus(st.key); statusMenuOpen = false"
                class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                :class="currentUser.profileStatus === st.key ? 'bg-slate-100 font-bold' : ''"
              >
                <span class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: st.dot }"></span>
                  <span>{{ st.label }}</span>
                </span>
                <span class="text-[10px] text-slate-400">
                  {{
                    st.key === 'occupe'
                      ? 'Travail tâches'
                      : st.key === 'indisponible'
                        ? 'En réunion'
                        : 'Libre'
                  }}
                </span>
              </button>
            </div>
          </div>

          <!-- Cloche Notifications in-app -->
          <div class="relative">
            <button
              @click="notifMenuOpen = !notifMenuOpen; statusMenuOpen = false; userMenuOpen = false"
              class="relative p-2 rounded-lg bg-black/20 hover:bg-black/30 transition cursor-pointer"
              title="Notifications dans l'application"
            >
              <Bell class="w-4 h-4" />
              <span
                v-if="unreadNotifCount > 0"
                class="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#007A43]"
              >
                {{ unreadNotifCount }}
              </span>
            </button>

            <div
              v-if="notifMenuOpen"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
            >
              <div class="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800">Notifications CentRAAL</span>
                <button
                  v-if="unreadNotifCount > 0"
                  @click="markAllNotificationsRead"
                  class="text-[11px] font-semibold text-[#007A43] hover:underline cursor-pointer"
                >
                  Tout marquer comme lu
                </button>
              </div>
              <div class="max-h-72 overflow-y-auto divide-y divide-slate-100">
                <button
                  v-for="n in myNotifications"
                  :key="n.id"
                  @click="openNotification(n)"
                  class="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition flex items-start gap-2.5 cursor-pointer"
                  :class="!n.read ? 'bg-emerald-50/50' : ''"
                >
                  <span
                    class="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    :class="!n.read ? 'bg-[#007A43]' : 'bg-slate-300'"
                  ></span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-slate-900">{{ n.title }}</div>
                    <div class="text-[11.5px] text-slate-600 mt-0.5">{{ n.message }}</div>
                    <div class="text-[10px] text-slate-400 mt-1">{{ n.time }}</div>
                  </div>
                </button>
                <div
                  v-if="myNotifications.length === 0"
                  class="p-6 text-center text-xs text-slate-400"
                >
                  Aucune notification pour ce profil.
                </div>
              </div>
            </div>
          </div>

          <!-- Sélecteur de Profil Démo (permet de tester la matrice des droits en 1 clic !) -->
          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen; statusMenuOpen = false; notifMenuOpen = false"
              class="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 transition cursor-pointer"
              title="Changer de profil fictif pour tester les droits"
            >
              <div class="w-7 h-7 rounded-full bg-white text-[#007A43] font-black text-xs flex items-center justify-center">
                {{ currentUser.initials }}
              </div>
              <div class="text-left hidden md:block leading-tight">
                <div class="text-xs font-bold">{{ currentUser.name }}</div>
                <div class="text-[10px] text-emerald-100">{{ currentUser.service }}</div>
              </div>
              <ChevronDown class="w-3.5 h-3.5 opacity-80" />
            </button>

            <div
              v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 p-1.5 z-50"
            >
              <div class="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#007A43]">
                Changer de profil (Tester les droits)
              </div>
              <button
                v-for="u in users"
                :key="u.id"
                @click="switchCurrentUser(u.id); userMenuOpen = false"
                class="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 hover:bg-slate-100 transition cursor-pointer"
                :class="u.id === currentUserId ? 'bg-[#e6f4ed]' : ''"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-7 h-7 rounded-full bg-[#007A43] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    {{ u.initials }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-slate-900 truncate">{{ u.name }}</div>
                    <div class="text-[10.5px] text-slate-500 truncate">{{ u.jobTitle }} · {{ u.service }}</div>
                  </div>
                </div>
                <span
                  v-if="u.role === 'manager' || u.role === 'rh'"
                  class="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0"
                >
                  {{ u.role }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sous-navigation mobile modules -->
      <div class="lg:hidden bg-[#005730] px-2 py-1.5 flex items-center justify-around gap-1 overflow-x-auto">
        <button
          v-for="tab in moduleTabs"
          :key="'m-' + tab.key"
          @click="activeModule = tab.key"
          class="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          :class="activeModule === tab.key ? 'bg-white text-[#007A43]' : 'text-emerald-100'"
        >
          <component :is="tab.icon" class="w-3.5 h-3.5" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </header>

    <!-- CONTENEUR PRINCIPAL (s'adapte en cadre smartphone 395px si Aperçu Mobile activé) -->
    <main
      class="flex-1 w-full mx-auto px-3 sm:px-5 py-4 transition-all"
      :class="
        mobilePreviewMode
          ? 'max-w-[410px] my-4 bg-slate-50 rounded-[32px] border-[6px] border-slate-800 shadow-2xl pb-20 relative'
          : 'max-w-[1440px] pb-20 md:pb-8'
      "
    >
      <!-- Bannière info si Aperçu Mobile PWA actif -->
      <div
        v-if="mobilePreviewMode"
        class="mb-3 px-3 py-2 rounded-xl bg-[#e6f4ed] border border-[#007A43]/30 text-[11px] text-[#005730] flex items-center justify-between"
      >
        <span class="font-bold flex items-center gap-1.5">
          <Smartphone class="w-3.5 h-3.5" /> Aperçu Téléphone (PWA)
        </span>
        <span class="text-[10px]">Vue adaptative</span>
      </div>

      <!-- MODULES SECONDAIRES (Portail RH / Kanban / Portail Club) -->
      <RhStaticView
        v-if="activeModule === 'rh'"
        @back-to-calendar="activeModule = 'calendar'"
      />
      <KanbanStaticView
        v-else-if="activeModule === 'kanban'"
        @back-to-calendar="activeModule = 'calendar'"
      />
      <PortalStaticView
        v-else-if="activeModule === 'portail'"
        @back-to-calendar="activeModule = 'calendar'"
      />

      <!-- MODULE CALENDRIER PRINCIPAL -->
      <div v-else class="space-y-3.5">
        <!-- Bannière si on consulte le calendrier d'un collègue -->
        <div
          v-if="viewedUserId !== currentUserId && effectiveView !== 'team'"
          class="bg-slate-800 text-white rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap text-xs"
        >
          <div class="flex items-center gap-2">
            <Eye class="w-4 h-4 text-emerald-400" />
            <span>
              Vous consultez le calendrier de <strong>{{ viewedUser.name }}</strong> ({{ viewedUser.service }}) —
              filtré selon les droits de <strong>{{ currentUser.name }}</strong>.
            </span>
          </div>
          <button
            @click="setViewedUser(currentUserId)"
            class="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-bold cursor-pointer"
          >
            Revenir à mon calendrier
          </button>
        </div>

        <!-- Barre d'outils du Calendrier -->
        <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2.5">
            <!-- Navigation dates -->
            <div class="flex items-center gap-1.5">
              <button
                @click="goToToday"
                class="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#007A43] text-[#007A43] hover:bg-[#e6f4ed] transition cursor-pointer"
              >
                Aujourd'hui
              </button>
              <button
                @click="stepDate(-1)"
                class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                aria-label="Période précédente"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button
                @click="stepDate(1)"
                class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                aria-label="Période suivante"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
              <h1 class="text-sm sm:text-base font-extrabold text-slate-900 ml-1 capitalize">
                {{ periodHeading }}
              </h1>
            </div>

            <!-- Sélecteur de vues (5 vues PC / 3 vues adaptatives Mobile) -->
            <div
              v-if="!isCompactMobile"
              class="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200"
            >
              <button
                v-for="v in desktopViews"
                :key="v.key"
                @click="activeView = v.key"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                :class="
                  activeView === v.key
                    ? 'bg-[#007A43] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                "
              >
                {{ v.label }}
              </button>
            </div>
          </div>

          <!-- Ligne 2 : Sélecteur "Calendrier de..." + Boutons d'action + Légende couleurs -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div class="flex items-center gap-2 flex-wrap">
              <div v-if="effectiveView !== 'team'" class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-slate-500">Agenda :</span>
                <select
                  :value="viewedUserId"
                  @change="setViewedUser($event.target.value)"
                  class="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007A43]"
                >
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.id === currentUserId ? 'Mon calendrier (' + u.name + ')' : u.name + ' · ' + u.service }}
                  </option>
                </select>
              </div>

              <button
                @click="showLegend = !showLegend"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <Palette class="w-3.5 h-3.5 text-[#007A43]" />
                <span>Charte couleurs</span>
              </button>
            </div>

            <!-- Actions principales -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                @click="openNewMeeting"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#007A43] text-white hover:bg-[#005730] shadow-2xs transition cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Nouveau RDV</span>
              </button>
              <button
                @click="openNewTelework"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0D9488] text-white hover:bg-[#0f766e] shadow-2xs transition cursor-pointer"
              >
                <Laptop class="w-3.5 h-3.5" />
                <span>Télétravail</span>
              </button>
              <button
                @click="activeModule = 'rh'"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-[#EA580C] border border-orange-300 hover:bg-orange-100 transition cursor-pointer"
                title="Redirige vers le module RH pour demander un congé ou déclarer une maladie"
              >
                <Palmtree class="w-3.5 h-3.5" />
                <span>Congé / Maladie (RH)</span>
              </button>
            </div>
          </div>

          <!-- Tiroir Charte Graphique & Signification des 8 couleurs -->
          <div
            v-if="showLegend"
            class="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
          >
            <div
              v-for="c in COLOR_CHART"
              :key="c.key"
              class="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2"
            >
              <span
                class="w-3.5 h-3.5 rounded-xs mt-0.5 shrink-0"
                :style="{ backgroundColor: c.hex }"
              ></span>
              <div class="min-w-0">
                <div class="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{{ c.label }}</span>
                  <span class="text-[10px] font-normal text-slate-400">{{ c.hex }}</span>
                </div>
                <div class="text-[10px] text-slate-500 leading-snug mt-0.5">{{ c.rule }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- VUE CALENDRIER ACTIVE -->
        <WeekView
          v-if="effectiveView === 'week'"
          :anchor-date="currentDate"
          @open-item="selectedDetail = $event"
          @select-day="jumpToDay"
        />
        <MonthView
          v-else-if="effectiveView === 'month'"
          :anchor-date="currentDate"
          @open-item="selectedDetail = $event"
          @select-day="jumpToDay"
        />
        <DayView
          v-else-if="effectiveView === 'day'"
          :anchor-date="currentDate"
          @open-item="selectedDetail = $event"
        />
        <ListView
          v-else-if="effectiveView === 'list'"
          :anchor-date="currentDate"
          @open-item="selectedDetail = $event"
          @select-day="jumpToDay"
          @quick-rsvp="handleQuickRsvp"
        />
        <TeamView
          v-else-if="effectiveView === 'team'"
          :anchor-date="currentDate"
          :compact-mobile="isCompactMobile"
          @view-user-calendar="openColleagueCalendar"
          @open-item="selectedDetail = $event"
        />
      </div>

      <!-- BARRE DE NAVIGATION MOBILE EN BAS (PWA — visible sur mobile ou en Aperçu Mobile) -->
      <nav
        v-if="activeModule === 'calendar' && isCompactMobile"
        class="bg-white border-t border-slate-200 flex items-center justify-around py-2 px-1 z-30"
        :class="
          mobilePreviewMode
            ? 'sticky bottom-0 -mx-3 rounded-b-[26px] shadow-inner'
            : 'fixed bottom-0 left-0 right-0 shadow-lg md:hidden'
        "
      >
        <button
          @click="activeView = 'day'"
          class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
          :class="effectiveView === 'day' ? 'text-[#007A43]' : 'text-slate-500'"
        >
          <Calendar class="w-4 h-4" />
          <span>Jour</span>
        </button>
        <button
          @click="activeView = 'list'"
          class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
          :class="effectiveView === 'list' ? 'text-[#007A43]' : 'text-slate-500'"
        >
          <List class="w-4 h-4" />
          <span>Liste</span>
        </button>
        <button
          @click="activeView = 'team'"
          class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
          :class="effectiveView === 'team' ? 'text-[#007A43]' : 'text-slate-500'"
        >
          <Users class="w-4 h-4" />
          <span>Équipe</span>
        </button>
        <button
          @click="openNewMeeting"
          class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-bold text-[#007A43] cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>RDV</span>
        </button>
      </nav>
    </main>

    <!-- MODALES -->
    <MeetingModal
      v-if="showMeetingModal"
      :initial-date="currentDate"
      @close="showMeetingModal = false"
    />
    <TeleworkModal
      v-if="showTeleworkModal"
      :initial-date="currentDate"
      :existing="editingTelework"
      @close="showTeleworkModal = false; editingTelework = null"
    />
    <DetailModal
      v-if="selectedDetail"
      :selection="selectedDetail"
      @close="selectedDetail = null"
      @open-module="goToModule"
      @edit-telework="startEditTelework"
    />

    <!-- TOAST RETOUR ACTION -->
    <Transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-16 md:bottom-5 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 max-w-sm"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Calendar,
  Megaphone,
  Kanban,
  Palmtree,
  Smartphone,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Laptop,
  Palette,
  Eye,
  List,
  Users,
} from 'lucide-vue-next'
import RaalLogo from './components/RaalLogo.vue'
import WeekView from './components/WeekView.vue'
import DayView from './components/DayView.vue'
import MonthView from './components/MonthView.vue'
import ListView from './components/ListView.vue'
import TeamView from './components/TeamView.vue'
import MeetingModal from './components/MeetingModal.vue'
import TeleworkModal from './components/TeleworkModal.vue'
import DetailModal from './components/DetailModal.vue'
import RhStaticView from './components/RhStaticView.vue'
import KanbanStaticView from './components/KanbanStaticView.vue'
import PortalStaticView from './components/PortalStaticView.vue'
import { TODAY, COLOR_CHART, PROFILE_STATUSES } from './data/mockData'
import {
  addDays,
  formatWeekRange,
  formatMonthTitle,
  formatDayFull,
} from './utils/dateUtils'
import { useCalendarStore } from './composables/useCalendarStore'

const {
  users,
  meetings,
  portalEvents,
  currentUserId,
  viewedUserId,
  currentUser,
  viewedUser,
  currentDate,
  activeModule,
  activeView,
  mobilePreviewMode,
  toastMessage,
  myNotifications,
  unreadNotifCount,
  switchCurrentUser,
  setViewedUser,
  setProfileStatus,
  markNotificationRead,
  markAllNotificationsRead,
  findConflictsForEvent,
  setPortalParticipation,
} = useCalendarStore()

const statusMenuOpen = ref(false)
const notifMenuOpen = ref(false)
const userMenuOpen = ref(false)
const showLegend = ref(false)
const showMeetingModal = ref(false)
const showTeleworkModal = ref(false)
const editingTelework = ref(null)
const selectedDetail = ref(null)

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
function onResize() {
  windowWidth.value = window.innerWidth
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const isCompactMobile = computed(() => mobilePreviewMode.value || windowWidth.value < 768)

// Sur mobile, bascule automatique vers Liste / Jour / Équipe (jamais une grille 7 colonnes illisible)
const effectiveView = computed(() => {
  if (isCompactMobile.value && (activeView.value === 'week' || activeView.value === 'month')) {
    return 'list'
  }
  return activeView.value
})

const moduleTabs = [
  { key: 'calendar', label: 'Calendrier', icon: Calendar },
  { key: 'portail', label: 'Portail', icon: Megaphone },
  { key: 'kanban', label: 'Kanban', icon: Kanban },
  { key: 'rh', label: 'Portail RH', icon: Palmtree },
]

const desktopViews = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'day', label: 'Jour' },
  { key: 'list', label: 'Liste' },
  { key: 'team', label: 'Planning Équipe' },
]

const currentStatusObj = computed(
  () => PROFILE_STATUSES.find((s) => s.key === currentUser.value?.profileStatus) || PROFILE_STATUSES[0]
)

const periodHeading = computed(() => {
  if (effectiveView.value === 'month') return formatMonthTitle(currentDate.value)
  if (effectiveView.value === 'day') return formatDayFull(currentDate.value)
  return formatWeekRange(currentDate.value)
})

function toggleMobilePreview() {
  mobilePreviewMode.value = !mobilePreviewMode.value
  if (mobilePreviewMode.value && (activeView.value === 'week' || activeView.value === 'month')) {
    activeView.value = 'list'
  } else if (!mobilePreviewMode.value && activeView.value === 'list') {
    activeView.value = 'week'
  }
}

function goToToday() {
  currentDate.value = TODAY
}

function stepDate(direction) {
  if (effectiveView.value === 'month') {
    currentDate.value = addDays(currentDate.value, direction * 30)
  } else if (effectiveView.value === 'day') {
    currentDate.value = addDays(currentDate.value, direction)
  } else {
    currentDate.value = addDays(currentDate.value, direction * 7)
  }
}

function jumpToDay(dateStr) {
  currentDate.value = dateStr
  activeView.value = 'day'
}

function openColleagueCalendar(userId) {
  setViewedUser(userId)
  activeView.value = isCompactMobile.value ? 'day' : 'week'
}

function openNewMeeting() {
  showMeetingModal.value = true
}

function openNewTelework() {
  editingTelework.value = null
  showTeleworkModal.value = true
}

function startEditTelework(tw) {
  selectedDetail.value = null
  editingTelework.value = tw
  showTeleworkModal.value = true
}

function goToModule(mod) {
  selectedDetail.value = null
  activeModule.value = mod
}

function openNotification(n) {
  markNotificationRead(n.id)
  notifMenuOpen.value = false
  activeModule.value = 'calendar'
  if (n.type === 'event') {
    const ev = portalEvents.value.find((e) => e.id === n.targetId)
    if (ev) {
      currentDate.value = ev.date
      selectedDetail.value = { kind: 'event', item: { raw: ev } }
    }
  } else if (n.type === 'meeting') {
    const m = meetings.value.find((x) => x.id === n.targetId)
    if (m) {
      currentDate.value = m.date
      selectedDetail.value = { kind: 'meeting', item: { raw: m, masked: false } }
    }
  }
}

function handleQuickRsvp({ eventId, status }) {
  if (status === 'participe') {
    const conflicts = findConflictsForEvent(eventId)
    if (conflicts.length > 0) {
      const ev = portalEvents.value.find((e) => e.id === eventId)
      if (ev) selectedDetail.value = { kind: 'event', item: { raw: ev } }
      return
    }
  }
  setPortalParticipation(eventId, status)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
