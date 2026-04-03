using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
/// <summary>
/// Central S3-backed media library. Every image, icon, banner, and document
/// across all 8 MASA subdomains is stored here and referenced by PublicUrl.
/// </summary>
public class MediaAsset
{
    public int Id { get; set; }
    [Required, MaxLength(500)]  public string FileName  { get; set; } = string.Empty;
    [Required, MaxLength(1000)] public string S3Key     { get; set; } = string.Empty;
    [MaxLength(2000)]           public string PublicUrl { get; set; } = string.Empty;
    [MaxLength(100)]            public string MimeType  { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    /// <summary>global | main | edu | iis | health | ba | stem | minm | admin</summary>
    [MaxLength(20)] public string Subdomain { get; set; } = "global";
    /// <summary>logo | banner | icon | document | video | image</summary>
    [MaxLength(40)] public string Category  { get; set; } = "image";
    [MaxLength(200)] public string AltText  { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public int? UploadedByUserId { get; set; }
}
