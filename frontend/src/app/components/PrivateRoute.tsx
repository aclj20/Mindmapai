import { Navigate, useLocation } from "react-router";
import { getAuthUser } from "../hooks/useAuth";

interface Props {
  children: React.ReactNode;
  role?: "student" | "teacher";
}

export default function PrivateRoute({ children, role }: Props) {
  const user = getAuthUser();
  const location = useLocation();

  const next = encodeURIComponent(location.pathname + location.search);
  if (!user) return <Navigate to={`/login?next=${next}`} replace />;
  if (role && user.role !== role) return <Navigate to={`/login?next=${next}`} replace />;

  return <>{children}</>;
}
