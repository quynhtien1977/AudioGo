using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services;

/// <summary>
/// Quản lý yêu cầu tư vấn từ owner qua landing page.
/// Bao gồm lọc theo status, cập nhật trạng thái và xóa.
/// </summary>
public class ConsultationService : IConsultationService
{
    private static readonly string[] ValidStatuses = ["New", "Contacted", "Done", "Rejected"];
    private readonly AppDbContext _db;

    public ConsultationService(AppDbContext db) => _db = db;

    public async Task<List<ConsultationDto>> GetAllAsync(string? status)
    {
        var query = _db.ConsultationRequests.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ConsultationDto(
                r.RequestId,
                r.FullName,
                r.RestaurantName,
                r.PhoneNumber,
                r.Area,
                r.Email,
                r.Message,
                r.Status,
                r.CreatedAt,
                r.ContactedAt,
                r.RejectedAt))
            .ToListAsync();
    }

    public async Task UpdateStatusAsync(string id, string status)
    {
        if (!ValidStatuses.Contains(status))
            throw new ArgumentException(
                $"Status phải là một trong: {string.Join(", ", ValidStatuses)}");

        var request = await _db.ConsultationRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy consultation: {id}");

        request.Status = status;
        if (status == "Contacted" && request.ContactedAt is null)
            request.ContactedAt = DateTime.UtcNow;
        if (status == "Rejected" && request.RejectedAt is null)
            request.RejectedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(string id)
    {
        var request = await _db.ConsultationRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy consultation: {id}");

        _db.ConsultationRequests.Remove(request);
        await _db.SaveChangesAsync();
    }
}
