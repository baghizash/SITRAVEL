import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import PenggunaDashboard from "@/pages/dashboards/PenggunaDashboard";
import TravelDashboard from "@/pages/dashboards/TravelDashboard";
import ManagerDashboard from "@/pages/dashboards/ManagerDashboard";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import DriverDashboard from "@/pages/dashboards/DriverDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardRouter() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-10 flex items-center gap-2 text-[#4A5257]"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div>;
  if (user === false) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "admin_app": return <AdminDashboard />;
    case "travel":    return <TravelDashboard />;
    case "manager":   return <ManagerDashboard />;
    case "driver":    return <DriverDashboard />;
    default:          return <PenggunaDashboard />;
  }
}
