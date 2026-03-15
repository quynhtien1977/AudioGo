namespace Shared.DTOs
{
    public record TopPoiDto(
        string PoiId,
        string Title,
        int ListenCount
    );

    public record HeatmapPointDto(
        double Latitude,
        double Longitude,
        int Count
    );

    public record CategoryDto(
        string CategoryId,
        string Name,
        DateTime CreatedAt
    );

    public record CategoryCreateRequest(string Name);

    public record TourDto(
        string TourId,
        string Name,
        string Description,
        DateTime CreatedAt,
        IReadOnlyList<TourPoiDto> Pois
    );

    public record TourPoiDto(
        string PoiId,
        string Title,
        int StepOrder
    );

    public record TourCreateRequest(string Name, string Description);

    public record TourUpdateRequest(string? Name, string? Description);
}
