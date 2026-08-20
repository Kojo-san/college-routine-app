---
name: College Routine
description: Planificateur académique nocturne — bear Murakami, néon violet/magenta sur nébuleuse dégradée
colors:
  violet-electrique: "#7C5CFC"
  lavande-neon: "#9B8FFF"
  magenta-neon: "#FF6B9D"
  magenta-profond: "#C9006B"
  violet-profond: "#4E2A84"
  ambre-fitness: "#FFD166"
  vert-recuperation: "#A8FF78"
  orange-alerte: "#FFB347"
  orange-ceremonie: "#FF7043"
  rouge-destructif: "#ff6b6b"
  rouge-destructif-hover: "rgba(255, 60, 60, 0.1)"
  blanc-lavande: "#F0F0FF"
  gris-brume: "#8888AA"
  gris-nav-inactif: "#9CA3AF"
  surface-verre: "rgba(255, 255, 255, 0.05)"
  elevated-verre: "rgba(255, 255, 255, 0.08)"
  surface-nav: "rgba(10, 1, 24, 0.92)"
  bordure-subtile: "rgba(255, 255, 255, 0.1)"
  fond-nebuleuse-noir: "#000000"
  fond-nebuleuse-violet: "#1a0535"
  fond-nebuleuse-fade-auth: "#1a0a2e"
typography:
  display:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(24px, 4vw, 36px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Syne, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Syne, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.magenta-profond}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.magenta-neon}"
  badge-cours:
    backgroundColor: "rgba(155, 143, 255, 0.15)"
    textColor: "{colors.lavande-neon}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.surface-verre}"
    textColor: "{colors.blanc-lavande}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.elevated-verre}"
    textColor: "{colors.blanc-lavande}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
---

# Design System: College Routine

## Overview

**Creative North Star: "La Salle d'Étude Nébuleuse"**

L'étudiant travaille de nuit, seul, dans une pièce baignée par une nébuleuse violette qui pulse doucement derrière des panneaux de verre dépoli. Le bear de Murakami veille depuis le rail de navigation, jamais bavard. Chaque type de séance — étude, fitness, récupération — a sa propre couleur de lueur, si bien que la semaine entière se lit d'un coup d'œil rien qu'aux couleurs qui s'allument sur l'écran.

L'esthétique combine deux références tenues ensemble : l'énergie de cérémonie de *Graduation* (Kanye West, 2007) — violet et magenta, dégradés de scène — et l'attitude ludique-mais-précise de Murakami. Le résultat n'est ni un dashboard SaaS neutre, ni une app fitness flashy : c'est un poste de travail nocturne premium, dense en information mais jamais encombré.

