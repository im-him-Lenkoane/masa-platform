using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using MASA.Shared.Data;
using MASA.Shared.Models;
namespace MASA.Shared.Services;
public interface IMediaService
{
    Task<string> UploadAsync(Stream s, string fileName, string subdomain, string category, string mime);
    Task<bool>   DeleteAsync(string s3Key);
    string       GetPublicUrl(string key);
}
public class MediaService : IMediaService
{
    private readonly IAmazonS3 _s3;
    private readonly MasaDbContext _db;
    private readonly string _bucket, _cdn;
    public MediaService(IAmazonS3 s3, IConfiguration cfg, MasaDbContext db)
    {
        _s3 = s3; _db = db;
        _bucket = cfg["AWS:BucketName"] ?? "masa-media";
        _cdn    = cfg["AWS:CdnBase"]    ?? "https://masa-media.s3.amazonaws.com";
    }
    public async Task<string> UploadAsync(Stream s, string fn, string sub, string cat, string mime)
    {
        var key = $"masa/{sub}/{cat}/{Guid.NewGuid()}{Path.GetExtension(fn)}";
        await _s3.PutObjectAsync(new PutObjectRequest
            { BucketName=_bucket, Key=key, InputStream=s, ContentType=mime, CannedACL=S3CannedACL.PublicRead });
        _db.MediaAssets.Add(new MediaAsset
            { FileName=fn, S3Key=key, PublicUrl=GetPublicUrl(key), MimeType=mime, Subdomain=sub, Category=cat });
        await _db.SaveChangesAsync();
        return key;
    }
    public async Task<bool> DeleteAsync(string key)
    {
        await _s3.DeleteObjectAsync(_bucket, key);
        var a = _db.MediaAssets.FirstOrDefault(m => m.S3Key == key);
        if (a != null) { _db.MediaAssets.Remove(a); await _db.SaveChangesAsync(); }
        return true;
    }
    public string GetPublicUrl(string key) => $"{_cdn}/{key}";
}
