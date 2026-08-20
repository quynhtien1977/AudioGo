namespace AudioGo_Mobile.Config;

public static class EndpointConfig
{
#if RELEASE
    // ── PRODUCTION ────────────────────────────────────────────────────────
    // URL API production — thay bằng domain thật sau khi deploy Render xong
    private const string ProductionBaseUrl = "https://audiogo.onrender.com/";

    public static string GetApiBaseUrl(DeviceType deviceType) => ProductionBaseUrl;
    public static string GetHubUrl(DeviceType deviceType) => $"{ProductionBaseUrl}deviceHub";

#else
    // ── DEBUG / DEVELOPMENT ───────────────────────────────────────────────
    // Chỉ cần sửa các giá trị này khi đổi môi trường dev.
    public const string LanHost = "192.168.1.15";
    public const int ApiPort = 5086;

    public static string GetApiBaseUrl(DeviceType deviceType)
        => deviceType == DeviceType.Virtual
            ? $"http://10.0.2.2:{ApiPort}/"
            : $"http://{LanHost}:{ApiPort}/";

    public static string GetHubUrl(DeviceType deviceType)
        => deviceType == DeviceType.Virtual
            ? $"http://10.0.2.2:{ApiPort}/deviceHub"
            : $"http://{LanHost}:{ApiPort}/deviceHub";
#endif
}
