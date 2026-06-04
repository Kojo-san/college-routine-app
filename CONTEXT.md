# College Routine

Plateforme intelligente de gestion de performance pour étudiants universitaires. Le système génère un Planning quotidien adaptatif à partir de données académiques, physiologiques et d'objectifs personnels, en s'appuyant sur des Règles ancrées dans la recherche scientifique.

## Language

### Planification

**Planning** :
L'horaire quotidien intelligent généré par le système pour un Étudiant. Il est composé de Blocs, chacun associé à une Séance ou une Tâche.
_Avoid_ : Agenda, Schedule, Horaire, Calendrier

**Bloc** :
L'unité atomique d'un Planning. Chaque Bloc a une heure de début, une heure de fin, et est associé à une Séance ou une Tâche.
_Avoid_ : Créneau, Plage, Slot, Événement, Entrée

### Acteur

**Étudiant** :
La personne pour qui le système génère un Planning. Son profil combine des données académiques (Cours, Échéances), physiologiques (Signaux, État) et des Objectifs personnels.
_Avoid_ : Utilisateur, User, Performeur, Client

### Activités

**Séance** :
Une activité planifiée et délimitée dans le temps, appartenant à l'un des trois types — Étude, Fitness, ou Récupération. Toute Séance occupe un ou plusieurs Blocs dans le Planning.
_Avoid_ : Session, Workout, Activité, Événement

### Données de santé

**Signal** :
Une mesure physiologique brute collectée depuis Apple Health ou saisie manuellement. Exemples : durée de sommeil, fréquence cardiaque au repos, nombre de pas.
_Avoid_ : Donnée de santé, Métrique, Indicateur

**État** :
La synthèse calculée des Signaux pour une journée donnée. Il comprend deux dimensions — l'État Physique (fatigue, dette de sommeil) et l'État Cognitif (focus, stress, motivation). L'État oriente directement la composition du Planning.
_Avoid_ : Score, Profil, Bilan, Condition

### Intelligence

**Recommandation** :
Un conseil personnalisé généré par le système pour un Planning donné. Elle est explicable — chaque Recommandation cite la Règle et la source scientifique qui la justifient.
_Avoid_ : Suggestion, Conseil, Alerte, Notification

**Règle** :
Un patron condition→action ancré dans une source scientifique. Si la condition est vraie (ex. : dette de sommeil > 1h), la Règle génère une Recommandation de type correspondant.
_Avoid_ : Règle Scientifique, Protocole, Principe, Heuristique

### Académique

**Cours** :
Une matière universitaire suivie par l'Étudiant. Un Cours contient un Plan de Cours, des Échéances et des Tâches.
_Avoid_ : Matière, Module, Classe

**Échéance** :
Une évaluation notée associée à un Cours, avec une date limite et un poids dans la note finale. Les Échéances influencent la priorité des Séances d'Étude dans le Planning.
_Avoid_ : Deadline, Devoir, Remise, Date limite

**Tâche** :
Un élément de travail concret et borné dans le temps, associé à un Cours. Une Tâche occupe un ou plusieurs Blocs dans le Planning.
_Avoid_ : Activité, Item, Action, To-do

### Objectifs

**Objectif** :
Une cible que l'Étudiant cherche à atteindre, académique (GPA, note) ou physique (poids, composition corporelle). Les Objectifs orientent la composition du Planning — ils déterminent quelles Séances sont prioritaires.
_Avoid_ : But, Cible, Goal, Ambition
