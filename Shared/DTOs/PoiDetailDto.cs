namespace Shared.DTOs
{
    public record PoiDetailDto(
        string PoiId,
        double Latitude,
        double Longitude,
        int ActivationRadius,
        int Priority,
        bool IsActive,
        string LogoUrl,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        IReadOnlyList<PoiContentDto> Contents,
        IReadOnlyList<PoiGalleryDto> Gallery
    );

    public record PoiContentDto(
        string ContentId,
        string PoiId,
        string LanguageCode,
        string Title,
        string Description,
        string AudioUrl,
        bool IsMaster
    );

    
    public record PoiCreateRequest(
        double Latitude,
        double Longitude,
        int ActivationRadius,
        int Priority,
        string? LogoUrl
    );

    public record PoiUpdateRequest(
        double? Latitude,
        double? Longitude,
        int? ActivationRadius,
        int? Priority,
        string? LogoUrl
    );

    public record PoiGalleryDto(
        string ImageId,
        string PoiId,
        string ImageUrl,
        int SortOrder
    );

    public record PoiContentCreateRequest(
        string LanguageCode,
        string Title,
        string Description,
        string AudioUrl,
        bool IsMaster
    );

    public record PoiContentUpdateRequest(
        string? Title,
        string? Description,
        string? AudioUrl,
        bool? IsMaster
    );
}
