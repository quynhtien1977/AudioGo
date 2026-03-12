namespace Shared
{
    public class POI
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        /// <summary>Activation radius in metres.</summary>
        public double RadiusMeters { get; set; } = 20.0;

        /// <summary>Higher value = triggered first when multiple POIs overlap.</summary>
        public int Priority { get; set; } = 1;

        /// <summary>BCP-47 language code: vi, en, zh, ko, ja …</summary>
        public string Language { get; set; } = "vi";

        /// <summary>"tts" = Text-to-Speech | "file" = pre-recorded audio file.</summary>
        public string AudioType { get; set; } = "tts";

        /// <summary>TTS script text OR relative/remote path to audio file.</summary>
        public string AudioSource { get; set; } = string.Empty;
    }
}
