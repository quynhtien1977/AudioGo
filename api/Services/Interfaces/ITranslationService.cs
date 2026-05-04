namespace Server.Services.Interfaces;

public interface ITranslationService
{
    /// <summary>Dịch text từ ngôn ngữ nguồn sang ngôn ngữ đích.</summary>
    Task<string> TranslateAsync(string text, string from, string to);

    /// <summary>Dịch text sang toàn bộ ngôn ngữ hỗ trợ của ứng dụng.</summary>
    Task<Dictionary<string, string>> TranslateToAllLanguagesAsync(string sourceText, string sourceLang = "vi");
}
