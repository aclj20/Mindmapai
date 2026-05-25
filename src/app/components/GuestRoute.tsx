import { Navigate } from "react-router";
import { getAuthUser } from "../hooks/useAuth";

interface Props {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: Props) {
  const user = getAuthUser();

  if (user) {
    const dest = user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
}
