using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class CaseSubmission
{
    public int Id { get; set; }
    [Required, MaxLength(30)]  public string CaseNumber     { get; set; } = string.Empty;
    [MaxLength(20)]            public string Subdomain      { get; set; } = string.Empty;
    [MaxLength(80)]            public string CaseType       { get; set; } = string.Empty;
    [Required, MaxLength(150)] public string SubmitterName  { get; set; } = string.Empty;
    [Required, MaxLength(150)] public string SubmitterEmail { get; set; } = string.Empty;
    [MaxLength(20)]            public string SubmitterPhone { get; set; } = string.Empty;
    [MaxLength(13)]            public string? SaIdNumber    { get; set; }
    [Required]                 public string Description    { get; set; } = string.Empty;
    /// <summary>open | in_review | escalated | closed</summary>
    [MaxLength(30)] public string Status          { get; set; } = "open";
    public int    TriagedSeverity { get; set; } = 0;
    public string AiSummary       { get; set; } = string.Empty;
    public int?   AssignedAgentId { get; set; }
    public DateTime SubmittedAt   { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt     { get; set; } = DateTime.UtcNow;
    public int? CreatedUserId     { get; set; }
}
