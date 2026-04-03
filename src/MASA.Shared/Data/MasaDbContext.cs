using Microsoft.EntityFrameworkCore;
using MASA.Shared.Models;
namespace MASA.Shared.Data;
public class MasaDbContext : DbContext
{
    public MasaDbContext(DbContextOptions<MasaDbContext> o) : base(o) {}
    public DbSet<User>           Users           => Set<User>();
    public DbSet<Role>           Roles           => Set<Role>();
    public DbSet<Member>         Members         => Set<Member>();
    public DbSet<MediaAsset>     MediaAssets     => Set<MediaAsset>();
    public DbSet<CaseSubmission> CaseSubmissions => Set<CaseSubmission>();
    public DbSet<EduSubject>     EduSubjects     => Set<EduSubject>();
    public DbSet<EduTopic>       EduTopics       => Set<EduTopic>();
    public DbSet<EduContent>     EduContents     => Set<EduContent>();
    public DbSet<BaCourse>       BaCourses       => Set<BaCourse>();
    public DbSet<BaLesson>       BaLessons       => Set<BaLesson>();
    public DbSet<BaEnrolment>    BaEnrolments    => Set<BaEnrolment>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<Role>().HasData(
            new Role { Id=1,  Name="Super Admin",      Slug="superadmin",       Scope="*"      },
            new Role { Id=2,  Name="Site Admin",        Slug="site_admin",       Scope="*"      },
            new Role { Id=3,  Name="Edu Admin",         Slug="edu_admin",        Scope="edu"    },
            new Role { Id=4,  Name="IIS Admin",         Slug="iis_admin",        Scope="iis"    },
            new Role { Id=5,  Name="Health Admin",      Slug="health_admin",     Scope="health" },
            new Role { Id=6,  Name="BA Admin",          Slug="ba_admin",         Scope="ba"     },
            new Role { Id=7,  Name="STEM Admin",        Slug="stem_admin",       Scope="stem"   },
            new Role { Id=8,  Name="MINM Admin",        Slug="minm_admin",       Scope="minm"   },
            new Role { Id=9,  Name="Membership Admin",  Slug="membership_admin", Scope="*"      },
            new Role { Id=10, Name="Member",            Slug="member",           Scope="*"      }
        );
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>().HasIndex(u => new { u.Email, u.Subdomain });
        b.Entity<MediaAsset>().HasIndex(m => new { m.Subdomain, m.Category });
        b.Entity<CaseSubmission>().HasIndex(c => c.CaseNumber).IsUnique();
    }
}
