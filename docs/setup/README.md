# Kushim Integration & Setup Documentation

Complete guides for setting up and troubleshooting Kushim integrations.

---

## 📚 Quick Navigation

### 🚀 Getting Started
- **[Getting Started Guide](guides/getting-started.md)** - Complete onboarding guide for new users

### 🔌 Integration Setup Guides

Set up each integration with step-by-step instructions:

| Integration | Description | Setup Time | Difficulty |
|-------------|-------------|------------|------------|
| [AWS](setup/aws-integration.md) | Infrastructure compliance (IAM, S3, CloudTrail) | 10 min | ⭐⭐ Medium |
| [GitHub](setup/github-integration.md) | Code security & branch protection | 5 min | ⭐ Easy |
| [Okta](setup/okta-integration.md) | User access & MFA management | 10 min | ⭐⭐ Medium |
| [Jira](setup/jira-integration.md) | Automatic remediation tickets | 5 min | ⭐ Easy |
| [Slack](setup/slack-integration.md) | Real-time compliance alerts | 5 min | ⭐ Easy |

**Total Setup Time**: ~35 minutes for all integrations

---

## 🔧 Troubleshooting

- **[Common Issues Guide](troubleshooting/common-issues.md)** - Solutions to frequent problems
  - Integration connection failures
  - OAuth callback errors
  - Rate limiting issues
  - Evidence collection errors
  - Compliance check failures
  - Performance issues
  - Database and Docker issues

---

## 📖 What's Covered

### AWS Integration Guide
Learn how to:
- Create IAM users with proper permissions
- Generate and configure access keys
- Set up S3 evidence storage buckets
- Monitor IAM MFA, S3 encryption, and CloudTrail logging
- Troubleshoot common AWS issues

**SOC 2 Controls**: CC6.1 (Logical Access), CC6.7 (Data Security), CC7.2 (Monitoring)

### GitHub Integration Guide
Learn how to:
- Generate personal access tokens or set up OAuth apps
- Select repositories to monitor
- Configure branch protection checks
- Enable commit signing verification
- Monitor security scanning
- Troubleshoot GitHub API issues

**SOC 2 Controls**: CC8.1 (Change Management), CC6.2 (Authentication), CC7.1 (Security Monitoring)

### Okta Integration Guide
Learn how to:
- Create API tokens or configure OAuth 2.0
- Monitor MFA enrollment across users
- Verify password policy compliance
- Check session management settings
- Review user access periodically
- Troubleshoot Okta API issues

**SOC 2 Controls**: CC6.1 (Logical Access), CC6.2 (Access Review), CC6.3 (Session Controls)

### Jira Integration Guide
Learn how to:
- Generate Jira Cloud API tokens
- Set up Jira Server/Data Center access
- Configure automatic ticket creation
- Customize ticket templates and workflows
- Map custom fields
- Set up SLA enforcement
- Troubleshoot Jira integration issues

**SOC 2 Controls**: CC7.3 (Issue Remediation), CC9.2 (Risk Management)

### Slack Integration Guide
Learn how to:
- Create incoming webhooks for quick setup
- Set up OAuth apps for advanced features
- Configure alert routing and severity levels
- Customize alert messages
- Use slash commands and interactive buttons
- Troubleshoot Slack webhook issues

**SOC 2 Controls**: CC7.3 (Incident Response), CC7.2 (Monitoring)

### Getting Started Guide
Complete walkthrough covering:
- Installation (cloud, Docker, or manual)
- Creating your account
- Connecting your first integration
- Understanding the dashboard
- Running your first compliance check
- Remediating your first failure
- Generating reports for auditors

### Troubleshooting Guide
Comprehensive solutions for:
- All integration connection problems
- OAuth flow errors
- Rate limiting across all services
- Evidence collection failures
- Performance optimization
- Database connection issues
- Docker deployment problems
- Frontend/UI issues

---

## 🎯 Recommended Setup Order

For the best experience, set up integrations in this order:

1. **[GitHub](setup/github-integration.md)** (5 min)
   - Easiest to set up
   - Immediate visibility into code security
   - Quick wins for SOC 2 compliance

2. **[AWS](setup/aws-integration.md)** (10 min)
   - Critical infrastructure controls
   - MFA and encryption verification
   - Audit logging validation

3. **[Okta](setup/okta-integration.md)** (10 min)
   - User access management
   - MFA enforcement across organization
   - Password policy compliance

4. **[Jira](setup/jira-integration.md)** (5 min)
   - Enables automatic remediation tracking
   - Required for full compliance workflow
   - Creates audit trail of fixes

5. **[Slack](setup/slack-integration.md)** (5 min)
   - Real-time alerts for team
   - Daily compliance summaries
   - Integration health monitoring

---

## 📊 What Each Integration Monitors

### AWS Integration
✅ **IAM MFA Enforcement**: Percentage of users with MFA enabled
✅ **S3 Bucket Encryption**: All buckets have default encryption
✅ **CloudTrail Logging**: Audit logging enabled and configured
✅ **Evidence Storage**: Secure, immutable storage in S3

