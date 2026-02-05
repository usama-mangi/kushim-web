# AWS Integration Setup Guide

## Overview

The AWS integration enables Kushim to automatically verify SOC 2 compliance controls related to:
- **IAM MFA Enforcement** (CC6.1 - Logical Access Controls)
- **S3 Bucket Encryption** (CC6.7 - Data Security)
- **CloudTrail Logging** (CC7.2 - System Monitoring)

This guide will walk you through setting up AWS integration with proper IAM permissions.

---

## Prerequisites

- AWS account with administrator access (or ability to create IAM users/policies)
- Access to AWS Management Console
- Basic understanding of IAM policies and permissions

---

## Step 1: Create IAM Policy

First, create a custom IAM policy with the minimum required permissions for Kushim.

### 1.1 Navigate to IAM Console

1. Sign in to [AWS Management Console](https://console.aws.amazon.com/)
2. Go to **IAM** service (search "IAM" in the top search bar)
3. Click **Policies** in the left sidebar
4. Click **Create policy** button

### 1.2 Define Policy Permissions

Choose **JSON** tab and paste the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "KushimIAMReadOnly",
      "Effect": "Allow",
      "Action": [
        "iam:ListUsers",
        "iam:GetUser",
        "iam:ListMFADevices",
        "iam:ListAccessKeys",
        "iam:GetAccessKeyLastUsed"
      ],
      "Resource": "*"
    },
    {
      "Sid": "KushimS3ReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketEncryption",
        "s3:GetBucketVersioning",
        "s3:GetBucketLogging"
      ],
      "Resource": "*"
    },
    {
      "Sid": "KushimCloudTrailReadOnly",
      "Effect": "Allow",
      "Action": [
        "cloudtrail:LookupEvents",
        "cloudtrail:DescribeTrails",
        "cloudtrail:GetTrailStatus"
      ],
      "Resource": "*"
    },
    {
      "Sid": "KushimEvidenceStorage",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::kushim-evidence-storage-*/*"
    }
  ]
}
```

### 1.3 Name and Create Policy

1. Click **Next: Tags** (optional: add tags)
2. Click **Next: Review**
3. **Policy name**: `KushimComplianceReadOnly`
4. **Description**: `Read-only access for Kushim compliance automation platform`
5. Click **Create policy**

---

## Step 2: Create IAM User

### 2.1 Create New User

1. In IAM console, click **Users** in left sidebar
2. Click **Add users** button
3. **User name**: `kushim-integration`
4. **Access type**: Select **Programmatic access** (Access key)
5. Click **Next: Permissions**

### 2.2 Attach Policy

1. Select **Attach existing policies directly**
2. Search for `KushimComplianceReadOnly`
3. Check the box next to your policy
4. Click **Next: Tags** (optional)
5. Click **Next: Review**
6. Click **Create user**

### 2.3 Save Access Keys

⚠️ **IMPORTANT**: This is your only chance to view the secret access key!

1. Click **Download .csv** button (recommended)
2. Or manually copy:
   - **Access key ID** (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

3. Store these credentials securely (password manager recommended)
4. Click **Close**

---

## Step 3: Create S3 Bucket for Evidence Storage (Optional)

If you want Kushim to store compliance evidence in your AWS account:

### 3.1 Create Bucket

1. Navigate to **S3** service
2. Click **Create bucket**
3. **Bucket name**: `kushim-evidence-storage-[your-org-name]`
   - Example: `kushim-evidence-storage-acme-corp`
4. **Region**: Choose your preferred region (e.g., `us-east-1`)
5. **Block Public Access**: Leave all boxes checked (recommended)
6. Click **Create bucket**

### 3.2 Enable Bucket Encryption

1. Click on your newly created bucket
2. Go to **Properties** tab
3. Scroll to **Default encryption**
4. Click **Edit**
5. Enable **Server-side encryption with Amazon S3 managed keys (SSE-S3)**
6. Click **Save changes**

---

## Step 4: Configure Kushim Backend

### 4.1 Update Environment Variables

Navigate to your Kushim backend directory and edit `.env` file:

```bash
cd apps/backend
nano .env  # or use your preferred editor
```

Add/update the following variables:

```env
# AWS Integration
AWS_REGION="us-east-1"                                    # Your AWS region
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"                 # From Step 2.3
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCY..."  # From Step 2.3
AWS_S3_BUCKET_NAME="kushim-evidence-storage-acme-corp"    # From Step 3.1 (optional)
```

### 4.2 Restart Backend Service

```bash
# If running locally
npm run dev

# If running with Docker
docker-compose restart backend
```

---

## Step 5: Connect in Kushim UI

### 5.1 Navigate to Integrations

1. Log in to Kushim web interface
2. Go to **Settings** → **Integrations**
3. Find **AWS** card
4. Click **Connect**

### 5.2 Verify Connection

The UI will automatically test the connection using your configured credentials. You should see:
- ✅ **IAM Access**: Connected
- ✅ **S3 Access**: Connected
- ✅ **CloudTrail Access**: Connected

### 5.3 Run Initial Compliance Check

1. Click **Run Compliance Check** button
2. Wait for checks to complete (~30-60 seconds)
3. Review results:
   - **IAM MFA Enforcement**: Shows % of users with MFA enabled
   - **S3 Encryption Status**: Lists unencrypted buckets
   - **CloudTrail Activity**: Verifies logging is enabled

---

## Troubleshooting

### Connection Failed: Access Denied

**Symptom**: "AccessDenied" error when testing connection

**Solution**:
1. Verify IAM policy is correctly attached to user
2. Check access keys are correctly copied (no extra spaces)
3. Ensure IAM user has programmatic access enabled

```bash
# Test AWS credentials manually
aws iam list-users --profile kushim
```

### Invalid Region Error

**Symptom**: "InvalidClientTokenId" or region errors

**Solution**:
1. Verify `AWS_REGION` matches your S3 bucket region
2. Common regions: `us-east-1`, `us-west-2`, `eu-west-1`
3. Restart backend after changing region

### S3 Bucket Not Found

**Symptom**: "NoSuchBucket" error

**Solution**:
1. Ensure bucket name is globally unique
2. Verify bucket exists in the specified region
3. Check bucket name has no typos in `.env` file

### MFA Data Not Showing

**Symptom**: Compliance check shows 0% MFA enforcement but users have MFA

**Solution**:
1. IAM policy may be missing `iam:ListMFADevices` permission
2. Re-attach updated policy to IAM user
3. Wait 5 minutes for IAM permission propagation

---

## Security Best Practices

### 1. Use Read-Only Permissions

✅ **DO**: Use the minimal IAM policy provided in this guide
❌ **DON'T**: Give Kushim admin access or write permissions beyond S3 evidence bucket

### 2. Rotate Access Keys Regularly

1. Create new access key in IAM console
2. Update `.env` with new keys
3. Restart backend
4. Delete old access key after verifying new one works

### 3. Enable CloudTrail Logging

Monitor Kushim's AWS API calls:
1. Enable CloudTrail in your AWS account
2. Filter by IAM user `kushim-integration`
3. Review API calls regularly

### 4. Use AWS Secrets Manager (Production)

For production deployments, store credentials in AWS Secrets Manager:

```typescript
// apps/backend/src/config/aws.config.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secret = await secretsClient.send(
  new GetSecretValueCommand({ SecretId: 'kushim/aws-credentials' })
);
```

### 5. Restrict by IP (Optional)

Add IP-based condition to IAM policy:

```json
{
  "Condition": {
    "IpAddress": {
      "aws:SourceIp": ["203.0.113.0/24"]
    }
  }
}
```

---

## Understanding Compliance Checks

### IAM MFA Enforcement (CC6.1)

**What it checks**: Verifies all IAM users have MFA enabled

**SOC 2 Requirement**: Multi-factor authentication for user access

**Remediation**: 
1. Go to IAM Users in AWS Console
2. For each user without MFA, click user → Security credentials
3. Click "Assign MFA device"
4. Follow setup wizard (virtual or hardware MFA)

### S3 Bucket Encryption (CC6.7)

**What it checks**: Ensures all S3 buckets have default encryption enabled

**SOC 2 Requirement**: Data at rest encryption

**Remediation**:
1. Navigate to S3 bucket
2. Properties → Default encryption → Edit
3. Enable SSE-S3 or SSE-KMS
4. Save changes

### CloudTrail Logging (CC7.2)

**What it checks**: Verifies CloudTrail is recording API activity

**SOC 2 Requirement**: System activity monitoring and logging

**Remediation**:
1. Go to CloudTrail console
2. Create trail → All regions
3. Enable log file validation
4. Configure S3 bucket for logs

---

## FAQ

**Q: Can I use an existing IAM user instead of creating a new one?**
A: Yes, but we recommend a dedicated user for easier auditing and key rotation.

**Q: Does Kushim modify any AWS resources?**
A: No, Kushim only reads data for compliance checks. The only write operation is storing evidence in S3 (if configured).

**Q: How often does Kushim check AWS resources?**
A: By default, checks run daily at 2 AM UTC. You can trigger manual checks anytime.

**Q: Can I use AWS Organizations with Kushim?**
A: Yes, but you'll need to configure cross-account roles. Contact support for guidance.

**Q: What's the cost of Kushim's AWS API usage?**
A: Minimal. IAM/S3/CloudTrail read operations are mostly free tier eligible. Expect <$1/month for typical usage.

---

## Next Steps

- ✅ Set up [GitHub Integration](./github-integration.md) for code security checks
- ✅ Configure [Jira Integration](./jira-integration.md) for automatic ticket creation
- ✅ Enable [Slack Integration](./slack-integration.md) for compliance alerts
- 📖 Review [Getting Started Guide](../guides/getting-started.md)

---

## Need Help?

- 📧 Email: support@kushim.io
- 💬 Slack Community: [kushim-community.slack.com](https://kushim-community.slack.com)
- 📚 Documentation: [docs.kushim.io](https://docs.kushim.io)
- 🐛 Report Issues: [GitHub Issues](https://github.com/kushim/kushim/issues)
