using MASA.Shared.Data;
using MASA.Shared.Models;
using MASA.Shared.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
namespace MASA.Main.Pages;
public class JoinModel : PageModel
{
    private readonly MasaDbContext _db;
    private readonly IEmailService _email;
    public JoinModel(MasaDbContext db, IEmailService email) { _db=db; _email=email; }

    public async Task<IActionResult> OnPostAsync(string FirstName, string LastName, string Email, string? Phone)
    {
        if (_db.Members.Any(m => m.Email == Email && m.Subdomain == "main"))
        {
            TempData["Error"] = "This email is already registered as a MASA member.";
            return Page();
        }
        _db.Members.Add(new Member
        {
            FirstName=FirstName, LastName=LastName, Email=Email,
            Phone=Phone??string.Empty, Subdomain="main"
        });
        await _db.SaveChangesAsync();
        await _email.SendAsync(Email, "Welcome to MASA",
            $"<h2>Welcome, {FirstName}!</h2><p>Your MASA membership is confirmed. A membership admin will be in touch shortly with platform access details.</p>");
        TempData["Success"] = "Application received! Check your email for confirmation.";
        return RedirectToPage();
    }
}