Rejets confirmés : pas de beige IA générique, pas de cards imbriquées, pas de gradients décoratifs génériques (les dégradés sont réservés au titre H1, aux boutons CTA, au fond global, et au dégradé cérémonie à 3 couleurs des écrans d'entrée), pas de coins excessivement arrondis, pas de ghost cards vides de contenu.

**Key Characteristics:**
- Fond nébuleuse : dégradé noir → violet profond, avec deux halos radiaux flous (violet en haut à droite, magenta en bas à gauche) qui ne bougent pas au scroll.
- Surfaces en verre dépoli : cartes et rail de navigation utilisent un blanc à faible opacité (5–8%) plutôt qu'un fond opaque plein.
- Glow sémantique : chaque type de Bloc (Étude/Cours en violet, Fitness en ambre, Récupération en vert, Reco/erreur en magenta) porte sa couleur en `box-shadow`, jamais en simple remplissage.
- Nav en rail d'icônes : 80px de large, pilules qui se déploient au survol plutôt que labels toujours visibles.

## Colors

Palette resserrée autour de deux familles de violet et un accent magenta, avec trois couleurs sémantiques dédiées aux types de séance.

### Primary
- **Violet Électrique** (`#7C5CFC`): couleur d'accent principale — Étude, nav active, checkbox coché, focus ring par défaut.
- **Lavande Néon** (`#9B8FFF`): variante dédiée aux Cours (grille horaire fixe) — distincte de l'Étude pour que l'agenda distingue "cours planifié" de "séance de travail".

### Secondary
- **Magenta Profond** (`#C9006B`) / **Magenta Néon** (`#FF6B9D`): paire utilisée en dégradé pour les CTA primaires et le titre H1 ; `#FF6B9D` seul sert aussi de couleur d'erreur et de "Reco" (composant hérité, voir Do's and Don'ts).

### Tertiary
- **Ambre Fitness** (`#FFD166`): Séance Fitness.
- **Vert Récupération** (`#A8FF78`): Séance Récupération et état "Complété"/succès.
- **Orange Alerte** (`#FFB347`): avertissements (échéance urgente, priorité haute) — à ne pas confondre avec l'Orange Cérémonie ci-dessous, plus saturé et réservé à un tout autre usage.
- **Orange Cérémonie** (`#FF7043`): troisième couleur d'un dégradé réservé aux moments d'entrée/rite de passage — écran d'auth (`AuthLayout`, panneau visuel droit : violet → magenta → orange) et animation de transition (`spiral-animation.tsx`, un des trois bras de la galaxie). N'apparaît jamais dans le chrome applicatif courant (sidebar, cartes, Planning) — voir Named Rule ci-dessous.

### Neutral
- **Blanc Lavande** (`#F0F0FF`): texte principal — jamais de blanc pur.
- **Gris Brume** (`#8888AA`): labels, métadonnées, texte secondaire.
- **Gris Nav Inactif** (`#9CA3AF`): icône + label d'un item de navigation non actif (rail desktop et barre d'onglets mobile) — plus clair que Gris Brume, réservé à la navigation.
- **Rouge Destructif** (`#ff6b6b`, hover `rgba(255,60,60,0.1)` / Rouge Destructif Hover): action de déconnexion dans le popover utilisateur — seul rouge du système, distinct du Magenta Néon utilisé pour erreurs/reco.
- **Verre Surface** (`rgba(255,255,255,0.05)`): fond des cartes.
- **Verre Élevé** (`rgba(255,255,255,0.08)`): inputs, popovers, modals.
- **Surface Nav** (`rgba(10,1,24,0.92)`): fond du rail de navigation desktop et de la barre d'onglets mobile, avec `backdrop-filter: blur(12px)`.
- **Bordure Subtile** (`rgba(255,255,255,0.1)`): bordures par défaut.
- **Nébuleuse Noire → Violette** (`#000000` → `#0a0118` → `#120420` → `#1a0535`): fond global en dégradé 160deg, fixe.
- **Nébuleuse Fade Auth** (`#1a0a2e`): point d'arrivée du dégradé du panneau gauche de l'écran d'auth — variante plus resserrée (2 stops) de la nébuleuse principale ; voir Don't sur la dérive de stops non unifiée.

### Named Rules
**The Glow-Is-Meaning Rule.** Une carte neutre (Tâche, texte simple) n'a pas de glow. Le glow apparaît uniquement sur les Blocs typés (Étude, Cours, Fitness, Récupération, Reco) — sa présence est elle-même une information, pas une décoration.

**The Ceremony Gradient Rule.** Le dégradé à 3 couleurs (violet → magenta → orange) est réservé aux moments de passage — authentification, onboarding, transition d'entrée. Le chrome applicatif courant (une fois l'étudiant "dans" l'app) ne dépasse jamais 2 couleurs (violet → magenta). Si un futur écran hésite entre les deux, la question à trancher est : "est-ce un rite de passage, ou un usage quotidien ?"

## Typography

**Display / Headline / Title Font:** Syne (700/800)
**Body / Label Font:** Space Grotesk (400/500)

**Character:** Syne apporte l'angularité affirmée des titres de scène (Graduation-esque) ; Space Grotesk garde le corps du texte lisible et neutre à haute densité. Les deux ne se mélangent jamais dans le même élément.

### Hierarchy
- **Display** (700, `clamp(24px, 4vw, 36px)`, 1.1): titre de page (`h1.page-title`), toujours en dégradé texte blanc → magenta.
- **Headline** (700, 16px, 1.3): titres de carte (Card, Dialog, Cours).
- **Title** (700, 15px, 1.3): titre de Bloc dans la Timeline.
- **Body** (400, 14px, 1.5): texte courant, messages, contenu de carte.
- **Label** (500, 12px, uppercase, tracking 0.06em): labels de champ, métadonnées, horaires, badges.

### Named Rules
**The Syne-Never-In-Body Rule.** Syne apparaît uniquement sur H1–H3 et titres de carte ; jamais en paragraphe, jamais en label de champ.

## Layout

Grille à deux zones : rail de navigation fixe (80px) + zone de contenu décalée (`margin-left: 80px`). Le contenu principal a un plafond de largeur implicite par page mais pas de colonne centrale rigide — chaque page (Planning, Cours, Agenda, Réglages) compose sa propre grille interne.

En-tête de page fixe en haut de la zone de contenu : dégradé vertical sombre (`--gradient-header`) avec `backdrop-filter: blur(8px)`, titre H1 en dégradé texte. Padding responsive : `24px` mobile → `32-40px` desktop.

