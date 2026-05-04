import React from "react";

// Admin Imports
import MainDashboard  from "views/admin/default";
import Profile        from "views/admin/profile";
import GitHubPage     from "views/admin/github";
import TrelloPage     from "views/admin/trello";
import SlackPage      from "views/admin/slack";
import GoogleDrivePage from "views/admin/google";
import SettingsPage   from "views/admin/settings";
import AdminPanel     from "views/admin/admin-panel";
import NotFound       from "views/admin/404";

// Auth Imports
import SignIn  from "views/auth/SignIn";
import SignUp  from "views/auth/SignUp";

// Icon Imports
import { MdHome, MdPerson, MdLock, MdSettings, MdAdminPanelSettings } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { SiTrello, SiSlack, SiGoogledrive } from "react-icons/si";

const routes = [
  // ── Main section ───────────────────────────────────────────────
  {
    name: "Tableau de bord",
    layout: "/admin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
    section: "main",
  },
  {
    name: "GitHub",
    layout: "/admin",
    path: "github",
    icon: <FaGithub className="h-5 w-5" />,
    component: <GitHubPage />,
    section: "main",
  },
  {
    name: "Trello",
    layout: "/admin",
    path: "trello",
    icon: <SiTrello className="h-5 w-5" />,
    component: <TrelloPage />,
    section: "main",
  },
  {
    name: "Slack",
    layout: "/admin",
    path: "slack",
    icon: <SiSlack className="h-5 w-5" />,
    component: <SlackPage />,
    section: "main",
  },
  {
    name: "Google Drive",
    layout: "/admin",
    path: "google",
    icon: <SiGoogledrive className="h-5 w-5" />,
    component: <GoogleDrivePage />,
    section: "main",
  },
  // ── Settings section ───────────────────────────────────────────
  {
    name: "Profil",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-5 w-5" />,
    component: <Profile />,
    section: "settings",
  },
  {
    name: "Paramètres API",
    layout: "/admin",
    path: "settings",
    icon: <MdSettings className="h-5 w-5" />,
    component: <SettingsPage />,
    section: "settings",
  },
  // ── Admin section (visible only for admin role) ────────────────
  {
    name: "Panneau d'administration",
    layout: "/admin",
    path: "admin-panel",
    icon: <MdAdminPanelSettings className="h-5 w-5" />,
    component: <AdminPanel />,
    section: "admin",
  },
  // ── Auth (not in sidebar) ──────────────────────────────────────
  {
    name: "Se connecter",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
  {
    name: "Créer un compte",
    layout: "/auth",
    path: "sign-up",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignUp />,
  },
  // ── Catch-all 404 ─────────────────────────────────────────────
  {
    name: "Page introuvable",
    layout: "/admin",
    path: "404",
    component: <NotFound />,
  },
];

export default routes;
