using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/upload")]
    [Authorize]
    public class MediaController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public MediaController(IWebHostEnvironment env) => _env = env;

        /// <summary>Upload file audio (mp3/wav/ogg). Trả về URL public.</summary>
        [HttpPost("audio")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
        public async Task<ActionResult<object>> UploadAudio(IFormFile file)
        {
            return await SaveFile(file, "audio",
                [".mp3", ".wav", ".ogg", ".m4a", ".aac"]);
        }

        /// <summary>Upload ảnh (jpg/png/webp). Trả về URL public.</summary>
        [HttpPost("image")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
        public async Task<ActionResult<object>> UploadImage(IFormFile file)
        {
            return await SaveFile(file, "images",
                [".jpg", ".jpeg", ".png", ".webp", ".gif"]);
        }

        private async Task<ActionResult<object>> SaveFile(
            IFormFile file, string folder, string[] allowedExtensions)
        {
            if (file is null || file.Length == 0)
                return BadRequest("File rỗng.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return BadRequest($"Định dạng không hỗ trợ. Hỗ trợ: {string.Join(", ", allowedExtensions)}");

            var uploadDir = Path.Combine(_env.WebRootPath, "uploads", folder);
            Directory.CreateDirectory(uploadDir);

            var fileName  = $"{Guid.NewGuid()}{ext}";
            var filePath  = Path.Combine(uploadDir, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await file.CopyToAsync(stream);

            var url = $"{Request.Scheme}://{Request.Host}/uploads/{folder}/{fileName}";
            return Ok(new { url, fileName, size = file.Length });
        }
    }
}
