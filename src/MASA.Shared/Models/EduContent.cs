using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class EduContent
{
    public int Id { get; set; }
    public int TopicId    { get; set; }
    public EduTopic? Topic { get; set; }
    [Required, MaxLength(200)] public string Title    { get; set; } = string.Empty;
    /// <summary>notes | video | quiz | slides | excel | textbook | event | other</summary>
    [MaxLength(40)] public string ContentType { get; set; } = "notes";
    public int? MediaAssetId    { get; set; }
    public MediaAsset? Asset    { get; set; }
    public string ExternalUrl   { get; set; } = string.Empty;
    public bool IsDownloadable  { get; set; } = true;
    public bool IsPublished     { get; set; } = false;
    public int SortOrder        { get; set; } = 0;
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
}
