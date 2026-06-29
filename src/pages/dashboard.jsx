import AdminDashboard from "./dashboards/AdminDashboard";
import CajeroDashboard from "./dashboards/CajeroDashboard";
import MozoDashboard from "./dashboards/MozoDashboard";
import CocinaDashboard from "./dashboards/CocinaDashboard";
import RepartidorDashboard from "./dashboards/RepartidorDashboard";
import SupervisorDashboard from "./dashboards/SupervisorDashboard";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  switch (user?.id_rol) {
    case 1:
      return <AdminDashboard />;

    case 2:
      return <SupervisorDashboard />;

    case 3:
      return <CajeroDashboard />;

    case 4:
      return <MozoDashboard />;

    case 5:
      return <CocinaDashboard />;

    case 6:
      return <RepartidorDashboard />;

    default:
      return <div>Sin acceso</div>;
  }
}

export default Dashboard;