# ✨ Taskly

Un tracker minimaliste pour gérer tes **tâches**, **objectifs** et **habitudes** au même endroit.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Sass](https://img.shields.io/badge/Sass-CC6699?logo=sass&logoColor=white)

---

## 🚀 Fonctionnalités

- 📋 **Tâches** — organise tes tâches par groupes, avec priorités, dates d'échéance et sous-tâches
- 🎯 **Objectifs** — onglets thématiques pour suivre tes goals à long terme
- 🔥 **Habitudes** — heatmap façon GitHub pour visualiser tes streaks quotidiens
- 🪟 **UI glassmorphism** — design sombre avec effets de verre dépoli au survol
- 📱 **Responsive** — sidebar sur desktop, bottom bar sur mobile
- 💾 **Persistance locale** — tes données sont sauvegardées dans le navigateur (Zustand + localStorage)

---

## 🛠 Stack technique

| Catégorie | Outil |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) |
| UI | React 19 + TypeScript |
| Styling | Sass (modules) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Drag & Drop | [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) |
| Font | Rubik (via `next/font`) |

---

## 🏁 Démarrage

### Prérequis
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/KaribbeanCreative/taskly.git
cd taskly
npm install
```

### Lancer en développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

### Build de production

```bash
npm run build
npm start
```

---

## 📁 Structure du projet

```
taskly/
├── app/                  # App Router (layout, page, styles globaux)
├── components/
│   ├── Tasks/            # Cartes, formulaires, groupes de tâches
│   ├── Goals/            # Cartes & formulaires d'objectifs
│   ├── Habits/           # Cartes, formulaires, heatmap
│   └── Navigation/       # Sidebar desktop + bottom bar mobile
├── store/                # Stores Zustand (tasks, goals, habits)
├── styles/               # Variables, mixins, animations Sass
├── types/                # Types TypeScript partagés
└── utils/                # Helpers (sanitize, etc.)
```

---

## 📝 Licence

Projet personnel — usage libre.
