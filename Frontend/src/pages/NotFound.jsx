// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Page Not Found</h2>
      <Link to="/login">Go to Login</Link>
    </div>
  );
}
