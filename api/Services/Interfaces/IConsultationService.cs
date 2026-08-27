using Shared.DTOs;

namespace Server.Services.Interfaces;

public interface IConsultationService
{
    Task<List<ConsultationDto>> GetAllAsync(string? status);
    Task UpdateStatusAsync(string id, string status);
    Task DeleteAsync(string id);
}
