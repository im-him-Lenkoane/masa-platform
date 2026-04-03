using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class BaLesson
{
    public int Id { get; set; }
    public int CourseId        { get; set; }
    public BaCourse? Course    { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = string.Empty;
    /// <summary>video | quiz | reading | assignment</summary>
    [MaxLength(40)] public string LessonType { get; set; } = "video";
    public int? MediaAssetId   { get; set; }
    public MediaAsset? Asset   { get; set; }
    public string Content      { get; set; } = string.Empty;
    public int SortOrder       { get; set; } = 0;
    public int DurationMinutes { get; set; } = 0;
}