Sous 1024px (`lg`), le rail de navigation disparaît entièrement et une barre d'onglets fixe en bas d'écran prend le relais (voir Navigation ci-dessous) — ce n'est pas un simple repli du rail desktop, c'est un composant distinct adapté à l'absence de survol tactile.

## Elevation & Depth

Système hybride : **verre dépoli + glow sémantique**, pas de shadows Material classiques. Deux mécanismes distincts portent la profondeur :

1. **Blur ambiant** — le rail de nav et l'en-tête de page utilisent `backdrop-filter: blur(8-12px)` sur un fond semi-transparent (`rgba(10,1,24,0.92)` pour le rail), laissant le dégradé de fond transparaître.
2. **Glow coloré** — les cartes typées portent un `box-shadow` coloré (jamais gris) qui signale leur catégorie ; une carte neutre reste plate, sans ombre.

### Shadow Vocabulary
- **glow-study** (`0 0 16px rgba(78, 42, 132, 0.35)`): Bloc/Card Étude.
- **glow-cours** (`0 0 16px rgba(155, 143, 255, 0.40)`): Bloc/Card Cours.
- **glow-fitness** (`0 0 16px rgba(255, 209, 102, 0.35)`): Bloc Fitness.
- **glow-recovery** (`0 0 16px rgba(168, 255, 120, 0.35)`): Bloc Récupération.
- **glow-reco** (`0 0 20px rgba(255, 107, 157, 0.25)`): RecommendationCard.
- **glow-*-sm** (`0 0 6px …`): variante compacte pour barres de progression et checkbox coché.

### Named Rules
**The No-Grey-Shadow Rule.** Aucune ombre neutre grise n'existe dans le système ; toute élévation perceptible est soit un blur translucide, soit un glow coloré sémantique.

## Shapes

Coins généreux mais pas ronds à l'excès : `rounded-xl` (12px) pour cartes et conteneurs, `rounded-lg` (8px) pour boutons et inputs, `rounded-full` pour badges/chips/pilules de nav/avatar. Bordures fines de 1px en `bordure-subtile`, sauf accent de catégorie qui utilise une bordure gauche de 3-4px en couleur pleine (`border-left`) sur les Bloc/Course Cards — c'est la seule bordure épaisse du système, et elle porte toujours une couleur sémantique.

