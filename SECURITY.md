# Security Guidelines for ProjectSol

## 🚨 **CRITICAL SECURITY NOTICE**

This repository previously contained **exposed API keys and sensitive credentials** in PowerShell scripts. If you cloned this repository before the security fixes, you may have local copies of sensitive data.

## **What Was Exposed**

The following types of credentials were found in scripts:
- GitHub Personal Access Tokens
- Vercel deployment tokens
- Supabase service role keys
- Google OAuth client secrets
- Context7 API bearer tokens
- 21st.dev API keys
- Local file paths with personal information

## **Immediate Actions Required**

### 1. **For Repository Owners**
- [ ] **Regenerate ALL API keys and tokens** mentioned above
- [ ] Review GitHub commit history for any exposed credentials
- [ ] Update production systems with new credentials
- [ ] Consider using `git filter-branch` or BFG Repo-Cleaner to remove sensitive data from Git history

### 2. **For New Contributors**
- [ ] Never commit actual API keys or tokens
- [ ] Use `.env.local` files for local development (these are gitignored)
- [ ] Use the environment variable templates provided below

## **Secure Development Setup**

### **Environment Variables Setup**

Create a `.env.local` file in your project root with your actual credentials:

```bash
# MCP Server Environment Variables
# =================================

# GitHub MCP Server
GITHUB_PERSONAL_ACCESS_TOKEN=your_actual_github_token_here

# Vercel MCP Server  
VERCEL_TOKEN=your_actual_vercel_token_here

# Supabase MCP Server
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your_actual_supabase_service_key_here

# Google MCP Servers
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here

# Context7 MCP Server
CONTEXT7_API_KEY=your_context7_bearer_token_here

# 21st.dev Magic MCP Server
MAGIC_21ST_API_KEY=your_21st_dev_api_key_here

# Local Paths (customize for your system)
MCP_ROOT_PATH=C:\Users\YourUsername\Documents\Cline\MCP
MEMORY_BANK_ROOT=C:\Users\YourUsername\Documents\Cline\MemoryBank
KNOWLEDGE_GRAPH_ROOT=C:\Users\YourUsername\Documents\Cline\KnowledgeGraph
```

### **Cline MCP Settings**

Your Cline MCP configuration should reference environment variables, not hardcode credentials. Example structure:

```json
{
  "mcpServers": {
    "github.com/github/github-mcp-server": {
      "command": "your-path-to-github-mcp-server.exe",
      "args": ["stdio"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

## **What's Protected by .gitignore**

The updated `.gitignore` now protects:

- **MCP Configurations**: `**/cline_mcp_settings.json`
- **Local Data Directories**: `**/MCP/`, `**/.aim/`, `**/MemoryBank/`
- **Environment Files**: `.env`, `.env.local`, `.env.*.local`
- **API Keys/Tokens**: Files matching `**/*token*`, `**/*key*`, `**/*secret*`
- **Personal Paths**: `**/Users/*/`, `**/AppData/`, `**/Documents/Cline/`
- **Script Backups**: `scripts/**/*.bak*`, `scripts/**/*.backup`

## **Best Practices**

### ✅ **DO:**
- Use environment variables for all credentials
- Use `.env.local` for local development secrets
- Use placeholder values in example files
- Document required environment variables
- Regularly rotate API keys and tokens
- Use least-privilege access for API tokens

### ❌ **DON'T:**
- Commit actual API keys, tokens, or passwords
- Hardcode credentials in scripts or configuration files
- Commit personal file paths or usernames
- Share `.env.local` files
- Use production credentials in development

## **How to Obtain Required Credentials**

### **GitHub Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with required scopes
3. Store in `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable

### **Vercel Token**
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token
3. Store in `VERCEL_TOKEN` environment variable

### **Supabase Credentials**
1. Go to your Supabase project dashboard
2. Settings → API → Project URL and Service Role Key
3. Store in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE`

### **Google OAuth Credentials**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID or use existing
3. Store Client ID, Secret, and Refresh Token in respective environment variables

## **Security Incident Response**

If you suspect credential exposure:

1. **Immediately rotate** all potentially exposed credentials
2. **Review access logs** for unauthorized usage
3. **Update production systems** with new credentials
4. **Document the incident** and lessons learned
5. **Consider security audit** of related systems

## **Questions?**

For security-related questions or to report security issues, please:
- Review this documentation first
- Check existing GitHub issues
- Create a new issue with [SECURITY] tag (for non-sensitive matters)
- For sensitive security reports, use private channels

---

**Last Updated**: January 2025  
**Next Review**: March 2025
