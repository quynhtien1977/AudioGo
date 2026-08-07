using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;

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
    private readonly AppDbContext _db;

    public CmsConsultationController(AppDbContext db) => _db = db;

    // ── GET /api/cms/consultations ────────────────────────────────────────
    /// <summary>Danh sách yêu cầu tư vấn, lọc theo status (tùy chọn), sắp theo mới nhất.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _db.ConsultationRequests.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.RequestId,
                r.FullName,
                r.RestaurantName,
                r.PhoneNumber,
                r.Area,
                r.Email,
                r.Message,
                r.Status,
                r.CreatedAt,
                r.ContactedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    // ── PATCH /api/cms/consultations/{id}/status ──────────────────────────────────────────────────
    /// <summary>Cập nhật trạng thái: "Contacted" hoặc "Done" — chỉ Admin.</summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin")]  // Editor chỉ xem, không đổi status
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateConsultStatusRequest req)
    {
        var validStatuses = new[] { "New", "Contacted", "Done" };
        if (!validStatuses.Contains(req.Status))
            return BadRequest(new { message = $"Status phải là một trong: {string.Join(", ", validStatuses)}" });

        var request = await _db.ConsultationRequests.FindAsync(id);
        if (request is null) return NotFound();

        request.Status = req.Status;
        if (req.Status == "Contacted" && request.ContactedAt is null)
            request.ContactedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/cms/consultations/{id} ─────────────────────────────────────────────────
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]  // chỉ Admin mới được xóa
    public async Task<IActionResult> Delete(string id)
    {
        var request = await _db.ConsultationRequests.FindAsync(id);
        if (request is null) return NotFound();

        _db.ConsultationRequests.Remove(request);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record UpdateConsultStatusRequest(string Status);