**Exception délibérée — écrans d'auth.** `.auth-submit-btn` (4px) et `.auth-input` (0px, simple `border-bottom`) utilisent des coins nettement plus carrés que le reste de l'app. C'est cohérent avec le ton "cérémonie/scène" de ces écrans (voir Ceremony Gradient Rule) — ne pas arrondir ces éléments pour "matcher" le reste de l'app sans décision explicite.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px).
- **Primary:** dégradé `135deg, #4E2A84 → #C9006B`, texte blanc ; au survol, `brightness(1.12)` + `translateY(-1px)` (pas de changement de couleur discret, un effet de lumière).
- **Secondary:** transparent, bordure et texte magenta (`#C9006B` à 50% d'opacité au repos).
- **Ghost:** transparent, texte `gris-brume`, devient `blanc-lavande` au survol.
- **États:** `disabled` tombe à 40% d'opacité et perd le `transform`.

### Badges / Chips
- **Style:** fond translucide de la couleur sémantique à 10-15% d'opacité, texte en couleur pleine, `rounded` (4px) pour les badges de type, `rounded-full` pour les Deadline Chips.
- **Variantes:** study (violet), fitness (ambre), recovery (vert), reco (magenta), cours (lavande), warning (orange), success (vert).

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `surface-verre` (blanc 5%) au repos, `elevated-verre` (blanc 8%) pour modals/popovers.
- **Shadow Strategy:** glow sémantique si typée (voir Elevation & Depth) ; aucune ombre si neutre.
- **Border:** 1px `bordure-subtile`, sauf accent gauche coloré sur Bloc/Course Card.
- **Internal Padding:** 16px standard, 14/10px sur les Bloc Cards compactes.

### Inputs / Fields
- **Style:** fond `elevated-verre`, bordure `bordure-subtile`, `rounded-lg`.
- **Focus:** ring double (`0 0 0 2px noir, 0 0 0 4px accent`) plutôt qu'un simple changement de bordure — variante magenta pour l'état d'erreur.
- **Label:** au-dessus du champ, `gris-brume`, uppercase, 12px.

### Navigation (SidebarNav — signature)
Deux composants distincts selon le viewport, pas un seul qui se redimensionne :
- **Rail desktop (`lg:` et plus)** : fixe 80px, fond `surface-nav` (`rgba(10,1,24,0.92)`) + blur 12px, logo bear centré en haut. Chaque item est une pilule 48×48 qui héberge une icône seule au repos (couleur `gris-nav-inactif`) ; au survol elle s'étire vers 150px, révèle un dégradé magenta (`#C9006B → #8B0055`) et le label en majuscules. Item actif : icône magenta + léger ring coloré, pas de fond plein (contrairement au survol).
- **Barre d'onglets mobile (sous `lg:`)** : fixe en bas d'écran, même `surface-nav` + blur. Le survol n'existe pas au toucher, donc pas de pilule qui se déploie — icône + label toujours visibles, empilés verticalement, 44px de cible tactile minimum, padding `env(safe-area-inset-bottom)` pour l'indicateur d'accueil iOS.
- **Avatar utilisateur** : cercle d'initiales, popover de déconnexion (fond `#1a0535`, bouton `rouge-destructif`) positionné dynamiquement — s'ouvre vers la droite sur le rail desktop, vers le haut (aligné à droite) dans la barre mobile.

### Modals
- **Shape:** `rounded-xl`, fond `elevated-verre`, `shadow-2xl`.
- **Behavior:** `role="dialog"` + `aria-modal="true"` ; le focus est piégé à l'intérieur (Tab/Shift+Tab cycle sans en sortir), `Escape` ferme, le focus revient au déclencheur à la fermeture. Tout nouveau modal doit passer par `useModalA11y` (`lib/useModalA11y.ts`) plutôt que réimplémenter ce comportement.
- **Backdrop:** `bg-black/70`, clic pour fermer.

### Timeline / Bloc Card (signature)
- Colonne verticale d'heures avec Bloc Cards empilées ; ligne "maintenant" séparée (`TimelineNowLine`).
- Chaque Bloc affiche heure de début/fin, badge de type, titre en Syne, sous-titre optionnel, barre de progression optionnelle colorée selon le type.

## Do's and Don'ts

### Do:
- **Do** garder le glow réservé aux Blocs/Cartes typés — une carte neutre (Tâche seule, texte) reste plate.
- **Do** utiliser Syne exclusivement pour H1–H3 et titres de carte ; Space Grotesk partout ailleurs.
- **Do** traiter la nav comme un rail d'icônes qui se révèle au survol, pas comme une sidebar à labels toujours visibles.
- **Do** garder les dégradés rares : uniquement titre H1, boutons CTA primaires, fond global et header de page (le dégradé 3 couleurs cérémonie est une exception séparée, voir Colors).
- **Do** rendre les contrôles hover-only (supprimer, éditer) accessibles sans souris : classe `.hover-reveal` (`app/globals.css`) plutôt qu'un `opacity-0 group-hover:opacity-100` fait main — elle gère aussi `group-focus-within` et `@media (hover: none)`.

### Don't:
- **Don't** ajouter de nouvelles surfaces en verre dépoli sans compter — le blur/translucide actuel (sidebar, header) est une dérive tolérée aujourd'hui, pas une direction à étendre ; toute nouvelle carte doit rester `surface-verre` opaque-perçue (5% blanc, sans blur) sauf demande explicite.
- **Don't** traiter les 3 variantes de dégradé nébuleuse (`app/globals.css` 4 stops, `AuthLayout.tsx` 2 stops, `OnboardingForm.tsx` 4 stops à des valeurs légèrement différentes) comme unifiées — elles ne le sont pas encore. Ne pas copier l'une des trois comme référence pour un nouvel écran sans vérifier laquelle est vraiment la source de vérité ; unifier est un futur `/impeccable distill` ou `/impeccable document`, pas une supposition.
- **Don't** construire de nouvelles fonctionnalités autour de `RecommendationCard`, `RecommendationType`, ou des modèles Prisma `HealthData`/`ScientificRule`/`Goal` sans confirmation produit — le composant existe et s'affiche encore (`/`, `/planning`), mais le moteur de génération sous-jacent est un vestige non branché (voir PRODUCT.md § Capabilities and Constraints). Il utilise `bear_no_background.png` (le seul bear asset disponible en 48px propre) faute d'un asset `bear-neon.png` dédié — fournir un vrai visuel néon si ce composant est un jour réactivé.
- **Don't** réintroduire du blanc pur (`#ffffff` plein) en texte de contenu — `blanc-lavande` (`#F0F0FF`) est le plafond.
- **Don't** utiliser les couleurs génériques Tailwind (`bg-blue-500`, `bg-green-500`, etc.) pour du contenu produit — elles n'apparaissent aujourd'hui que dans le sélecteur de couleur générique d'`EventManager` (composant shadcn importé, pas encore réaligné sur la palette sémantique) ; ne pas copier ce pattern ailleurs.
