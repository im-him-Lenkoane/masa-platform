using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
namespace MASA.Shared.Services;
public interface IClaudeService
{
    Task<string> ChatAsync(string system, string userMsg, List<(string role,string content)>? history=null);
    Task<string> TriageCaseAsync(string caseType, string description);
    Task<string> TutorAsync(string subject, string topic, string knownLevel, string question);
}
public class ClaudeService : IClaudeService
{
    private readonly HttpClient _http;
    private const string MODEL = "claude-sonnet-4-5";
    private const string URL   = "https://api.anthropic.com/v1/messages";
    public ClaudeService(IHttpClientFactory f, IConfiguration cfg)
    {
        _http = f.CreateClient("claude");
        var key = cfg["Claude:ApiKey"] ?? throw new InvalidOperationException("Claude:ApiKey not set");
        _http.DefaultRequestHeaders.TryAddWithoutValidation("x-api-key", key);
        _http.DefaultRequestHeaders.TryAddWithoutValidation("anthropic-version", "2023-06-01");
    }
    public async Task<string> ChatAsync(string sys, string userMsg, List<(string role,string content)>? hist=null)
    {
        var msgs = new List<object>();
        if (hist != null) foreach (var (r,c) in hist) msgs.Add(new{role=r,content=c});
        msgs.Add(new{role="user",content=userMsg});
        var res = await _http.PostAsJsonAsync(URL, new{model=MODEL,max_tokens=1024,system=sys,messages=msgs});
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        return doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
    }
    public async Task<string> TriageCaseAsync(string type, string desc)
    {
        const string sys = "You are MASA case triage AI. Respond ONLY with JSON: {\"severity\":1-5,\"summary\":\"one sentence\",\"category\":\"category\",\"actions\":[\"action\"]}";
        return await ChatAsync(sys, $"Type:{type}\nDescription:{desc}");
    }
    public async Task<string> TutorAsync(string subject, string topic, string level, string q)
    {
        var sys = $"You are a MASA AI tutor locked to subject: {subject}, topic: {topic}. Student level: {level}. Use South African curriculum context. Redirect off-topic questions.";
        return await ChatAsync(sys, q);
    }
}
