using System.ComponentModel.DataAnnotations;
namespace MASA.Shared.Models;
public class EduTopic
{
    public int Id { get; set; }
    public int SubjectId    { get; set; }
    public EduSubject? Subject { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public ICollection<EduContent> Contents { get; set; } = new List<EduContent>();
}
