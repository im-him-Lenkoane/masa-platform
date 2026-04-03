using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class Member
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public User? User  { get; set; }
    [Required, MaxLength(150)] public string Email     { get; set; } = string.Empty;
    [MaxLength(80)]            public string FirstName { get; set; } = string.Empty;
    [MaxLength(80)]            public string LastName  { get; set; } = string.Empty;
    [MaxLength(20)]            public string Phone     { get; set; } = string.Empty;
    [MaxLength(20)]            public string Subdomain { get; set; } = "main";
    public bool IsActive     { get; set; } = true;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public string Notes      { get; set; } = string.Empty;
}
