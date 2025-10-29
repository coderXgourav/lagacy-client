import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
