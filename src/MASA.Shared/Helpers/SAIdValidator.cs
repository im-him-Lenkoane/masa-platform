namespace MASA.Shared.Helpers;
/// <summary>
/// Validates SA 13-digit ID via Luhn algorithm.
/// Extracts birth date and age for health.masa.org.za age-gating.
/// Local validation only — no live government API calls.
/// </summary>
public static class SAIdValidator
{
    public record Result(bool IsValid, DateTime? BirthDate, int? Age, string Error="");
    public static Result Validate(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || id.Length!=13 || !id.All(char.IsDigit))
            return new(false,null,null,"ID must be 13 digits.");
        int yy=int.Parse(id[..2]), mm=int.Parse(id.Substring(2,2)), dd=int.Parse(id.Substring(4,2));
        int yr = yy <= DateTime.Today.Year%100 ? 2000+yy : 1900+yy;
        if (!DateOnly.TryParseExact($"{yr:0000}-{mm:00}-{dd:00}","yyyy-MM-dd",out var dob))
            return new(false,null,null,"Invalid birth date in ID.");
        if (!LuhnCheck(id)) return new(false,null,null,"ID failed Luhn check.");
        var birth = dob.ToDateTime(TimeOnly.MinValue);
        int age = DateTime.Today.Year - birth.Year;
        if (DateTime.Today < birth.AddYears(age)) age--;
        return new(true, birth, age);
    }
    private static bool LuhnCheck(string id)
    {
        int sum=0;
        for(int i=0;i<12;i++){int d=id[i]-'0';if(i%2==1){d*=2;if(d>9)d-=9;}sum+=d;}
        return (10-sum%10)%10==(id[12]-'0');
    }
}
