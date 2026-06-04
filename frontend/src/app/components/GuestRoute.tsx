import { Navigate } from "react-router";
import { getAuthUser } from "../hooks/useAuth";

interface Props {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: Props) {
  const user = getAuthUser();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
