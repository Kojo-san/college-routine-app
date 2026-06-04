# Design — College Routine

Identité visuelle inspirée de *Graduation* (Kanye West, 2007) et de l'art de Takashi Murakami. L'interface est une salle de travail nocturne éclairée au néon — intense, concentrée, premium. Le bear est le protagoniste du système.

---

## Fondations

### Mode

**Dark mode uniquement.** Le fond quasi-noir laisse les glow colors exploser. Pas de light mode — le dark mode n'est pas une option, c'est l'identité.

---

### Couleurs

#### Base

| Token           | Valeur    | Usage                                 |
| --------------- | --------- | ------------------------------------- |
| `bg-base`       | `#0A0A14` | Fond global de l'application          |
| `bg-surface`    | `#12121F` | Fond des cartes et panneaux           |
| `bg-elevated`   | `#1A1A2E` | Modals, popovers, dropdowns           |
| `border-subtle` | `#1E1E35` | Bordures par défaut (sans glow)       |
| `text-primary`  | `#F0F0FF` | Texte principal                       |
| `text-muted`    | `#8888AA` | Labels, métadonnées, texte secondaire |

#### Accents sémantiques

Chaque type de Séance a sa couleur. Ces couleurs portent toute l'information visuelle du Planning d'un coup d'œil.

| Token          | Valeur    | Usage                              |
| -------------- | --------- | ---------------------------------- |
| `accent-study` | `#4A9EFF` | Séance d'Étude, accents primaires  |
| `accent-fit`   | `#FFD166` | Séance Fitness                     |
| `accent-rec`   | `#A8FF78` | Séance de Récupération, succès     |
| `accent-reco`  | `#FF6B9D` | Recommandations, accent émotionnel |

#### États système

| Token     | Valeur    | Usage                                   |
| --------- | --------- | --------------------------------------- |
| `warning` | `#FFB347` | Alertes (dette de sommeil, surcharge)   |
| `error`   | `#FF6B9D` | Erreurs — même rose que `accent-reco`   |
| `success` | `#A8FF78` | Confirmations — même vert que `accent-rec` |

---

### Typographie

| Rôle                  | Famille           | Weight           | Taille indicative |
| --------------------- | ----------------- | ---------------- | ----------------- |
| H1 — Titre de page    | **Syne**          | ExtraBold (800)  | 32–40px           |
| H2 — Titre de section | **Syne**          | Bold (700)       | 20–24px           |
| H3 — Titre de carte   | **Syne**          | Bold (700)       | 15–17px           |
| Corps                 | **Space Grotesk** | Regular (400)    | 14px              |
| Label / Metadata      | **Space Grotesk** | Medium (500)     | 12px              |
| Monospace (horaires)  | **Space Grotesk** | Medium (500)     | 12–13px           |

Syne uniquement sur H1–H3. Jamais en corps de texte, jamais en label UI.

---

### Le Bear

| Asset           | Rôle                                                              |
| --------------- | ----------------------------------------------------------------- |
| `bear-logo.png` | Logo sidebar + favicon. Présent en permanence, 32×32px.          |
| `bear.png`      | États vides, onboarding, félicitations. 120–200px.               |
| `bear-neon.png` | Carte de Recommandation. 48×48px, toujours en haut à droite.     |

Le bear ne parle jamais directement. Sa présence suffit à signaler le type de contexte.

---

### Surfaces & Cartes

Base commune à toutes les cartes. Le glow est l'unique décoration — il porte la couleur sémantique.

```css
.card {
  background: #12121F;
  border: 1px solid #1E1E35;
  border-radius: 12px;
  padding: 16px;
}

.card-study    { box-shadow: 0 0 16px rgba(74, 158, 255, 0.35);  }
.card-fitness  { box-shadow: 0 0 16px rgba(255, 209, 102, 0.35); }
.card-recovery { box-shadow: 0 0 16px rgba(168, 255, 120, 0.35); }
.card-reco     { box-shadow: 0 0 16px rgba(255, 107, 157, 0.35); }
```

Pas de glassmorphism. Pas de blur. Les cartes sont opaques.

---

### Gradients

Réservés à deux contextes uniquement.

```css
/* H1 principal — titre de page */
.gradient-text {
  background: linear-gradient(135deg, #4A9EFF 0%, #FF6B9D 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Header de section — bandeau haut de Dashboard / Planning */
.section-header {
  background: linear-gradient(180deg, #1A1A2E 0%, #0A0A14 100%);
}
```

---

### Règles strictes

