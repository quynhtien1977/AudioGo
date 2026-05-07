namespace AudioGo_Mobile.Config;

public static class EndpointConfig
{
    // Chỉ cần sửa các giá trị này khi đổi môi trường.
    public const string LanHost = "192.168.1.15";
    public const int ApiPort = 5086;
    public const string NgrokPublicBaseUrl = "https://displease-disown-blip.ngrok-free.dev/";

    public static string GetApiBaseUrl(DeviceType deviceType)
        => deviceType == DeviceType.Virtual
            ? $"http://10.0.2.2:{ApiPort}/"
            : $"http://{LanHost}:{ApiPort}/";

    public static string GetHubUrl(DeviceType deviceType)
        => deviceType == DeviceType.Virtual
            ? $"http://10.0.2.2:{ApiPort}/deviceHub"
            : $"http://{LanHost}:{ApiPort}/deviceHub";
}
