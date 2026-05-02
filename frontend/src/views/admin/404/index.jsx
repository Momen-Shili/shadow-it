import { useNavigate } from "react-router-dom";
import { MdErrorOutline } from "react-icons/md";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lightPrimary dark:bg-navy-800">
        <MdErrorOutline className="h-12 w-12 text-brand-500" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-7xl font-extrabold text-navy-700 dark:text-white">
          404
        </h1>
        <p className="text-xl font-semibold text-navy-700 dark:text-white">
          Page not found
        </p>
        <p className="max-w-xs text-sm text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <button
        onClick={() => navigate("/admin/default")}
        className="rounded-xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 active:bg-brand-700"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
