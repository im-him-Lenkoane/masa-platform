using BCrypt.Net;
namespace MASA.Shared.Helpers;
public static class PasswordHelper
{
    public static string Hash(string pwd)                 => BCrypt.HashPassword(pwd,12);
    public static bool   Verify(string pwd, string hash) => BCrypt.Verify(pwd,hash);
}
