namespace AudioGo.Services.Interfaces
{
    /// <summary>
    /// Quản lý kết nối SignalR tới DeviceHub.
    /// Inject vào MainViewModel để start sau QR login thành công.
    /// </summary>
    public interface ISignalRService
    {
        /// <summary>Kết nối tới Hub với JWT từ SecureStorage.</summary>
        Task StartAsync(CancellationToken ct = default);

        /// <summary>Gửi vị trí GPS hiện tại lên server qua Hub.</summary>
        Task SendLocationAsync(double latitude, double longitude);

        /// <summary>Ngắt kết nối và giải phóng tài nguyên.</summary>
        Task StopAsync();

        bool IsConnected { get; }
    }
}
