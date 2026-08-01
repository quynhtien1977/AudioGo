using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Server.Services.Interfaces;
using System;
using System.Linq;

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
        await blob.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        });

        return blob.Uri.AbsoluteUri;
    }

    public async Task DeleteAsync(string containerName, string blobPath)
    {
        var container = _client.GetBlobContainerClient(containerName);
        await container.GetBlobClient(blobPath).DeleteIfExistsAsync();
    }

    public async Task DeleteBlobByUrlAsync(string url)
    {
        if (string.IsNullOrEmpty(url)) return;

        try
        {
            var uri = new Uri(url);
            var segments = uri.Segments.Select(s => s.Trim('/')).Where(s => !string.IsNullOrEmpty(s)).ToList();

            if (segments.Count >= 2)
            {
                string containerName;
                string blobPath;

                // Hỗ trợ Azurite emulator ở môi trường dev local
                if (segments[0].Equals("devstoreaccount1", StringComparison.OrdinalIgnoreCase))
                {
                    if (segments.Count >= 3)
                    {
                        containerName = segments[1];
                        blobPath = string.Join("/", segments.Skip(2));
                    }
                    else
                    {
                        return;
                    }
                }
                else
                {
                    containerName = segments[0];
                    blobPath = string.Join("/", segments.Skip(1));
                }

                await DeleteAsync(containerName, blobPath);
            }
        }
        catch
        {
            // Bỏ qua lỗi parsing URL không hợp lệ
        }
    }
}
