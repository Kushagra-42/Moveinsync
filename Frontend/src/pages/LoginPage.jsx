import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LoginForm from '../components/LoginForm';
import '../styles/LoginPage.css'; // Import LoginPage styles

export default function LoginPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard/home');
    }
  }, [user, navigate]);

  return (
    <div className="login-page">
      <div className="login-header">
        <h1 className="VMSH1">Fleet Management System</h1>
        <p className="login-subheader">Manage your fleet efficiently with our comprehensive platform</p>
      </div>
      <div className="login-container">
        <h2>Login</h2>
        <p className="login-instruction">Please sign in to access your dashboard</p>
        <LoginForm />
      </div>
    </div>
  );
}
