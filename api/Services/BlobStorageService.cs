using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _client;

    public BlobStorageService(IConfiguration config)
    {
        var connectionString = config["Azure:BlobStorage:ConnectionString"]
            ?? throw new InvalidOperationException("Missing Azure:BlobStorage:ConnectionString");
        _client = new BlobServiceClient(connectionString);
    }

    public async Task<string> UploadAsync(string containerName, string blobPath, Stream content, string contentType)
    {
        var container = _client.GetBlobContainerClient(containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob);

        var blob = container.GetBlobClient(blobPath);
        await blob.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType });

        return blob.Uri.AbsoluteUri;
    }

    public async Task DeleteAsync(string containerName, string blobPath)
    {
        var container = _client.GetBlobContainerClient(containerName);
        await container.GetBlobClient(blobPath).DeleteIfExistsAsync();
    }
}
