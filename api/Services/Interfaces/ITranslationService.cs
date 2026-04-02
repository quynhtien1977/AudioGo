namespace Server.Services.Interfaces;

public interface ITranslationService
{
    /// <summary>Dịch text từ ngôn ngữ nguồn sang ngôn ngữ đích.</summary>
    Task<string> TranslateAsync(string text, string from, string to);
}
