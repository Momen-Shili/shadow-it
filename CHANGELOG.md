# Journal des modifications (Changelog)

Toutes les modifications notables de **NexaBoard — Shadow IT Dashboard** sont documentées ici.

Format inspiré de [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Non publié] — En développement

### Prévu
- Journaux d'activité admin détaillés avec filtres
- Notifications en temps réel pour les approbations de comptes
- Export des données en CSV

---

## [0.5.0] — 2026-05-04

### Ajouté — Interface entièrement en français

#### Frontend — Traduction complète
- Tableau de bord principal : "Dépôts GitHub", "Total Étoiles", "Cartes Trello", "Canaux Slack", "Fichiers Drive", "Services Connectés"
- Fil d'activité : "Fil d'Activité", "Tous les Services", "Activité GitHub Récente", "Top 5 Dépôts par Étoiles"
- Statut des services : "Statut des Services", "Connecté", "Déconnecté"
- Page GitHub : "Dépôts Publics", "Abonnés", "Abonnements", "Dépôts", "Rechercher un dépôt…", "Langages", "Répartition sur X dépôts"
- Page Trello : "Tableaux", "Retour aux Tableaux", "Aucune carte", dates relatives en français
- Page Slack : "Rechercher un canal…", "Sélectionnez un canal pour voir les messages", "En ligne", "Membre"
- Page Google Drive : "Google Drive non connecté", "Quota de Stockage", "Dans Drive", "Dans la Corbeille", "Fichiers Récents", colonnes NOM/TYPE/TAILLE/MODIFIÉ
- Page Profil : "Informations Générales", "Détails de votre compte NexaBoard", "Nom complet", "Rôle", traduction des rôles (Analyste, Administrateur, Membre)
- Paramètres API : "Paramètres API", "Configuré", "Non configuré", "Mettre à jour", "laisser vide pour conserver l'existante"
- Navbar : "Paramètres du profil", "Se déconnecter"
- Connexion : "Bon retour", "Connectez-vous à votre espace NexaBoard", "Mot de passe", "Mot de passe oublié ?", "Se connecter", "Connexion en cours…"
- Sidebar : "Menu Principal", "Paramètres", "Administration"
- Footer : "Confidentialité", "CGU"
- Page 404 : "Page introuvable", "La page que vous recherchez n'existe pas", "Retour au tableau de bord"
- Dates relatives : "aujourd'hui", "hier", "il y a X jours/mois/ans"

---

## [0.4.0] — 2026-05-03

### Ajouté — Architecture Multi-Utilisateurs

#### Backend
- Nouvelle table `user_api_keys` — stocke les tokens GitHub/Trello/Slack chiffrés AES-256-GCM par utilisateur
- Nouvelle table `activity_logs` — trace les actions admin (approuvé / rejeté / dashboard consulté)
- Nouvelle colonne `status` sur la table `users` — `pending` / `approved` / `rejected`
- Nouvelle colonne `rejected_at` sur la table `users` — horodatage du rejet
- Rôle par défaut changé de `analyst` à `team_member`
- Nouveau utilitaire `src/utils/crypto.js` — chiffrement/déchiffrement AES-256-GCM avec variable `ENCRYPTION_KEY`
- Nouveau contrôleur `adminController.js` — getMembers, approveMember, rejectMember, getMemberDashboard, getTeamStats, getActivityLogs
- Nouveau contrôleur `apiKeysController.js` — getMyKeys (booléens uniquement), saveKeys (upsert chiffré), deleteKey
- Nouvelles routes `/api/admin/*` — protégées par `verifyToken` + `requireRole('admin')`
- Nouvelles routes `/api/keys/*` — protégées par `verifyToken`
- `ENCRYPTION_KEY` ajoutée dans `.env.example`

#### Flux d'authentification
- `register` définit toujours `role = 'team_member'` et `status = 'pending'`
- `login` bloque avec HTTP 403 si le statut est `pending` ou `rejected`
- Messages d'erreur en français : *"Votre compte est en attente d'approbation"* / *"Votre compte a été rejeté"*

#### Contrôleurs de services
- `githubController.js` — suppression de `process.env.GITHUB_TOKEN`, lecture depuis `user_api_keys` via `req.user.id`
- `trelloController.js` — suppression de `process.env.TRELLO_API_KEY/TOKEN`, lecture depuis `user_api_keys`
- `slackController.js` — suppression de `process.env.SLACK_BOT_TOKEN`, lecture depuis `user_api_keys`
- Les trois contrôleurs retournent HTTP 400 *"Clé API non configurée. Rendez-vous dans Settings."* si la clé est absente

#### Migration
- Migration exécutée dans une transaction PostgreSQL (BEGIN / COMMIT / ROLLBACK)
- Instructions `ALTER TABLE` idempotentes pour les installations existantes

