import { useEffect, useState } from 'react';

export function useLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is unavailable in this browser');
      setLocation({ lat: 21.5, lng: 83.87 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationEnabled(true);
      },
      () => {
        setError('Location permission was denied; using public dam zone as fallback');
        setLocation({ lat: 21.5, lng: 83.87 });
        setLocationEnabled(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, locationEnabled, error };
}