- Pas de blanc pur — `text-primary` (`#F0F0FF`) est le maximum.
- Pas de rouge — `#FF6B9D` est la couleur d'erreur et d'accent émotionnel.
- Les gradients sont rares — leur rareté est ce qui les rend impactants.
- Le glow est sémantique — une carte neutre (Tâche, Cours) n'a pas de glow.
- Syne uniquement sur H1–H3 — jamais ailleurs.

---

## Composants

---

### Sidebar

La colonne de navigation fixe à gauche. Contient le bear, les liens principaux et le profil de l'Étudiant.

```
┌─────────────┐
│  🐻  College │  ← bear-logo.png (32px) + nom app en Syne Bold
│  Routine    │
├─────────────┤
│  Dashboard  │  ← nav item actif : accent-study + glow subtil à gauche
│  Planning   │  ← nav item
│  Académique │
│  Santé      │
│  Objectifs  │
├─────────────┤
│  [Avatar]   │  ← en bas, nom de l'Étudiant en Space Grotesk Medium
│  Gamaliel   │
└─────────────┘
```

```css
.sidebar {
  width: 220px;
  background: #0A0A14;
  border-right: 1px solid #1E1E35;
  padding: 24px 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #8888AA;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: #12121F;
  color: #F0F0FF;
}

.nav-item.active {
  background: rgba(74, 158, 255, 0.12);
  color: #4A9EFF;
  border-left: 2px solid #4A9EFF;
}
```

---

### Layout de page

Chaque page suit la même structure.

```
┌──────────┬───────────────────────────────────────────────┐
│          │  Section Header (gradient bg, Syne H1 gradient │
│ Sidebar  │  text)                                         │
│          ├───────────────────────────────────────────────┤
│          │  Contenu principal                             │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

```css
.page-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  background: #0A0A14;
}

