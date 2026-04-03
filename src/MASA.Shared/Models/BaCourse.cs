using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class BaCourse
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string Title       { get; set; } = string.Empty;
    [MaxLength(80)]            public string Category    { get; set; } = string.Empty;
    public string Description  { get; set; } = string.Empty;
    public int? BannerAssetId  { get; set; }
    public MediaAsset? Banner  { get; set; }
    public bool IsPublished    { get; set; } = false;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public ICollection<BaLesson>      Lessons      { get; set; } = new List<BaLesson>();
    public ICollection<BaEnrolment>   Enrolments   { get; set; } = new List<BaEnrolment>();
}
