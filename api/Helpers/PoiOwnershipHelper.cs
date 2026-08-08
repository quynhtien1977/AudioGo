using Microsoft.AspNetCore.Mvc;
using Server.Repositories.Interfaces;
using System.Security.Claims;

namespace Server.Helpers
{
    /// <summary>
    /// Helper dùng chung d? ki?m tra quy?n s? h?u POI, ch?n IDOR.
    /// Quy t?c: Admin luôn du?c phép. Owner ch? du?c thao tác POI c?a mình.
    /// </summary>
    public static class PoiOwnershipHelper
    {
        /// <summary>
        /// Ki?m tra user hi?n t?i có quy?n thao tác trên POI không.
        /// Tr? v? (null, poi) n?u du?c phép; (errorResult, null) n?u b? ch?n.
        /// </summary>
        public static async Task<(IActionResult? Error, Server.Models.Poi? Poi)> CheckOwnershipAsync(
            string poiId,
            ClaimsPrincipal user,
            IPoiRepository poiRepository)
        {
            var currentRole      = user.FindFirstValue(ClaimTypes.Role);
            var currentAccountId = user.FindFirstValue(ClaimTypes.NameIdentifier);

            var poi = await poiRepository.GetByIdForCmsAsync(poiId);
            if (poi == null)
                return (new NotFoundObjectResult("POI không t?n t?i."), null);

            // Admin bypass ownership check
            if (currentRole == "Admin")
                return (null, poi);

            // Owner ch? du?c thao tác POI c?a chính mình
            if (currentRole == "Owner" && poi.AccountId == currentAccountId)
                return (null, poi);

            // M?i tru?ng h?p khác: 403 Forbidden
            return (new ForbidResult(), null);
        }
    }
}