#### Frontend
- Nouvelle page **Inscription** (`/auth/sign-up`) — formulaire avec message d'attente après succès
- Nouvelle page **Onboarding** (`/admin/onboarding`) — 3 étapes guidées (GitHub → Trello → Slack) sans sidebar
- Nouvelle page **Paramètres API** (`/admin/settings`) — gestion des clés avec badges Configuré/Non configuré
- Nouvelle page **Panneau Admin** (`/admin/admin-panel`) — statistiques équipe, membres en attente, approbation/rejet, consultation des dashboards
- `AuthContext` — vérifie les clés configurées après connexion, redirige vers onboarding si aucune clé
- `SignIn.jsx` — bannières d'erreur différenciées (orange pour pending, rouge pour rejeté)
- `App.jsx` — route standalone `/admin/onboarding` sans AdminLayout
- Sidebar — section "Administration" visible uniquement pour `user.role === 'admin'`

---

## [0.3.0] — 2026-05-02

### Ajouté — Rebrand NexaBoard & Améliorations UI

#### Branding
- Renommage de "Horizon UI" vers **NexaBoard**
- Nouveau logo dans la sidebar : icône `MdDashboard` + wordmark "Nexa**Board**"
- Page de connexion rebrandée : logo NexaBoard, "Welcome back", "Sign in to your NexaBoard workspace"
- Footer mis à jour : "NexaBoard © 2026 — Operational Centralization Platform"

#### Sidebar
- Supprimé : NFT Marketplace, RTL Admin, Data Tables, lien Sign In
- Ajout des labels de sections : **MAIN MENU** et **SETTINGS**
- Les routes portent maintenant un champ `section` (`main` / `settings`) pour le groupage
- Suppression du bouton "Upgrade to PRO"
- Profil déplacé dans la section Settings

#### Tableau de bord principal
- Remplacement de `CheckTable` et `ComplexTable` (données fictives) par le **Fil d'Activité Unifié**
- Le fil mélange repos GitHub, tableaux Trello, canaux Slack, fichiers Drive triés par date
- Ajout du widget **Statut des Services** — vert "Connected" / rouge "Disconnected"
- Remplacement de `DailyTraffic` et `PieChartCard` (fictifs) par **Commits Récents** et **Vue Trello**
- Remplacement de `TaskCard` et `MiniCalendar` (fictifs) par **Messages Slack Récents** et **Fichiers Drive Récents**
- Les widgets KPI affichent `—` au lieu de `0` quand un service échoue silencieusement

#### Page Profil
- `Banner.jsx` — avatar fictif remplacé par un cercle d'initiales (bg-brand-500), vrai `user.name` et `user.role`
- `General.jsx` — tous les champs fictifs remplacés par les vraies données `user.email`, `user.name`, `user.role`
- Suppression des champs fictifs : Stanford University, English/Spanish/Italian, Product Design, anniversaire

#### Navbar
- Avatar image remplacé par un cercle d'initiales (bg-brand-500, texte blanc)
- Le dropdown affiche le vrai `user.name` et `user.email`
- "Hey, Adela" remplacé par "Hey, {prénom}" dynamique
- Bouton "Log Out" appelle `useAuth().logout()` et redirige vers `/auth/sign-in`
- Lien "Profile Settings" route vers `/admin/profile`

#### Page GitHub
- Ajout du **Graphique de distribution des langages** (ApexCharts, top 10 langages)
- Ajout d'une **barre de recherche live** filtrant les dépôts par nom
- Le badge de comptage se met à jour dynamiquement pendant la recherche ("X sur Y")

#### Page Slack
- Ajout du badge **En ligne** vert à côté du nom de l'espace de travail
- Amélioration de l'affichage des utilisateurs : les IDs Slack bruts affichés comme `Membre ·{4derniers}`

#### Autres
- Ajout d'une **page 404 personnalisée** avec le branding NexaBoard et bouton "Retour au tableau de bord"
- Ajout d'une route catch-all `*` → `/admin/404` dans le layout admin

---

## [0.2.0] — 2026-05-01

### Ajouté — Toutes les intégrations API & Dashboard

#### Intégration Google Drive
- Flux OAuth2 Authorization Code Flow complet (pas token-based)
- `GET /api/google/auth` — génère l'URL de consentement OAuth2
- `GET /api/google/callback` — échange le code, sauvegarde les tokens chiffrés dans `service_credentials`
- `GET /api/google/files` — liste 20 fichiers récents avec type MIME, taille, date de modification
- `GET /api/google/quota` — quota de stockage avec pourcentage utilisé
- Page frontend `/admin/google` — bouton de connexion, barre de progression du quota, tableau des fichiers
- Setup Google Cloud Console : API Drive activée, credentials OAuth2, utilisateur test ajouté
- Rotation automatique des tokens via l'événement `tokens` de `googleapis`

