import { useNavigate } from "react-router";
import { getAuthUser } from "../hooks/useAuth";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleGoHome = () => navigate(user ? "/dashboard" : "/", { replace: true });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center font-sans">
      <p className="text-8xl font-black text-primary/20 leading-none select-none">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-foreground">Página no encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        La dirección que buscas no existe o fue movida.
      </p>
      <button
        onClick={handleGoHome}
        className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
      >
        {user ? "Ir al inicio" : "Volver"}
      </button>
    </div>
  );
}
