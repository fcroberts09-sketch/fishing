import { useState, useEffect, useCallback, useRef } from 'react';

// Detect iOS Safari — geolocation behaves differently
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);
  const watchId = useRef(null);
  const attemptCount = useRef(0);

  const handleSuccess = useCallback((pos) => {
    // Validate coordinates are reasonable (not 0,0 or null)
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if (lat === 0 && lng === 0) return; // spurious result
    setPosition({
      lat,
      lng,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    });
    setError(null);
    attemptCount.current = 0;
  }, []);

  const handleError = useCallback((err) => {
    // Map error codes to user-friendly messages
    const msgs = {
      1: 'Location permission denied. Please enable in Settings > Safari > Location.',
      2: 'Location unavailable. Check that Location Services is enabled in Settings > Privacy.',
      3: 'Location request timed out. Trying again...',
    };
    setError(msgs[err.code] || err.message || 'Location unavailable');
  }, []);

  // Core function: get a single position with fallback strategy
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this browser');
      return;
    }

    attemptCount.current += 1;
    const attempt = attemptCount.current;

    // Strategy: try low accuracy first on iOS (faster, more reliable),
    // high accuracy first on other platforms
    const tryHighFirst = !isIOS && attempt <= 2;

    const opts1 = tryHighFirst
      ? { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      : { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 };

    const opts2 = tryHighFirst
      ? { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      : { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        // First attempt failed, try opposite accuracy setting
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (err2) => {
            handleError(err2);
            // On timeout, auto-retry once more after a brief delay
            if (err2.code === 3 && attempt < 3) {
              setTimeout(() => getPosition(), 2000);
            }
          },
          opts2
        );
      },
      opts1
    );
  }, [handleSuccess, handleError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    if (watchId.current != null) return;

    setError(null);
    setWatching(true);

    // Get initial position
    getPosition();

    // Start continuous watching — low accuracy for reliability on all platforms
    watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 10000,
    });
  }, [handleSuccess, handleError, getPosition]);

  const stopWatching = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setWatching(false);
  }, []);

  const requestLocation = useCallback(() => {
    attemptCount.current = 0;
    if (watchId.current != null) {
      // Already watching — just get a fresh position
      getPosition();
    } else {
      startWatching();
    }
  }, [startWatching, getPosition]);

  useEffect(() => {
    if (!navigator.geolocation) return () => {};

    // On iOS Safari, permissions API is not available — don't auto-start
    // watching on mount because it requires a user gesture on some iOS versions.
    // Instead, wait for user to tap "My Location".
    if (isIOS) {
      // Still try — it works if permission was previously granted
      startWatching();
      return () => stopWatching();
    }

    // On non-iOS, check permissions and auto-start
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
        startWatching();
      });
    } else {
      startWatching();
    }
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  return { position, error, watching, requestLocation, startWatching, stopWatching };
}
