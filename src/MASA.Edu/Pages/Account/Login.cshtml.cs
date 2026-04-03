using MASA.Shared.Data;
using MASA.Shared.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
namespace MASA.Edu.Pages.Account;
public class LoginModel : PageModel
{
    private readonly MasaDbContext _db;
    public LoginModel(MasaDbContext db) => _db = db;
    public void OnGet() {}
    public IActionResult OnPost(string Email, string Password)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email==Email && u.Subdomain=="edu" && u.IsActive);
        if (user==null || !PasswordHelper.Verify(Password, user.PasswordHash))
        { TempData["Error"]="Invalid credentials."; return Page(); }
        HttpContext.Session.SetInt32("UserId", user.Id);
        HttpContext.Session.SetString("UserEmail", user.Email);
        HttpContext.Session.SetInt32("RoleId", user.RoleId);
        return RedirectToPage("/Index");
    }
}
