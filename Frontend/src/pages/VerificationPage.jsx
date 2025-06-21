// src/pages/VerificationPage.jsx
import useAuthStore from '../store/authStore';

export default function VerificationPage() {
  const user = useAuthStore(state => state.user);
  if (!user.permissions.canVerifyDocuments) {
    return <p>No permission to verify documents.</p>;
  }
  return (
    <div>
      <h2>Document Verification</h2>
      <p>Implement document review UI here.</p>
    </div>
  );
}
