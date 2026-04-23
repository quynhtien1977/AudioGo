using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QRCoder;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/qr")]
    [Authorize]
    public class CmsQrController : ControllerBase
    {
        [HttpGet("generate")]
        public ActionResult GenerateQrCode([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest("Vui lòng cung cấp code truy cập.");
            }

            using var qrGenerator = new QRCodeGenerator();
            // Mức Error Correction Q (25%)
            using var qrCodeData = qrGenerator.CreateQrCode(code, QRCodeGenerator.ECCLevel.Q);
            
            using var qrCode = new PngByteQRCode(qrCodeData);
            
            // Generate PNG byte array
            byte[] qrCodeImage = qrCode.GetGraphic(20);

            var base64 = Convert.ToBase64String(qrCodeImage);
            var dataUri = $"data:image/png;base64,{base64}";

            return Ok(new
            {
                Code = code,
                DataUri = dataUri
            });
        }
    }
}
