namespace AudioGo.Services.Interfaces
{
    public interface ILocationService
    {
        event EventHandler<(double Lat, double Lon)>? LocationUpdated;
        (double Lat, double Lon)? LastKnownLocation { get; }
        Task StartAsync();
        Task StopAsync();
        Task<(double Lat, double Lon)?> GetCurrentLocationAsync();
        bool IsRunning { get; }
    }
}
