namespace MASA.Shared.Helpers;
public static class CaseHelper
{
    public static string GenerateCaseNumber(string subdomain)
        => $"{subdomain.ToUpper()}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
}
