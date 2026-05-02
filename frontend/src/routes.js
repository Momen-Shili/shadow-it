import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import Profile from "views/admin/profile";
import GitHubPage from "views/admin/github";
import TrelloPage from "views/admin/trello";
import SlackPage from "views/admin/slack";
import GoogleDrivePage from "views/admin/google";
import NotFound from "views/admin/404";

// Auth Imports
import SignIn from "views/auth/SignIn";

// Icon Imports
import { MdHome, MdPerson, MdLock } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { SiTrello, SiSlack, SiGoogledrive } from "react-icons/si";

const routes = [
  // ── Main section (visible in sidebar) ──────────────────────────
  {
    name: "Main Dashboard",
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
  // ── Settings section (visible in sidebar) ──────────────────────
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-5 w-5" />,
    component: <Profile />,
    section: "settings",
  },
  // ── Auth (not in sidebar) ──────────────────────────────────────
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
  // ── 404 (not in sidebar, catch-all) ───────────────────────────
  {
    name: "Not Found",
    layout: "/admin",
    path: "404",
    component: <NotFound />,
  },
];

export default routes;
