using Shared.DTOs;

namespace Server.Services.Interfaces;

public interface IAppReleaseService
{
    Task<List<AppReleaseDto>> GetAllAsync();
    Task<AppReleaseDto> UploadAsync(IFormFile file, string version, string? releaseNotes, string? minAndroidVersion, string? uploaderId);
    Task DeleteAsync(string id);
}
