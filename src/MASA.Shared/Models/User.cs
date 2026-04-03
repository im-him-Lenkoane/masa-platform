using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class User
{
    public int Id { get; set; }
    [Required, MaxLength(150)] public string Email        { get; set; } = string.Empty;
    [Required]                 public string PasswordHash  { get; set; } = string.Empty;
    [MaxLength(80)]            public string FirstName     { get; set; } = string.Empty;
    [MaxLength(80)]            public string LastName      { get; set; } = string.Empty;
    [MaxLength(20)]            public string Subdomain     { get; set; } = "main";
    public int     RoleId      { get; set; }
    public Role?   Role        { get; set; }
    public bool    IsActive    { get; set; } = true;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    [MaxLength(13)] public string? SaIdNumber { get; set; }
    public int? VerifiedAge { get; set; }
}
