import { useState, useEffect, useCallback, useRef } from 'react';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);
  const watchId = useRef(null);

  const handleSuccess = useCallback((pos) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    });
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    setError(err.message || 'Location unavailable');
  }, []);

  // Start continuous watching
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    if (watchId.current != null) return; // already watching

    setError(null);
    setWatching(true);

    // Get immediate position first (faster initial fix)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });

    // Then start continuous watch
    watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
    });
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setWatching(false);
  }, []);

  // One-shot location request (also starts watching)
  const requestLocation = useCallback(() => {
    startWatching();
  }, [startWatching]);

  // Auto-start watching on mount (user will see browser permission prompt)
  useEffect(() => {
    if (!navigator.geolocation) return () => {};
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' || result.state === 'prompt') {
          startWatching();
        }
        result.onchange = () => {
          if (result.state === 'granted') startWatching();
          else if (result.state === 'denied') {
            stopWatching();
            setError('Location permission denied');
          }
        };
      }).catch(() => {
        // permissions API failed (common on iOS Safari) — try starting anyway
        startWatching();
      });
    } else {
      // No permissions API (older browsers / iOS) — just start
      startWatching();
    }
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  return { position, error, watching, requestLocation, startWatching, stopWatching };
}
