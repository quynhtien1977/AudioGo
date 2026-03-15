namespace AudioGo.Services.Interfaces
{
    public interface ILocationService
    {
        event EventHandler<(double Lat, double Lon)>? LocationUpdated;
        Task StartAsync();
        Task StopAsync();
        bool IsRunning { get; }
    }
}
