const EARTH_RADIUS_KM = 6371;
const radians = (degrees) => degrees * Math.PI / 180;

export function distanceKm(fromLatitude, fromLongitude, toLatitude, toLongitude) {
  const latitudeDelta = radians(toLatitude - fromLatitude);
  const longitudeDelta = radians(toLongitude - fromLongitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(fromLatitude)) * Math.cos(radians(toLatitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
