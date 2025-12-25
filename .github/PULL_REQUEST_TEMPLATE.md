# Pull Request

## 📋 Description
<!-- Briefly describe what this PR does -->


## 🔄 Type of Change
<!-- Check all that apply -->
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🗃️ Database migration
- [ ] 🔐 Security-related change

## 🔐 Security Checklist
<!-- REQUIRED: All boxes must be checked before merge -->

### Secrets & Keys
- [ ] ✅ **No hardcoded secrets**: I have not added any API keys, tokens, passwords, or JWTs directly in the code
- [ ] ✅ **No secrets in logs**: I have not added any `console.log()` statements that could expose sensitive data
- [ ] ✅ **No secrets in comments**: Documentation and comments do not contain real credentials
- [ ] ✅ **Environment variables**: Any new secrets are documented and use Supabase Vault or Cloud secrets

### Database & RLS
- [ ] ✅ **RLS policies reviewed**: Any new tables have appropriate Row Level Security policies
- [ ] ✅ **No overly permissive policies**: RLS policies are not using `true` as the only condition
- [ ] ✅ **Sensitive data protected**: PII and payment data have proper access controls

### Edge Functions
- [ ] ✅ **Input validation**: All user inputs are validated and sanitized
- [ ] ✅ **CORS configured**: CORS is properly restricted (not using `*` in production)
- [ ] ✅ **Authentication verified**: Protected endpoints verify JWT tokens
- [ ] ✅ **Error handling**: Errors don't leak sensitive information

### General
- [ ] ✅ **No new dependencies with vulnerabilities**: `npm audit` passes
- [ ] ✅ **Gitleaks passes locally**: Ran `gitleaks detect --source . -v` with no findings

## 🧪 Testing
<!-- Describe how you tested these changes -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📸 Screenshots
<!-- If applicable, add screenshots to help explain your changes -->


## 🔗 Related Issues
<!-- Link any related issues: Fixes #123, Relates to #456 -->


## ⚠️ Deployment Notes
<!-- Any special instructions for deployment? Database migrations? -->


---

### 🚨 For Reviewers

**Security-Critical Paths Modified:**
<!-- Automatically added by GitHub based on CODEOWNERS -->

**Before Approving, Verify:**
1. [ ] No secrets or sensitive data exposed
2. [ ] RLS policies are appropriate for the use case
3. [ ] Input validation is sufficient
4. [ ] Error messages don't leak sensitive info
