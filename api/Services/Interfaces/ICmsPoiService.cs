using Server.Models;
using Shared.DTOs;

namespace Server.Services.Interfaces
{
    public interface ICmsPoiService
    {
        Task<List<PoiListDto>> GetAllForCmsAsync(bool? isActive = null);
        Task<object?> GetPoiDetailForCmsAsync(string poiId);
    }
}
