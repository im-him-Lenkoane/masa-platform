# MASA Platform

**Messelaar Agency for Social Action NPC** — Full-stack multi-subdomain platform.

## Stack
- **Framework**: ASP.NET Core 8 + Razor Pages (C#)
- **Database**: PostgreSQL (self-hosted on EC2)
- **Storage**: AWS S3 (dedicated `masa-media` bucket)
- **Compute**: AWS EC2 + Nginx reverse proxy
- **DNS/CDN**: Cloudflare
- **AI**: Anthropic Claude API
- **CI/CD**: GitHub Actions

## Subdomains
| Project | Subdomain | Port |
|---|---|---|
| MASA.Main | masa.org.za | 5000 |
| MASA.Admin | admin.masa.org.za | 5001 |
| MASA.Edu | edu.masa.org.za | 5002 |
| MASA.IIS | iis.masa.org.za | 5003 |
| MASA.Health | health.masa.org.za | 5004 |
| MASA.BA | ba.masa.org.za | 5005 |
| MASA.STEM | stem.masa.org.za | 5006 |
| MASA.MINM | minm.masa.org.za | 5007 |

## Quick Start
1. Clone the repo onto your EC2 instance
2. Run `bash scripts/ec2-setup.sh` once to install dependencies
3. Run `bash scripts/db-init.sql` to create the PostgreSQL database
4. Update `appsettings.json` in each project with your real credentials
5. Run `bash scripts/deploy.sh` to build and start all services
6. Point Cloudflare DNS A records for each subdomain to your EC2 IP

## Secrets Required
Set these as GitHub Secrets for CI/CD:
- `EC2_HOST` — your EC2 public IP
- `EC2_USER` — usually `ubuntu`
- `EC2_SSH_KEY` — your private SSH key

Set these in each `appsettings.json`:
- `ConnectionStrings:DefaultConnection`
- `AWS:BucketName`, `AWS:Region`, `AWS:CdnBase`
- `Claude:ApiKey`
- `Email:*`
