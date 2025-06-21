// src/components/FleetManagement.jsx
import useAuthStore from '../store/authStore';

export default function FleetManagement() {
  const user = useAuthStore(state => state.user);
  if (!user.permissions.canManageFleet) {
    return <p>You do not have access to manage fleet.</p>;
  }
  return (
    <div>
      <h2>Fleet Management</h2>
      <p>Placeholder: here you can implement vehicle state dashboard, assignments, etc.</p>
      {/* Later integrate API calls for vehicles, show tables, forms, etc. */}
    </div>
  );
}
