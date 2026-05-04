import Card from "components/card";
import { useAuth } from "context/AuthContext";

const General = () => {
  const { user } = useAuth();

  return (
    <Card extra={"w-full h-full p-3"}>
      {/* Header */}
      <div className="mb-8 mt-2 w-full">
        <h4 className="px-2 text-xl font-bold text-navy-700 dark:text-white">
          Informations Générales
        </h4>
        <p className="mt-2 px-2 text-base text-gray-600">
          Détails du compte pour votre espace de travail NexaBoard.
        </p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="col-span-2 flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
          <p className="text-sm text-gray-600">Email</p>
          <p className="text-base font-medium text-navy-700 dark:text-white">
            {user?.email ?? "—"}
          </p>
        </div>

        <div className="flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
          <p className="text-sm text-gray-600">Nom complet</p>
          <p className="text-base font-medium text-navy-700 dark:text-white">
            {user?.name ?? "—"}
          </p>
        </div>

        <div className="flex flex-col justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
          <p className="text-sm text-gray-600">Role</p>
          <p className="text-base font-medium text-navy-700 dark:text-white">
            {user?.role
              ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
              : "—"}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default General;
