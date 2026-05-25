import { Navigate } from "react-router";
import { getAuthUser } from "../hooks/useAuth";

interface Props {
  children: React.ReactNode;
  role?: "student" | "teacher";
}

export default function PrivateRoute({ children, role }: Props) {
  const user = getAuthUser();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
