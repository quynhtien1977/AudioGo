using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý yêu cầu tư vấn từ chủ quán qua landing page.
/// Editor chỉ được xem (GET); Admin mới đổi status và xóa.
/// </summary>
[ApiController]
[Route("api/cms/consultations")]
[Authorize(Roles = "Admin,Editor")]
public class CmsConsultationController : ControllerBase
{
    private readonly IConsultationService _service;

    public CmsConsultationController(IConsultationService service) => _service = service;

    // ── GET /api/cms/consultations ────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
        => Ok(await _service.GetAllAsync(status));

    // ── PATCH /api/cms/consultations/{id}/status ──────────────────────────
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateConsultStatusRequest req)
    {
        try
        {
            await _service.UpdateStatusAsync(id, req.Status);
            return NoContent();
        }
        catch (ArgumentException ex)    { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException)    { return NotFound(); }
    }

    // ── DELETE /api/cms/consultations/{id} ────────────────────────────────
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id)
    {
        try   { await _service.DeleteAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
