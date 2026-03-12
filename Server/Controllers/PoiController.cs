using Microsoft.AspNetCore.Mvc;
using Shared;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PoiController : ControllerBase
    {
        // TODO: inject IPoiRepository or DbContext when database is wired up
        private static readonly List<POI> _mockPois = new()
        {
            new POI { Id = 1, Name = "Bún bò Huế Cô Hai", Description = "Quán bún bò nổi tiếng đầu phố", Latitude = 10.7278, Longitude = 106.7009, RadiusMeters = 20, Priority = 1, Language = "vi", AudioType = "tts", AudioSource = "Chào mừng bạn đến với quán Bún bò Huế Cô Hai." },
            new POI { Id = 2, Name = "Hủ tiếu Nam Vang", Description = "Hủ tiếu truyền thống", Latitude = 10.7281, Longitude = 106.7015, RadiusMeters = 20, Priority = 1, Language = "vi", AudioType = "tts", AudioSource = "Đây là quán Hủ tiếu Nam Vang nổi tiếng." },
        };

        [HttpGet]
        public ActionResult<IEnumerable<POI>> GetAll() => Ok(_mockPois);

        [HttpGet("{id:int}")]
        public ActionResult<POI> GetById(int id)
        {
            var poi = _mockPois.FirstOrDefault(p => p.Id == id);
            return poi is null ? NotFound() : Ok(poi);
        }

        [HttpPost]
        public ActionResult<POI> Create([FromBody] POI poi)
        {
            poi.Id = _mockPois.Count > 0 ? _mockPois.Max(p => p.Id) + 1 : 1;
            _mockPois.Add(poi);
            return CreatedAtAction(nameof(GetById), new { id = poi.Id }, poi);
        }

        [HttpPut("{id:int}")]
        public IActionResult Update(int id, [FromBody] POI poi)
        {
            var index = _mockPois.FindIndex(p => p.Id == id);
            if (index < 0) return NotFound();
            poi.Id = id;
            _mockPois[index] = poi;
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            var poi = _mockPois.FirstOrDefault(p => p.Id == id);
            if (poi is null) return NotFound();
            _mockPois.Remove(poi);
            return NoContent();
        }
    }
}
