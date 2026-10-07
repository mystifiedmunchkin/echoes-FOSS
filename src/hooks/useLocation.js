/**
 * Legacy foreground location watcher.
 * It is not mounted by the active application path; useRadar owns live location setup.
 */
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const MONTAUBAN_DEFAULT = {
  latitude: 44.0223,
  longitude: 1.3532,
};

export const useLocation = () => {
  const [location, setLocation] = useState({ coords: MONTAUBAN_DEFAULT });

  useEffect(() => {
    let isMounted = true;
    let subscription;

    async function startWatchingPosition() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 1,
          },
          (newLocation) => {
            if (isMounted) setLocation(newLocation);
          }
        );
      } catch (e) {
        console.warn("GPS indisponible (environnement de test) :", e);
      }
    }

    startWatchingPosition();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return location;
};