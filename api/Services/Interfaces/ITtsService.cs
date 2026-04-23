namespace Server.Services.Interfaces;

public interface ITtsService
{
    /// <summary>Sinh audio MP3 từ text cho ngôn ngữ chỉ định.</summary>
    Task<Stream> SynthesizeAsync(string text, string languageCode);
}
