/* eslint-disable */
import { HiX } from "react-icons/hi";
import { Link, useLocation } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import DashIcon from "components/icons/DashIcon";
import routes from "routes.js";
import { useAuth } from "context/AuthContext";

function NavLink({ route }) {
  const location = useLocation();
  const active = location.pathname.includes(route.path);
  return (
    <Link to={route.layout + "/" + route.path}>
      <div className="relative mb-1 flex hover:cursor-pointer">
        <li className="my-[3px] flex cursor-pointer items-center px-8">
          <span className={active ? "font-bold text-brand-500 dark:text-white" : "font-medium text-gray-600"}>
            {route.icon ?? <DashIcon />}
          </span>
          <p className={`leading-1 ml-4 flex ${active ? "font-bold text-navy-700 dark:text-white" : "font-medium text-gray-600"}`}>
            {route.name}
          </p>
        </li>
        {active && (
          <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
        )}
      </div>
    </Link>
  );
}

function SectionLabel({ label }) {
  return (
    <p className="ml-8 mt-5 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {label}
    </p>
  );
}

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();

  const mainRoutes     = routes.filter((r) => r.layout === "/admin" && r.section === "main");
  const settingsRoutes = routes.filter((r) => r.layout === "/admin" && r.section === "settings");
  const adminRoutes    = routes.filter((r) => r.layout === "/admin" && r.section === "admin");

  return (
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className="absolute top-4 right-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      {/* ── NexaBoard Logo ── */}
      <div className="mx-[56px] mt-[44px] flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
          <MdDashboard className="h-5 w-5 text-white" />
        </div>
        <div className="font-poppins text-[22px] font-bold text-navy-700 dark:text-white">
          Nexa<span className="font-light text-brand-500">Board</span>
        </div>
      </div>

      <div className="mt-[40px] mb-3 h-px bg-gray-200 dark:bg-white/10 mx-6" />

      {/* ── Navigation ── */}
      <ul className="mb-auto pt-1">
        <SectionLabel label="Menu principal" />
        {mainRoutes.map((route, i) => (
          <NavLink key={i} route={route} />
        ))}

        <SectionLabel label="Paramètres" />
        {settingsRoutes.map((route, i) => (
          <NavLink key={i} route={route} />
        ))}

        {user?.role === "admin" && adminRoutes.length > 0 && (
          <>
            <SectionLabel label="Administration" />
            {adminRoutes.map((route, i) => (
              <NavLink key={i} route={route} />
            ))}
          </>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
