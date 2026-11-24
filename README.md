# CALRAAL — Maquette du module Calendrier (CentRAAL · RAAL La Louvière)

Maquette interactive réalisée en **Vue 3 + Tailwind CSS + Vite** avec données 100 % fictives, dans le cadre de l'exercice technique pour le stage développeur web full-stack à la **RAAL La Louvière**.

## Fonctionnalités démontrées

- **Identité RAAL & charte 8 couleurs** : vert officiel `#007A43`, logo RAAL, et un code couleur dédié doublé d'icônes pour chaque nature d'entrée (Événement Portail `#6366F1`, RDV `#2563EB`, Télétravail `#0D9488`, Tâche Kanban `#CA8A04`, Congé `#EA580C`, Maladie `#DC2626`, Indisponible/Occupé `#64748B`).
- **Sélecteur de profil en direct** (barre du haut) pour démontrer la confidentialité à 3 niveaux (*Détail / Grisé « Indisponible » ou « Occupé » / Caché*) entre Collaborateur, Manager, Service RH et autre service.
- **Statut de disponibilité sur le profil** (`Disponible`, `Occupé`, `Indisponible`).
- **5 vues ordinateur** (*Semaine*, *Mois*, *Jour*, *Liste*, *Planning Équipe*) + **mode téléphone adaptatif (PWA)** avec bouton d'aperçu mobile intégré.
- **Découpage d'une journée en 3 zones** : statuts & tâches en haut, horaire habituel en fond, créneaux horaires (RDV & Événements) côte à côte.
- **Événements du Portail non bloquants** (bordure pointillée) : refus qui masque l'événement du calendrier tout en le gardant sur le Portail, et alerte douce en cas de conflit avec un RDV existant.
- **Création d'un RDV** avec aperçu en direct des disponibilités grisées des invités et répétitions simples.
- **Télétravail autonome à l'heure près** (`heure de début → heure de fin`).
- **Écrans démonstratifs des modules voisins** : Portail RH statique (seuls les congés/maladies validés remontent dans le calendrier), Tableau Kanban (liaison Tâche ↔ RDV gérée depuis le Kanban) et Portail d'actualités.

## Lancer en local

```bash
npm install
npm run dev
```

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` déploie automatiquement la maquette sur GitHub Pages à chaque `git push` sur `main` :
1. Sur GitHub (`https://github.com/MAKO-7/CALRAAL/settings/pages`), choisir **Source : GitHub Actions**.
2. La maquette est ensuite accessible à l'adresse : **https://mako-7.github.io/CALRAAL/**