#### Intégration Slack
- Application Slack créée sur api.slack.com/apps
- Scopes bot : `channels:read`, `channels:history`, `users:read`, `team:read`
- `GET /api/slack/workspace` — nom, domaine, icône de l'espace de travail
- `GET /api/slack/channels` — canaux publics avec nombre de membres et sujet
- `GET /api/slack/channels/:id/messages` — 20 derniers messages avec réactions
- Page frontend `/admin/slack` — mise en page à deux panneaux (liste canaux + fil messages)
- Auto-scroll vers le dernier message via `useRef`
- Gestion d'erreurs Slack : `response.data.ok` vérifié (Slack retourne toujours HTTP 200)

#### Intégration Trello
- Application Trello Power-Up créée, clé API et Token générés
- `GET /api/trello/boards` — tableaux avec nom, description, dernière activité
- `GET /api/trello/boards/:id/lists` — listes ouvertes
- `GET /api/trello/boards/:id/cards` — cartes avec labels, dates d'échéance, descriptions
- Page frontend `/admin/trello` — vue grille des tableaux + vue Kanban au clic
- Badges de date d'échéance : vert (fait), rouge (dépassée), orange (<24h), gris (futur)
- Couleurs des labels mappées depuis les noms Trello vers les classes Tailwind

#### Tableau de bord principal — Données réelles
- 6 widgets KPI remplacés par des données réelles (repos GitHub, étoiles, cartes Trello, canaux Slack, fichiers Drive, services connectés)
- Les 4 APIs appelées en parallèle avec `Promise.allSettled()` — un échec ne casse pas la page
- Fil **Activité GitHub Récente** (5 dépôts mis à jour le plus récemment)
- Graphique en barres **Top 5 Dépôts par Étoiles** (ApexCharts, données dynamiques depuis l'API)
- Comptage des cartes Trello chargé en asynchrone (appel secondaire non bloquant)
- État de chargement affiche `…` dans les widgets pendant le chargement des données

---

## [0.1.0] — 2026-04-30

### Ajouté — Fondation

#### Backend
- API REST Node.js 20 + Express 4 sur le port 5000
- Base de données PostgreSQL 16 avec pool `pg` (max 20 connexions)
- 5 tables en base : `users`, `refresh_tokens`, `integrations`, `service_credentials`, `audit_log`
- Script `npm run db:migrate` — crée toutes les tables et index de façon idempotente
- Authentification JWT à double token : token d'accès (15min) + token de rafraîchissement (7 jours)
- Hachage des mots de passe `bcryptjs` avec 12 tours de sel
- En-têtes de sécurité HTTP avec `helmet`
- `cors` — origine restreinte à `http://localhost:3000`
- Rate limit global : 100 req/15min ; Rate limit auth : 10 req/15min
- Validation des entrées avec `express-validator` sur toutes les routes POST/PATCH
- Middleware global de gestion des erreurs — réponses JSON structurées
- Logging des requêtes avec `morgan` en développement

#### Intégration GitHub
- Personal Access Token stocké dans `.env`
- `GET /api/github/profile` — profil utilisateur
- `GET /api/github/repos` — dépôts (triés par updated_at)
- `GET /api/github/commits` — commits récents par dépôt via `Promise.allSettled`
- Page frontend `/admin/github` — carte profil, badges stats, grille des dépôts avec couleurs de langages

#### Frontend
- React 18 + Tailwind CSS + template Horizon UI gratuit
- Client Axios (`services/api.js`) avec intercepteur JWT sur les requêtes
- Intercepteur de réponse : rafraîchissement auto sur 401, déconnexion sur second 401
- `AuthContext` — état global user, login, logout, loading, error
- `PrivateRoute` — redirige vers la connexion si non authentifié
- `authService.js` — login, register, logout, getCurrentUser avec persistance localStorage
- Page de connexion connectée au vrai backend (POST /api/auth/login)
- JWT stocké dans localStorage sous `shadow_token` / `shadow_refresh_token` / `shadow_user`

#### Infrastructure
- Structure du projet : `Shadow IT/frontend/` + `Shadow IT/backend/`
- Template `.env.example` avec toutes les variables requises
- `.gitignore` exclut `node_modules/`, `.env`, `*.log`
- Configuration PostgreSQL sur Windows via installeur + configuration du PATH psql

---

## Légende

| Symbole | Signification |
|---|---|
| **Ajouté** | Nouvelle fonctionnalité ou fichier |
| **Modifié** | Modification d'une fonctionnalité existante |
| **Corrigé** | Correction de bug |
| **Supprimé** | Fonctionnalité ou fichier supprimé |
| **Sécurité** | Amélioration de la sécurité |

---

*NexaBoard — Momen Shili & Manef Dakhlaoui — 2025/2026*
