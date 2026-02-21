import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function StudentDetailsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard/bookings');
  }, [navigate]);

  return null;
}
