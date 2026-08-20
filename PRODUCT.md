# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Étudiants universitaires, 18–25 ans, qui gèrent un semestre chargé de cours, tâches et échéances tout en essayant de garder une routine de gym régulière. Premier terrain de test : Polytechnique Montréal, mais le produit est destiné à d'autres étudiants universitaires, pas seulement à un usage personnel.

Job to be done : voir en un coup d'œil la semaine qui vient (cours, tâches, échéances, séances de gym) et organiser son agenda hebdomadaire sans jongler entre plusieurs outils.

## Product Purpose

Planificateur pour étudiants universitaires : gestion des Cours (horaire, plan de cours, Échéances, Tâches) et d'un Agenda hebdomadaire qui inclut les séances de gym. Succès : l'étudiant garde son semestre organisé — cours, travaux et gym visibles au même endroit — sans charge mentale de suivi manuel.

## Positioning

Un planificateur académique dont l'agenda hebdomadaire traite les séances de gym comme un citoyen de première classe au même titre que les cours et les tâches, plutôt que comme une app fitness séparée ou une simple todo-list scolaire.

## Operating Context

- Import/saisie de la grille horaire de cours en début de semestre (`/onboarding`, `/cours`).
- Consultation et ajustement hebdomadaire de l'Agenda (`/agenda`) — cours, tâches, échéances, gym.
- Suivi ponctuel des Tâches et Échéances par Cours (`/cours/[id]`).
- Authentification par compte (login/register) — produit multi-utilisateur, pas un usage local à un seul poste.

## Capabilities and Constraints

Construit et confirmé dans le code actuel :
- CRUD Cours (avec horaire, heures de cours/labo/personnelles), Tâches, Échéances.
- Agenda hebdomadaire (`AgendaClient`) avec gestion d'événements.
- Préférence gym (activer/désactiver, heure préférée) rattachée au profil utilisateur.
- Onboarding et Settings pour configurer le profil et les préférences.

Abandonné / non construit (à ne pas présumer actif) :
- Le moteur de Recommandations basé sur Signaux physiologiques (sommeil, fréquence cardiaque), État cognitif/physique, Règles scientifiques sourcées, et Objectifs personnels (GPA, poids). Ces modèles existent encore dans `prisma/schema.prisma` (`HealthData`, `RecoveryScore`, `CognitiveState`, `Recommendation`, `ScientificRule`, `Goal`, etc.) et `lib/ai.ts` contient encore la logique associée, mais rien ne les appelle depuis les routes `/api` ou les pages actuelles. Ne pas construire de nouvelles surfaces autour de ces modèles sans confirmation explicite — ce sont des vestiges d'une direction produit précédente.
- Import de grille horaire par PDF (mentionné dans d'anciennes itérations) — non présent dans le code actuel.

## Brand Commitments

Voix de marque : sérieuse mais expressive, thème *Graduation* (Kanye West) / art Murakami. Le bear est un motif de marque récurrent (logo, états vides).

Anti-références : esthétique IA beige générique, glassmorphism, cards imbriquées, gradients génériques, ghost cards, boutons excessivement arrondis.

Palette déclarée : noir profond, Violet `#4E2A84`, Magenta `#C9006B`, Orange `#FF7043`.
Note : DESIGN.md actuellement committé utilise une palette différente (bleu `#4A9EFF` / rose `#FF6B9D` sur fond quasi-noir `#0A0A14`). Cette divergence n'est pas résolue ici — à traiter explicitement lors d'un prochain `document` ou travail de redesign, pas assumée silencieusement dans un sens ou l'autre.

## Evidence on Hand

Déployé en production : https://college-routine-app.vercel.app (Vercel + Neon Postgres). Aucun contenu de démonstration, témoignage ou étude de cas à disposition — ne pas en inventer.

## Product Principles

1. **La semaine tient sur un seul agenda** — cours, tâches, échéances et gym vivent dans la même vue hebdomadaire ; pas d'app fitness séparée.
2. **Le semestre structure tout** — Cours, horaire et heures personnelles sont configurés une fois (onboarding) puis alimentent Planning et Agenda automatiquement.
3. **Pas de fonctionnalité fantôme** — les modèles de données hérités (santé, recommandations, objectifs) ne doivent pas réapparaître dans l'UI sans décision produit explicite.
4. **Densité maîtrisée** — l'étudiant gère beaucoup d'information (plusieurs cours, tâches, échéances) ; l'interface priorise la clarté à la densité, pas le vide décoratif.

## Accessibility & Inclusion

WCAG AA visé. Contraste minimum 4.5:1 sur le texte courant, 3:1 sur les grands titres. Navigation clavier complète, labels aria sur les éléments interactifs. `prefers-reduced-motion` respecté pour toute transition/animation.
