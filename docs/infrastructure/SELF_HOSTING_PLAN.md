# RentFlow Self-Hosted Infrastructure Plan

## Decision

RentFlow will use a self-managed VPS for production infrastructure. The application and its backend services will be deployed using Docker.

## Target architecture

- RentFlow web application: Next.js
- Backend platform: official Supabase self-hosted Docker stack
- Database: PostgreSQL (Supabase-managed configuration)
- Authentication: Supabase Auth
- File storage: Supabase Storage
- Reverse proxy / TLS: configure using the supported official Supabase deployment approach and a separate application routing configuration
- Backups: encrypted database and storage backups copied to an independent backup destination
- Source control: GitHub

## Hosting baseline

Recommended initial production target:
- Ubuntu LTS
- 4 vCPU
- 8 GB RAM
- 80 GB+ SSD
- Static public IPv4
- Domain name with DNS access

The official Supabase Docker guide currently lists 4 GB RAM, 2 CPU cores and 40 GB SSD as minimums, and 8 GB+ RAM, 4+ CPU cores and 80 GB+ SSD as recommended. This plan uses the recommended baseline. Reassess capacity as tenant count, file storage, traffic and background jobs grow.

## Service separation

Keep the following logically separated:
1. Supabase self-hosted stack and its persistent data volumes.
2. RentFlow Next.js application.
3. Backup jobs and backup destination.

Do not expose PostgreSQL, Supabase Studio, Docker socket or internal service ports directly to the public internet. Only required HTTPS entry points should be publicly reachable. Restrict administrative interfaces by VPN or trusted IP where practical.

## Setup sequence

1. Select VPS provider, region and billing plan.
2. Register or configure a domain/subdomain for RentFlow.
3. Provision Ubuntu LTS and secure SSH access.
4. Install Docker Engine and Docker Compose plugin using official vendor instructions.
5. Obtain the official Supabase self-hosted Docker configuration from the upstream repository. Use its setup scripts to generate secrets; do not hand-copy old compose examples.
6. Configure public URLs, SMTP, API keys, JWT secrets and storage settings in the server-side environment file.
7. Start the Supabase stack and verify health checks.
8. Configure TLS and reverse proxy routing.
9. Deploy the RentFlow application and configure its server/browser environment variables correctly.
10. Apply database migrations and test tenant isolation, authentication and storage policies.
11. Configure encrypted off-server backups and test restoration before production use.

## Security rules

- Never commit .env files, passwords, JWT secrets, API keys, service-role keys or database credentials.
- Never put Supabase service-role or secret keys in NEXT_PUBLIC variables or browser code.
- Enable Row Level Security on every exposed application table.
- Authorise records through organisation membership, not user-editable metadata.
- Keep financial posting and balance calculations in deterministic database/application logic; AI must never authoritatively calculate tenant balances.
- Use least-privilege access, SSH keys, firewall rules, updates and monitoring.
- Backups are not considered complete until a restore test succeeds.

## Version and maintenance policy

Use the official Supabase self-hosted release configuration and read its changelog before updates. Pin and record the deployed release. Back up the database and storage before upgrades, especially when release notes flag one-way migrations or breaking changes. Use the official update procedure rather than replacing compose files blindly.

## Pending decisions

- VPS provider and region
- Domain name
- SMTP provider for account emails and receipts
- Backup destination and retention
- Whether the initial VPS will host both the application and Supabase or whether they will be split later

## Not yet provisioned

This document records the agreed architecture. No VPS, domain, DNS, production database or live service has been provisioned yet.
