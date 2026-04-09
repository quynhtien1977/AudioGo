import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();

  // chưa login
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // sai role
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}