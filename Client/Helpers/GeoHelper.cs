namespace AudioGo.Helpers
{
    public static class GeoHelper
    {
        private const double EarthRadiusMeters = 6_371_000;

        /// <summary>Returns the great-circle distance between two GPS coordinates in metres.</summary>
        public static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = ToRad(lat2 - lat1);
            var dLon = ToRad(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                  + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
                  * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return EarthRadiusMeters * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }

        private static double ToRad(double degrees) => degrees * Math.PI / 180.0;
    }
}
