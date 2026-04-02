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

    public TranslationService(IConfiguration config)
    {
        _key = config["Azure:Translator:Key"]
            ?? throw new InvalidOperationException("Missing Azure:Translator:Key");
        _region = config["Azure:Translator:Region"] ?? "southeastasia";
        _endpoint = config["Azure:Translator:Endpoint"]
            ?? "https://api.cognitive.microsofttranslator.com";
        _http = new HttpClient();
    }

    public async Task<string> TranslateAsync(string text, string from, string to)
    {
        var route = $"/translate?api-version=3.0&from={from}&to={to}";
        var body = JsonSerializer.Serialize(new[] { new { Text = text } });

        using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint + route);
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");
        request.Headers.Add("Ocp-Apim-Subscription-Key", _key);
        request.Headers.Add("Ocp-Apim-Subscription-Region", _region);

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        // Response: [{ "translations": [{ "text": "...", "to": "..." }] }]
        return doc.RootElement[0]
                  .GetProperty("translations")[0]
                  .GetProperty("text")
                  .GetString() ?? text;
    }
}