### GitHub Integration
✅ **Branch Protection**: Main/production branches are protected
✅ **Code Review Requirements**: PRs require approvals
✅ **Commit Signing**: Commits are GPG signed
✅ **Security Scanning**: Dependabot and CodeQL enabled
✅ **Secret Scanning**: No credentials in code

### Okta Integration
✅ **MFA Enrollment**: Users have active MFA factors
✅ **Password Policy**: Strong password requirements enforced
✅ **Session Management**: Timeouts and max session length
✅ **User Access Review**: Inactive accounts identified
✅ **Admin Roles**: Privileged access monitoring

### Jira Integration
✅ **Automatic Tickets**: Creates tickets for failed controls
✅ **Remediation Tracking**: Links tickets to evidence
✅ **SLA Enforcement**: Due dates based on severity
✅ **Audit Trail**: Tracks all remediation activities

### Slack Integration
✅ **Real-time Alerts**: Instant notifications for failures
✅ **Daily Summaries**: Compliance score and top issues
✅ **Integration Health**: Warns when integrations fail
✅ **Evidence Notifications**: Alerts when evidence is collected

---

## 💡 Tips for Success

### Before You Begin
- [ ] Gather admin credentials for all services
- [ ] Create a dedicated `#compliance-alerts` Slack channel
- [ ] Set up a Jira project for compliance tickets (recommended key: `COMP`)
- [ ] Allocate 30-45 minutes for initial setup
- [ ] Review [Getting Started Guide](guides/getting-started.md) first

### During Setup
- ✅ Use dedicated service accounts (not personal accounts)
- ✅ Store credentials in password manager
- ✅ Test each integration after setup
- ✅ Run initial compliance check to verify
- ✅ Configure alert settings before enabling

### After Setup
- ✅ Review and fix initial compliance failures
- ✅ Configure scheduled compliance checks (daily recommended)
- ✅ Set up team access and roles
- ✅ Customize control thresholds for your organization
- ✅ Document your compliance processes

### Best Practices
- 🔄 Rotate API tokens every 90 days
- 📊 Review compliance dashboard weekly
- 🎫 Triage Jira tickets within 24 hours
- 📈 Track compliance score trends monthly
- 👥 Conduct quarterly access reviews
- 📚 Keep documentation updated

---

## 🔐 Security Considerations

### API Token Management
- Store tokens in environment variables or secrets manager
- Never commit tokens to git repositories
- Use read-only permissions when possible
- Rotate tokens regularly (90 days recommended)
- Revoke tokens immediately when not needed

### Service Accounts
- Create dedicated service accounts for Kushim
- Use least privilege principle
- Document all service account purposes
- Review service account access quarterly

### Data Protection
- Evidence is encrypted at rest (S3 SSE)
- Evidence is encrypted in transit (TLS 1.2+)
- Evidence is immutable (cannot be modified)
- Evidence includes cryptographic hash for verification

### Audit Trail
- All actions logged with timestamp and user
- Integration API calls tracked
- Compliance check results stored permanently
- Evidence collection history preserved

---

## 📞 Support

### Documentation
- 📖 [Getting Started Guide](guides/getting-started.md)
- 🔧 [Troubleshooting Guide](troubleshooting/common-issues.md)
- 📚 [Main Documentation](https://docs.kushim.io)

### Community
- 💬 [Slack Community](https://kushim-community.slack.com)
  - #general - General discussion
  - #troubleshooting - Technical help
  - #integrations - Integration-specific questions
  - #feature-requests - Suggest improvements

### Direct Support
- 📧 **Email**: support@kushim.io
  - Response time: <24 hours
  - Include error messages and logs

- 🐛 **GitHub Issues**: [github.com/kushim/kushim/issues](https://github.com/kushim/kushim/issues)
  - For bugs and feature requests
  - Include reproduction steps

- 📞 **Enterprise Support** (paid plans):
  - Phone support available
  - Dedicated Slack channel
  - <4 hour response SLA
  - Contact: enterprise@kushim.io

---

## 🚀 Quick Links

### Setup Guides
- [AWS Integration →](setup/aws-integration.md)
- [GitHub Integration →](setup/github-integration.md)
- [Okta Integration →](setup/okta-integration.md)
- [Jira Integration →](setup/jira-integration.md)
- [Slack Integration →](setup/slack-integration.md)

### Learning Resources
- [Getting Started →](guides/getting-started.md)
- [Troubleshooting →](troubleshooting/common-issues.md)
- [SOC 2 Controls Reference →](../README.md)
- [Phase 1 MVP Details →](../PHASE_1.md)

### External Resources
- [AWS IAM Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Okta API Documentation](https://developer.okta.com/docs/reference/)
- [Jira API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Slack API Documentation](https://api.slack.com/docs)

---

## 📝 Contributing

Found an issue or have a suggestion for improving these guides?

1. **Open an issue**: [GitHub Issues](https://github.com/kushim/kushim/issues)
2. **Submit a PR**: [GitHub Pull Requests](https://github.com/kushim/kushim/pulls)
3. **Email us**: docs@kushim.io

We appreciate your feedback to make these guides better!

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Complete ✅

Happy Compliance Automation! 🎉
