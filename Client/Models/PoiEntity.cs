using SQLite;

namespace AudioGo.Models
{
    /// <summary>
    /// Local SQLite entity mirroring <see cref="Shared.POI"/>.
    /// Stored in the on-device database for offline mode.
    /// </summary>
    [Table("Pois")]
    public class PoiEntity
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        [MaxLength(200), NotNull]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        /// <summary>Activation radius in metres.</summary>
        public double RadiusMeters { get; set; } = 20.0;

        /// <summary>Higher = triggered first when POIs overlap.</summary>
        public int Priority { get; set; } = 1;

        /// <summary>BCP-47 language code: vi, en, zh, ko, ja …</summary>
        [MaxLength(10)]
        public string Language { get; set; } = "vi";

        /// <summary>"tts" or "file".</summary>
        [MaxLength(10)]
        public string AudioType { get; set; } = "tts";

        /// <summary>TTS script text OR path/URL to audio file.</summary>
        public string AudioSource { get; set; } = string.Empty;

        /// <summary>Timestamp of last server sync.</summary>
        public DateTime? LastSyncedAt { get; set; }
    }
}
