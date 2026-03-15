namespace AudioGo.Services.Interfaces
{
    public interface IAudioService
    {
        bool IsPlaying { get; }
        Task SpeakAsync(string text, string languageCode = "vi");
        Task PlayFileAsync(string urlOrPath);
        Task StopAsync();
    }
}
