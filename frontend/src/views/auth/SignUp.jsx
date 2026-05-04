import { useState } from "react";
import { Link } from "react-router-dom";
import { MdDashboard, MdAccessTime } from "react-icons/md";
import InputField from "components/fields/InputField";
import api from "services/api";

export default function SignUp() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", { name, email, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[8vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <MdDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-poppins text-2xl font-bold text-navy-700 dark:text-white">
            Nexa<span className="font-light text-brand-500">Board</span>
          </span>
        </div>

        {success ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-orange-50 px-6 py-10 text-center dark:bg-orange-900/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
              <MdAccessTime className="h-8 w-8 text-orange-500" />
            </div>
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">
              Compte créé !
            </h4>
            <p className="text-sm leading-relaxed text-orange-700 dark:text-orange-300">
              Votre compte a été créé. En attente d'approbation par un
              administrateur. Vous pourrez vous connecter une fois votre compte
              approuvé.
            </p>
            <Link
              to="/auth/sign-in"
              className="mt-2 text-sm font-semibold text-brand-500 hover:text-brand-600"
            >
              Retour à la connexion →
            </Link>
          </div>
        ) : (
          <>
            <h4 className="mb-2 text-3xl font-bold text-navy-700 dark:text-white">
              Créer un compte
            </h4>
            <p className="mb-9 ml-1 text-base text-gray-600">
              Rejoignez votre espace NexaBoard
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <InputField
                variant="auth" extra="mb-3"
                label="Nom complet*" placeholder="Jean Dupont"
                id="name" type="text"
                value={name} onChange={(e) => setName(e.target.value)}
              />
              <InputField
                variant="auth" extra="mb-3"
                label="Email*" placeholder="vous@exemple.com"
                id="email" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
              <InputField
                variant="auth" extra="mb-3"
                label="Mot de passe*" placeholder="Min. 8 caractères"
                id="password" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <InputField
                variant="auth" extra="mb-3"
                label="Confirmer le mot de passe*" placeholder="Répétez le mot de passe"
                id="confirm" type="password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200"
              >
                {loading ? "Création…" : "Créer mon compte"}
              </button>
            </form>

            <div className="mt-6">
              <span className="text-sm font-medium text-navy-700 dark:text-gray-600">
                Déjà un compte ?
              </span>
              <Link
                to="/auth/sign-in"
                className="ml-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
              >
                Se connecter
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
