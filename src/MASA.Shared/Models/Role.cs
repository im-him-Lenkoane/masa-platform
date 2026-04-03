using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class Role
{
    public int Id { get; set; }
    [Required, MaxLength(60)] public string Name  { get; set; } = string.Empty;
    [MaxLength(40)]           public string Slug  { get; set; } = string.Empty;
    /// <summary>"*" = all subdomains, or specific subdomain slug</summary>
    [MaxLength(20)]           public string Scope { get; set; } = "*";
    public ICollection<User> Users { get; set; } = new List<User>();
}
