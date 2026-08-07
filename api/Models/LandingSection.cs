namespace Server.Models;

/// <summary>
/// Lưu nội dung từng section của landing page công khai.
/// ContentJson chứa schema JSON tùy theo SectionKey.
///
/// Các SectionKey được hỗ trợ và schema JSON tương ứng:
/// - "hero"         : { badge, heading1, heading2, description, cta1Text, cta1Link, cta2Text, cta2Link, backgroundImageUrl, stats:[{icon,value,label}] }
/// - "stats_bar"    : { items:[{icon,text}] }
/// - "features"     : { title, subtitle, items:[{icon,title,description}] }
/// - "how_it_works" : { title, steps:[{number,title,description}] }
/// - "screenshots"  : { title, images:[{url,alt}] }
/// - "consult_cta"  : { title, subtitle, formNote }
/// - "download_cta" : { title, subtitle, installGuide, googlePlayText }
/// - "footer"       : { description, address, email, phone, zaloLink, socialLinks:[{platform,url}] }
/// </summary>
public class LandingSection
{
    public string SectionId  { get; set; } = Guid.NewGuid().ToString();
    public string SectionKey { get; set; } = null!;   // "hero" | "stats_bar" | ...
    public int    SortOrder  { get; set; }
    public bool   IsActive   { get; set; } = true;

    /// <summary>JSON blob linh hoạt theo từng SectionKey — nvarchar(max)</summary>
    public string ContentJson { get; set; } = "{}";

    public DateTime  CreatedAt          { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt          { get; set; }
    public string?   UpdatedByAccountId { get; set; }
}