.page-header {
  padding: 32px 40px 24px;
  background: linear-gradient(180deg, #1A1A2E 0%, #0A0A14 100%);
  border-bottom: 1px solid #1E1E35;
}

.page-header h1 {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 36px;
  background: linear-gradient(135deg, #4A9EFF 0%, #FF6B9D 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-content {
  padding: 32px 40px;
}
```

---

### Bloc Card

L'unité atomique du Planning. Quatre variantes selon le type de Séance. S'affiche dans la Timeline.

```
┌──────────────────────────────────────┐  ← glow couleur selon type
│  09:00 → 11:00          [ÉTUDE] ●   │  ← badge type + durée
│                                      │
│  Algèbre Linéaire                    │  ← titre en Syne Bold
│  Active Recall · Deep Work           │  ← sous-titre Space Grotesk Muted
│                                      │
│  ████████████░░░░  60%               │  ← progress bar (si IN_PROGRESS)
└──────────────────────────────────────┘
```

```css
.bloc-card {
  background: #12121F;
  border: 1px solid #1E1E35;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Variantes */
.bloc-study    { box-shadow: 0 0 16px rgba(74, 158, 255, 0.35);  border-left: 3px solid #4A9EFF; }
.bloc-fitness  { box-shadow: 0 0 16px rgba(255, 209, 102, 0.35); border-left: 3px solid #FFD166; }
.bloc-recovery { box-shadow: 0 0 16px rgba(168, 255, 120, 0.35); border-left: 3px solid #A8FF78; }
.bloc-task     { border-left: 3px solid #1E1E35; /* pas de glow — neutre */ }

.bloc-time {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #8888AA;
  letter-spacing: 0.04em;
}

.bloc-title {
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #F0F0FF;
}

.bloc-subtitle {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  color: #8888AA;
}
```

---

### Timeline (Planning du jour)

La colonne centrale du Dashboard. Affiche les Blocs dans l'ordre chronologique avec un indicateur de l'heure courante.

```
  08:00  ──────────────────────────────
         [Bloc réveil / révision légère]
  09:00  ──────────────────────────────
         [Bloc Étude — Algèbre]
  11:00  ──────────────────────────────
         [Bloc Fitness — Push Day]
  12:30  ── ● ←── maintenant ──────────  ← trait rose animé
  13:00  ──────────────────────────────
         [Bloc Récupération — Sieste]
```

```css
.timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.timeline-hour-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  color: #8888AA;
  width: 48px;
  flex-shrink: 0;
}

.timeline-now {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #FF6B9D;
  box-shadow: 0 0 8px rgba(255, 107, 157, 0.6);
}

.timeline-now::before {
  content: '';
  position: absolute;
  left: 48px;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FF6B9D;
  box-shadow: 0 0 8px rgba(255, 107, 157, 0.8);
}
```

---

### Recommandation Card

La carte la plus distinctive du système. Toujours rose, toujours avec `bear-neon.png`.

```
┌──────────────────────────────────────────┐  ← glow rose
│  🐻‍💫  [bear-neon.png — 48px]    [SOMMEIL] │
│                                          │
│  "Ta dette de sommeil est de 1h30.       │  ← message en Space Grotesk
│   Déplace ta séance deep work à demain." │    Regular 14px
│                                          │
│  Basé sur : Walker, 2017 · 87% confiance │  ← source + score en text-muted
│                                  [Faire] │  ← CTA ghost
└──────────────────────────────────────────┘
```

```css
.reco-card {
  background: #12121F;
  border: 1px solid rgba(255, 107, 157, 0.3);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 0 20px rgba(255, 107, 157, 0.25);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
}

.reco-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reco-bear {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.reco-message {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  color: #F0F0FF;
  line-height: 1.6;
}

.reco-source {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  color: #8888AA;
}
```

---

### État Card

Résumé journalier de l'État physique et cognitif de l'Étudiant. Deux colonnes, deux dimensions.

```
┌─────────────────────────────────────────┐
│  État du jour — Lundi 3 juin            │
│                                         │
│  ⚡ PHYSIQUE          🧠 COGNITIF        │
│  Récupération  82%   Focus        74%   │
│  Fatigue phys  18%   Fatigue cog  26%   │
│  Dette sommeil 0h    Stress       30%   │
│                      Motivation   88%   │
│                                         │
│  Sommeil : 7h20 · 84% efficacité        │
└─────────────────────────────────────────┘
```

```css
.etat-card {
  background: #12121F;
  border: 1px solid #1E1E35;
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.etat-section-title {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8888AA;
  margin-bottom: 12px;
}

.etat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.etat-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  color: #8888AA;
}

.etat-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #F0F0FF;
}
```

---

### Score Gauge

Visualisation d'un score 0–100 (récupération, focus, motivation). Utilisé à l'intérieur des cartes État et Dashboard.

```
  [●━━━━━━━━━━━━━━━━━━░░░] 82
   └── couleur = accent selon contexte
```

```css
.gauge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gauge-track {
  flex: 1;
  height: 4px;
  background: #1E1E35;
  border-radius: 2px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* Couleurs selon contexte */
.gauge-fill.study    { background: #4A9EFF; box-shadow: 0 0 6px rgba(74,158,255,0.5); }
.gauge-fill.fitness  { background: #FFD166; box-shadow: 0 0 6px rgba(255,209,102,0.5); }
.gauge-fill.recovery { background: #A8FF78; box-shadow: 0 0 6px rgba(168,255,120,0.5); }
.gauge-fill.reco     { background: #FF6B9D; box-shadow: 0 0 6px rgba(255,107,157,0.5); }

.gauge-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #F0F0FF;
  width: 28px;
  text-align: right;
}
```

---

### Course Card

Carte d'un Cours dans la vue Académique. Affiche le code, la difficulté, et les Échéances imminentes.

```
┌──────────────────────────────────────┐
│  MTH1102          ● ● ● ○ ○  3/5     │  ← code + difficulté (dots)
│  Algèbre Linéaire                    │  ← nom en Syne Bold
│                                      │
│  ⚠ Intra dans 5 jours — 30%          │  ← Échéance urgente en warning
│  3 tâches en cours                   │  ← résumé tâches
└──────────────────────────────────────┘
```

```css
.course-card {
  background: #12121F;
  border: 1px solid #1E1E35;
  border-radius: 12px;
  padding: 16px;
}

.course-code {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #8888AA;
  text-transform: uppercase;
}

.course-name {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #F0F0FF;
  margin-top: 4px;
}

.difficulty-dots {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.filled  { background: #4A9EFF; }
.dot.empty   { background: #1E1E35; }
```

---

### Deadline Chip

Badge d'urgence affiché sur les Course Cards et dans le Planning. La couleur signal l'urgence.

```
  [⚠ Dans 2 jours · 30%]   ← rouge/warning, très urgent
  [Dans 7 jours · 20%]     ← text-muted, peu urgent
  [✓ Complété]              ← vert success
```

```css
.deadline-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 500;
}

.deadline-chip.urgent {
  background: rgba(255, 179, 71, 0.15);
  color: #FFB347;
  border: 1px solid rgba(255, 179, 71, 0.3);
}

.deadline-chip.normal {
  background: #1A1A2E;
  color: #8888AA;
  border: 1px solid #1E1E35;
}

.deadline-chip.done {
  background: rgba(168, 255, 120, 0.1);
  color: #A8FF78;
  border: 1px solid rgba(168, 255, 120, 0.2);
}
```

---

### Task Item

Élément de liste dans la vue d'un Cours. Checkbox custom avec accent-study.

```
  ☐  Faire exercices 1–10, chapitre 3    ~30 min   [HIGH]
  ☑  Relire notes du cours 2             ~15 min
```

```css
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #1E1E35;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #1E1E35;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.task-checkbox:checked {
  background: #4A9EFF;
  border-color: #4A9EFF;
  box-shadow: 0 0 8px rgba(74, 158, 255, 0.4);
}

.task-title {
  flex: 1;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  color: #F0F0FF;
}

.task-title.completed {
  text-decoration: line-through;
  color: #8888AA;
}

.task-duration {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  color: #8888AA;
}
```

---

### Objectif Card

Progression vers un Objectif académique ou physique.

```
┌──────────────────────────────────────┐
│  [ACADÉMIQUE]                        │  ← badge type
│  Atteindre un GPA de 3.5             │  ← titre Syne Bold
│                                      │
│  GPA actuel        GPA cible         │
│  3.21              3.50              │
│                                      │
│  ████████████░░░░░░░░  64%           │  ← gauge bleu
└──────────────────────────────────────┘
```

```css
.objectif-card {
  background: #12121F;
  border: 1px solid #1E1E35;
  border-radius: 12px;
  padding: 18px;
}

.objectif-title {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #F0F0FF;
  margin: 8px 0 16px;
}

.objectif-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.objectif-stat-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  color: #8888AA;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.objectif-stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #F0F0FF;
  margin-top: 2px;
}
```

---

### Badge / Tag

Chips compacts pour typer le contenu. Utilisés sur les Blocs, les Recommandations, les Objectifs.

```
  [ÉTUDE]      ← bleu
  [FITNESS]    ← jaune
  [RÉCUP]      ← vert
  [RECO]       ← rose
  [HIGH]       ← warning orange
  [COMPLÉTÉ]   ← success vert
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.badge-study    { background: rgba(74,158,255,0.15);  color: #4A9EFF;  }
.badge-fitness  { background: rgba(255,209,102,0.15); color: #FFD166;  }
.badge-recovery { background: rgba(168,255,120,0.15); color: #A8FF78;  }
.badge-reco     { background: rgba(255,107,157,0.15); color: #FF6B9D;  }
.badge-warning  { background: rgba(255,179,71,0.15);  color: #FFB347;  }
.badge-success  { background: rgba(168,255,120,0.1);  color: #A8FF78;  }
```

---

### Button

Trois variantes. Le bouton primary utilise `accent-study` — cohérent avec l'identité principale.

```
  [  Générer mon Planning  ]   ← primary : fond bleu, glow
  [  Ajouter une Séance    ]   ← secondary : bordure bleu, fond transparent
  [  Ignorer               ]   ← ghost : texte muted, pas de bordure
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-primary {
  background: #4A9EFF;
  color: #0A0A14;
  box-shadow: 0 0 16px rgba(74, 158, 255, 0.4);
}

.btn-primary:hover {
  box-shadow: 0 0 24px rgba(74, 158, 255, 0.6);
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: #4A9EFF;
  border: 1px solid rgba(74, 158, 255, 0.5);
}

.btn-secondary:hover {
  background: rgba(74, 158, 255, 0.08);
  border-color: #4A9EFF;
}

.btn-ghost {
  background: transparent;
  color: #8888AA;
}

.btn-ghost:hover {
  color: #F0F0FF;
}
```

---

### Empty State

Affiché quand aucun contenu n'existe dans une section. Le bear accompagne toujours le message.

```
        🐻
   bear.png (140px)

   Aucun Planning pour aujourd'hui

   Lance la génération pour commencer.

   [ Générer mon Planning ]
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 64px 32px;
  text-align: center;
}

.empty-state img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  opacity: 0.85;
}

.empty-state-title {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #F0F0FF;
}

.empty-state-subtitle {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  color: #8888AA;
  max-width: 320px;
  line-height: 1.6;
}
```

---

### Input

Champs de formulaire. Fond légèrement élevé, bordure subtile qui glows au focus.

```
  ┌──────────────────────────────────┐
  │  Heure de réveil                 │  ← label Space Grotesk Medium 12px
  │  07:00                           │  ← input Space Grotesk 14px
  └──────────────────────────────────┘  ← glow bleu au focus
```

```css
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #8888AA;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.input {
  background: #1A1A2E;
  border: 1px solid #1E1E35;
  border-radius: 8px;
  padding: 10px 14px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  color: #F0F0FF;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus {
  border-color: rgba(74, 158, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.12);
}

.input::placeholder {
  color: #8888AA;
}
```
