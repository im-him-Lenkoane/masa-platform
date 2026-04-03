using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
namespace MASA.Shared.Services;
public interface IEmailService
{
    Task SendAsync(string to, string subject, string html);
    Task AlertAgentAsync(string agentEmail, string caseNo, string summary, string sub);
}
public class EmailService : IEmailService
{
    private readonly IConfiguration _cfg;
    public EmailService(IConfiguration cfg) => _cfg = cfg;
    public async Task SendAsync(string to, string subj, string html)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress("MASA", _cfg["Email:Username"]));
        msg.To.Add(MailboxAddress.Parse(to));
        msg.Subject = subj;
        msg.Body    = new TextPart("html"){Text=html};
        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(_cfg["Email:SmtpHost"], int.Parse(_cfg["Email:SmtpPort"]??"587"), SecureSocketOptions.StartTls);
        await smtp.AuthenticateAsync(_cfg["Email:Username"], _cfg["Email:Password"]);
        await smtp.SendAsync(msg);
        await smtp.DisconnectAsync(true);
    }
    public async Task AlertAgentAsync(string email, string caseNo, string summary, string sub)
        => await SendAsync(email,$"[MASA-{sub.ToUpper()}] Case {caseNo}",$"<h2>Case {caseNo}</h2><p>{summary}</p><p>Login to admin panel to review.</p>");
}
