import { useState, useEffect, useCallback, useRef } from 'react';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);
  const watchId = useRef(null);
  const retried = useRef(false);

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

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    if (watchId.current != null) return;

    setError(null);
    setWatching(true);

    // Try high accuracy first, fall back to low accuracy on failure (iOS fix)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        // On iOS, high accuracy can timeout — retry with low accuracy
        if (!retried.current) {
          retried.current = true;
          navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 120000,
          });
        } else {
          handleError(err);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );

    // Watch with lower accuracy requirement for reliability on mobile
    watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 10000,
    });
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setWatching(false);
  }, []);

  const requestLocation = useCallback(() => {
    // Reset retry flag so the user can re-trigger
    retried.current = false;
    // If already watching, do a fresh getCurrentPosition
    if (watchId.current != null) {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (err) => {
          navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: false, timeout: 30000, maximumAge: 120000,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      startWatching();
    }
  }, [startWatching, handleSuccess, handleError]);

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
        // permissions API not supported (iOS Safari) — try starting anyway
        startWatching();
      });
    } else {
      // No permissions API — just start (iOS Safari, older browsers)
      startWatching();
    }
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  return { position, error, watching, requestLocation, startWatching, stopWatching };
}
