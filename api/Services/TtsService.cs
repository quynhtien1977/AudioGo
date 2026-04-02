using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Server.Services.Interfaces;

namespace Server.Services;

public class TtsService : ITtsService
{
    private readonly SpeechConfig _speechConfig;

    private static readonly Dictionary<string, string> VoiceMap = new()
    {
        ["vi"]      = "vi-VN-HoaiMyNeural",
        ["en"]      = "en-US-JennyNeural",
        ["ja"]      = "ja-JP-NanamiNeural",
        ["ko"]      = "ko-KR-SunHiNeural",
        ["zh-Hans"] = "zh-CN-XiaoxiaoNeural",
        ["zh"]      = "zh-CN-XiaoxiaoNeural",
        ["fr"]      = "fr-FR-DeniseNeural",
        ["th"]      = "th-TH-PremwadeeNeural",
    };

    public TtsService(IConfiguration config)
    {
        var key = config["Azure:Speech:Key"]
            ?? throw new InvalidOperationException("Missing Azure:Speech:Key");
        var region = config["Azure:Speech:Region"] ?? "southeastasia";

        _speechConfig = SpeechConfig.FromSubscription(key, region);
        _speechConfig.SetSpeechSynthesisOutputFormat(SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3);
    }

    public async Task<Stream> SynthesizeAsync(string text, string languageCode)
    {
        var voice = VoiceMap.GetValueOrDefault(languageCode, "en-US-JennyNeural");
        _speechConfig.SpeechSynthesisVoiceName = voice;

        using var synthesizer = new SpeechSynthesizer(_speechConfig, null);
        var result = await synthesizer.SpeakTextAsync(text);

        if (result.Reason == ResultReason.SynthesizingAudioCompleted)
        {
            return new MemoryStream(result.AudioData);
        }

        var details = SpeechSynthesisCancellationDetails.FromResult(result);
        throw new InvalidOperationException(
            $"TTS failed: {details.Reason} — {details.ErrorDetails}");
    }
}
