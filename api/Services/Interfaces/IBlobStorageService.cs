namespace Server.Services.Interfaces;

public interface IBlobStorageService
{
    /// <summary>Upload stream lên blob, trả về public URL.</summary>
    Task<string> UploadAsync(string containerName, string blobPath, Stream content, string contentType);

    /// <summary>Xoá blob theo URL hoặc path.</summary>
    Task DeleteAsync(string containerName, string blobPath);
}
