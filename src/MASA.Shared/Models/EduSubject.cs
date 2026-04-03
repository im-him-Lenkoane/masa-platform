using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class EduSubject
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string Name       { get; set; } = string.Empty;
    [MaxLength(20)]            public string Level      { get; set; } = "school"; // school | tertiary
    [MaxLength(30)]            public string Grade      { get; set; } = string.Empty; // "10","11","12" or faculty name
    [MaxLength(20)]            public string Subdomain  { get; set; } = "edu";    // edu | minm | stem
    public int? BannerAssetId  { get; set; }
    public MediaAsset? Banner  { get; set; }
    public bool IsPublished    { get; set; } = false;
    public ICollection<EduTopic> Topics { get; set; } = new List<EduTopic>();
}
