# College Routine

Planificateur intelligent pour étudiants — gestion des cours, tâches, échéances et séances de gym sur un calendrier hebdomadaire.

[![Open Planner](https://img.shields.io/badge/Open%20Planner-%2300C853?style=for-the-badge&logo=vercel&logoColor=white)](https://college-routine-app.vercel.app)

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Prisma 7** + **PostgreSQL** (Neon)
- **Tailwind CSS 4** · **Vercel**

## Fonctionnalités

- Import de grille horaire par PDF (extraction Claude AI)
- Agenda hebdomadaire avec blocs d'étude générés automatiquement
- Suivi des cours, tâches et échéances
- Intégration gym (catalogue d'exercices local)
- Authentification par session sécurisée

## Dev local

```bash
npm install
cp .env.example .env   # remplir les variables
docker compose up -d   # PostgreSQL local
npx prisma migrate dev
npm run dev
```
