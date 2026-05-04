using System.Text;
using System.Text.Json;
using Server.Services.Interfaces;

namespace Server.Services;

public class TranslationService : ITranslationService
{
    private readonly HttpClient _http;
    private readonly string _key;
    private readonly string _region;
    private readonly string _endpoint;

    private readonly string _cerebrasApiKey;
    private readonly string _cerebrasModel;

    public TranslationService(IConfiguration config)
    {
        _key = config["Azure:Translator:Key"] ?? "";
        _region = config["Azure:Translator:Region"] ?? "southeastasia";
        _endpoint = config["Azure:Translator:Endpoint"] ?? "https://api.cognitive.microsofttranslator.com";
        _cerebrasApiKey = config["LLM_API_KEY"] ?? "";
        _cerebrasModel = config["LLM_MODEL"] ?? "qwen-3-235b-a22b";
        _http = new HttpClient();
    }

    public async Task<string> TranslateAsync(string text, string from, string to)
    {
        var route = $"/translate?api-version=3.0&from={from}&to={to}";
        var body = JsonSerializer.Serialize(new[] { new { Text = text } });

        Console.WriteLine($"[DEBUG] Translating '{from}' -> '{to}'");
        Console.WriteLine($"[DEBUG] Endpoint: {_endpoint}");
        Console.WriteLine($"[DEBUG] Region: '{_region}'");
        Console.WriteLine($"[DEBUG] Key: '{_key.Substring(0, Math.Min(5, _key.Length))}...{_key.Substring(Math.Max(0, _key.Length - 5))}' (Length: {_key.Length})");


        using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint + route);
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");
        request.Headers.Add("Ocp-Apim-Subscription-Key", _key);
        request.Headers.Add("Ocp-Apim-Subscription-Region", _region);

        var response = await _http.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Translator API Error: {response.StatusCode} - {json}");
        }

        using var doc = JsonDocument.Parse(json);
        // Response: [{ "translations": [{ "text": "...", "to": "..." }] }]
        return doc.RootElement[0]
                  .GetProperty("translations")[0]
                  .GetProperty("text")
                  .GetString() ?? text;
    }

    public async Task<Dictionary<string, string>> TranslateToAllLanguagesAsync(string sourceText, string sourceLang = "vi")
    {
        var result = new Dictionary<string, string> { [sourceLang] = sourceText };
        var qwenKey = _cerebrasApiKey;
        if (string.IsNullOrEmpty(qwenKey))
        {
            // Fallback if no Qwen key provided yet, though we will request it
            Console.WriteLine("[DEBUG] Missing CEREBRAS_API_KEY. Fallback to Azure Translator for each language.");
            var targetLangs = new[] { "en", "ja", "ko", "zh-Hans", "fr", "th" };
            foreach (var lang in targetLangs)
            {
                result[lang] = await TranslateAsync(sourceText, sourceLang, lang);
            }
            return result;
        }

        // Prompt dạng JSON để Qwen3 trả về structured output
        var prompt = $@"
Translate the following {sourceLang} text into these languages:
English (en), Japanese (ja), Korean (ko),
Simplified Chinese (zh-Hans), French (fr), Thai (th).

Return ONLY a valid JSON object with language codes as keys.
No explanation, no markdown, just the JSON.

Text to translate:
{sourceText}

Expected format:
{{""en"": ""..."", ""ja"": ""..."", ""ko"": ""..."", ""zh-Hans"": ""..."", ""fr"": ""..."", ""th"": ""...""}}";

        var requestBody = new
        {
            model = _cerebrasModel,
            messages = new[]
            {
                new { role = "system", content = "You are a professional translator." },
                new { role = "user", content = prompt }
            },
            temperature = 0.2
        };

        var cerebrasHttp = new HttpClient();
        cerebrasHttp.DefaultRequestHeaders.Add("Authorization", $"Bearer {qwenKey}");
        
        var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        
        // Use custom Base URL if configured, otherwise fallback to cerebras
        var baseUrl = Environment.GetEnvironmentVariable("LLM_BASE_URL") 
                      ?? "https://api.cerebras.ai/v1/chat/completions";

        var response = await cerebrasHttp.PostAsync(baseUrl, jsonContent);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[DEBUG] LLM API Error ({baseUrl}): {error}. Fallback to Azure.");
            var targetLangs = new[] { "en", "ja", "ko", "zh-Hans", "fr", "th" };
            foreach (var lang in targetLangs)
            {
                result[lang] = await TranslateAsync(sourceText, sourceLang, lang);
            }
            return result;
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        try 
        {
            using var doc = JsonDocument.Parse(responseJson);
            var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            
            // Clean up Markdown backticks if Qwen added them
            if (content != null)
            {
                content = content.Trim();
                if (content.StartsWith("```json")) content = content.Substring(7);
                if (content.StartsWith("```")) content = content.Substring(3);
                if (content.EndsWith("```")) content = content.Substring(0, content.Length - 3);
                content = content.Trim();

                var parsedTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(content);
                if (parsedTranslations != null)
                {
                    foreach (var kvp in parsedTranslations)
                    {
                        result[kvp.Key] = kvp.Value;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Failed to parse Qwen JSON: {ex.Message}");
        }

        return result;
    }
}
