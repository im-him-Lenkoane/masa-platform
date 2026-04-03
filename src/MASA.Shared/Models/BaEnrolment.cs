namespace MASA.Shared.Models;
public class BaEnrolment
{
    public int Id { get; set; }
    public int CourseId    { get; set; }
    public BaCourse? Course { get; set; }
    public int UserId      { get; set; }
    public User? User      { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int ProgressPercent { get; set; } = 0;
    public bool CertificateIssued { get; set; } = false;
}
