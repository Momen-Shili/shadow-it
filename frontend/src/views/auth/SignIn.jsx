import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import InputField from "components/fields/InputField";
import { useAuth } from "context/AuthContext";

export default function SignIn() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/admin/default", { replace: true });
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
          Welcome back
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600">
          Sign in to your NexaBoard workspace
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <InputField
            variant="auth"
            extra="mb-3"
            label="Email*"
            placeholder="you@example.com"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputField
            variant="auth"
            extra="mb-3"
            label="Password*"
            placeholder="Min. 8 characters"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />


          <button
            type="submit"
            disabled={loading}
            className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
}
