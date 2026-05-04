import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdDashboard, MdAccessTime, MdErrorOutline } from "react-icons/md";
import InputField from "components/fields/InputField";
import { useAuth } from "context/AuthContext";

function ErrorBanner({ message }) {
  if (!message) return null;
  if (message.includes("attente")) {
    return (
      <div className="mb-4 flex items-start gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
        <MdAccessTime className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }
  if (message.includes("rejeté")) {
    return (
      <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <MdErrorOutline className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }
  return (
    <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      {message}
    </div>
  );
}

export default function SignIn() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { needsOnboarding } = await login(email, password);
      navigate(needsOnboarding ? "/admin/onboarding" : "/admin/default", { replace: true });
    } catch {
      // error displayed via AuthContext
    }
  }

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        {/* NexaBoard brand header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <MdDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-poppins text-2xl font-bold text-navy-700 dark:text-white">
            Nexa<span className="font-light text-brand-500">Board</span>
          </span>
        </div>

        <h4 className="mb-2 text-3xl font-bold text-navy-700 dark:text-white">
          Bon retour
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600">
          Connectez-vous à votre espace NexaBoard
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <ErrorBanner message={error} />

          <InputField
            variant="auth" extra="mb-3"
            label="E-mail*" placeholder="vous@exemple.com"
            id="email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            variant="auth" extra="mb-3"
            label="Mot de passe*" placeholder="Min. 8 caractères"
            id="password" type="password"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-1">
          <span className="text-sm font-medium text-navy-700 dark:text-gray-600">
            Pas encore de compte ?
          </span>
          <Link
            to="/auth/sign-up"
            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
