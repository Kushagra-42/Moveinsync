// src/pages/AnalyticsPage.jsx
import useAuthStore from '../store/authStore';

export default function AnalyticsPage() {
  const user = useAuthStore(state => state.user);
  if (!user.permissions.canViewAnalytics) {
    return <p>No permission to view analytics.</p>;
  }
  return (
    <div>
      <h2>Analytics</h2>
      <p>Implement charts and stats here.</p>
    </div>
  );
}