export type LocationPermission = 'granted' | 'denied' | 'unsupported';

/**
 * Asks the browser for location access, which shows its permission prompt the first time.
 * Only the permission matters here, so a timeout or missing position still counts as granted.
 */
export function requestLocationPermission(): Promise<LocationPermission> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve('unsupported');
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (error) => resolve(error.code === error.PERMISSION_DENIED ? 'denied' : 'granted'),
      { maximumAge: 600000, timeout: 15000 },
    );
  });
}
