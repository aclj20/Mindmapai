import { Navigate } from "react-router";
import { getAuthUser, getToken } from "../hooks/useAuth";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const user = getAuthUser();

  if (!token || !user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin" && user.role !== "teacher") return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
}
