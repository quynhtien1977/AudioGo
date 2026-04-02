using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/upload")]
    [Authorize]
    public class MediaController : ControllerBase
    {
        private readonly IBlobStorageService _blob;
        private readonly IConfiguration _config;

        public MediaController(IBlobStorageService blob, IConfiguration config)
        {
            _blob = blob;
            _config = config;
        }

        /// <summary>Upload file audio (mp3/wav/ogg). Trả về URL public.</summary>
        [HttpPost("audio")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
        public async Task<ActionResult<object>> UploadAudio(IFormFile file)
        {
            var container = _config["Azure:BlobStorage:AudioContainer"] ?? "audio";
            return await SaveFile(file, container,
                [".mp3", ".wav", ".ogg", ".m4a", ".aac"]);
        }

        /// <summary>Upload ảnh (jpg/png/webp). Trả về URL public.</summary>
        [HttpPost("image")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
        public async Task<ActionResult<object>> UploadImage(IFormFile file)
        {
            var container = _config["Azure:BlobStorage:ImageContainer"] ?? "images";
            return await SaveFile(file, container,
                [".jpg", ".jpeg", ".png", ".webp", ".gif"]);
        }

        private async Task<ActionResult<object>> SaveFile(
            IFormFile file, string container, string[] allowedExtensions)
        {
            if (file is null || file.Length == 0)
                return BadRequest("File rỗng.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return BadRequest($"Định dạng không hỗ trợ. Hỗ trợ: {string.Join(", ", allowedExtensions)}");

            var blobPath = $"{Guid.NewGuid()}{ext}";

            await using var stream = file.OpenReadStream();
            var url = await _blob.UploadAsync(container, blobPath, stream, file.ContentType);

            return Ok(new { url, fileName = blobPath, size = file.Length });
        }
    }
}
