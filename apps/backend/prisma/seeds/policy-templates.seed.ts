import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Framework enum for type safety
enum Framework {
  SOC2 = 'SOC2',
  ISO27001 = 'ISO27001',
  HIPAA = 'HIPAA',
  PCIDSS = 'PCIDSS'
}

const policyTemplates = [
  {
    name: 'Information Security Policy',
    category: 'Security',
    description: 'Comprehensive information security policy covering organizational security posture, roles, and responsibilities.',
    templateContent: `# Information Security Policy

## 1. Purpose and Scope

This Information Security Policy establishes {{companyName}}'s commitment to protecting information assets and ensuring the confidentiality, integrity, and availability of data.

**Scope:** This policy applies to all employees, contractors, and third parties accessing {{companyName}} systems and data.

## 2. Information Security Objectives

{{companyName}} is committed to:
- Protecting customer and company data from unauthorized access
- Maintaining confidentiality, integrity, and availability of information
- Complying with applicable laws and regulations
- Continuous improvement of security controls

## 3. Roles and Responsibilities

### 3.1 Chief Information Security Officer (CISO)
- Overall responsibility for information security program
- Reporting to executive leadership on security posture
- Managing security incidents and response

### 3.2 Security Team
- Implementing and maintaining security controls
- Monitoring security events and incidents
- Conducting security assessments and audits

### 3.3 All Employees
- Following security policies and procedures
- Reporting security incidents immediately
- Completing required security training

## 4. Security Controls

### 4.1 Access Control
- Role-based access control (RBAC) implementation
- Principle of least privilege
- Regular access reviews

### 4.2 Data Protection
- Encryption for data at rest and in transit
- Data classification and handling procedures
- Secure data disposal

### 4.3 Network Security
- Firewall and intrusion detection systems
- Network segmentation
- Secure remote access via VPN

### 4.4 Monitoring and Logging
- Centralized logging of security events
- 24/7 security monitoring
- Regular log review and analysis

## 5. Compliance and Enforcement

Violations of this policy may result in disciplinary action up to and including termination of employment or contract.

## 6. Policy Review

This policy will be reviewed annually and updated as necessary.

**Effective Date:** {{effectiveDate}}
**Version:** {{version}}
**Owner:** {{owner}}`,
    variables: ['companyName', 'effectiveDate', 'version', 'owner', 'industry'],
    framework: Framework.SOC2,
    controls: ['CC1.1', 'CC1.2', 'CC1.3', 'CC2.1', 'CC3.1'],
  },
  {
    name: 'Access Control Policy',
    category: 'Security',
    description: 'Policy governing user access management, authentication, and authorization.',
    templateContent: `# Access Control Policy

## 1. Purpose

This policy defines {{companyName}}'s standards for managing access to information systems and data.

## 2. User Access Management

### 2.1 User Provisioning
- New access requests approved by manager and security team
- Access granted based on job role and responsibilities
- Principle of least privilege enforced

### 2.2 Access Reviews
- Quarterly review of all user access
- Immediate revocation upon role change or termination
- Dormant account deactivation after {{dormantDays}} days

### 2.3 Privileged Access
- Limited number of privileged accounts
- Multi-factor authentication required
- All privileged activities logged and monitored

## 3. Authentication Requirements

### 3.1 Password Requirements
- Minimum {{passwordLength}} characters
- Complexity requirements enforced
- Password rotation every {{passwordRotationDays}} days
- No password reuse for last {{passwordHistory}} passwords

### 3.2 Multi-Factor Authentication (MFA)
- Required for all production system access
- Required for remote access
- Required for privileged accounts

### 3.3 Single Sign-On (SSO)
- {{ssoProvider}} used for centralized authentication
- Integration with identity provider
- Automatic session timeout after {{sessionTimeout}} minutes

## 4. Remote Access

- VPN required for remote access to internal systems
- MFA required for VPN connections
- Remote access logs reviewed regularly

## 5. Third-Party Access

- Limited to specific business needs
- Time-limited access grants
- Separate credentials from employee accounts
- Regular review and audit

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'dormantDays', 'passwordLength', 'passwordRotationDays', 'passwordHistory', 'ssoProvider', 'sessionTimeout', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC6.1', 'CC6.2', 'CC6.3', 'CC6.6'],
  },
  {
    name: 'Change Management Policy',
    category: 'Operations',
    description: 'Policy for managing changes to systems, applications, and infrastructure.',
    templateContent: `# Change Management Policy

## 1. Purpose

This policy ensures all changes to {{companyName}}'s IT infrastructure and applications are properly authorized, tested, and documented.

## 2. Scope

Applies to all changes affecting:
- Production systems and applications
- Network infrastructure
- Security controls
- Data systems

## 3. Change Classification

### 3.1 Standard Changes
- Pre-approved, low-risk changes
- Examples: {{standardChangeExamples}}
- Documented procedures followed

### 3.2 Normal Changes
- Require change approval board (CAB) review
- Impact assessment required
- Rollback plan mandatory

### 3.3 Emergency Changes
- Critical security or operational issues
- Post-implementation review required
- Expedited approval process

## 4. Change Process

### 4.1 Request and Planning
- Change request submitted via {{changeManagementTool}}
- Business justification documented
- Impact and risk assessment completed

### 4.2 Approval
- Manager approval required
- CAB review for normal changes
- Security team review for security-related changes

### 4.3 Testing
- Changes tested in {{testEnvironment}} environment
- Test results documented
- User acceptance testing (UAT) for major changes

### 4.4 Implementation
- Changes deployed during approved maintenance windows
- Implementation steps documented
- Rollback plan prepared and tested

### 4.5 Post-Implementation Review
- Verification of successful implementation
- Documentation updated
- Lessons learned captured

## 5. Emergency Changes

- Security team authorization for security emergencies
- Post-implementation CAB review within {{emergencyReviewDays}} business days
- Root cause analysis performed

## 6. Documentation

All changes documented including:
- Change request details
- Approval records
- Test results
- Implementation logs
- Rollback procedures

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'standardChangeExamples', 'changeManagementTool', 'testEnvironment', 'emergencyReviewDays', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC8.1', 'CC7.1', 'CC7.2'],
  },
  {
    name: 'Incident Response Policy',
    category: 'Security',
    description: 'Policy for detecting, responding to, and recovering from security incidents.',
    templateContent: `# Incident Response Policy

## 1. Purpose

This policy establishes {{companyName}}'s approach to managing security incidents to minimize impact and ensure rapid recovery.

## 2. Incident Classification

### 2.1 Severity Levels

**Critical (P0):**
- Data breach affecting customer data
- Complete service outage
- Active exploitation of vulnerabilities

**High (P1):**
- Partial service disruption
- Malware infection
- Unauthorized access attempt

**Medium (P2):**
- Policy violations
- Minor security vulnerabilities
- Performance degradation

**Low (P3):**
- General security questions
- Minor policy violations

## 3. Incident Response Team

### 3.1 Core Team
- Incident Commander: {{incidentCommander}}
- Security Lead: {{securityLead}}
- Technical Lead: {{technicalLead}}
- Communications Lead: {{communicationsLead}}

### 3.2 Responsibilities
- Incident detection and analysis
- Containment and eradication
- Recovery and restoration
- Post-incident review

## 4. Incident Response Process

### 4.1 Detection and Reporting
- 24/7 security monitoring
- All incidents reported via {{incidentReportingChannel}}
- Initial triage within {{triageTime}} minutes for P0/P1

### 4.2 Containment
- Isolate affected systems immediately
- Preserve evidence for investigation
- Prevent spread of incident

### 4.3 Eradication
- Identify and remove root cause
- Patch vulnerabilities
- Remove malware/unauthorized access

### 4.4 Recovery
- Restore systems from clean backups
- Verify system integrity
- Gradual restoration to production

### 4.5 Post-Incident Review
- Root cause analysis within {{postIncidentReviewDays}} days
- Lessons learned documented
- Process improvements implemented

## 5. Communication

### 5.1 Internal
- Incident team updates every {{updateFrequency}}
- Executive briefing for P0/P1 incidents
- Status page updates for service impacts

### 5.2 External
- Customer notification within {{customerNotificationHours}} hours for data breaches
- Regulatory reporting as required
- Public communications approved by legal/PR

## 6. Evidence Preservation

- System logs preserved
- Forensic images captured
- Chain of custody maintained

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'incidentCommander', 'securityLead', 'technicalLead', 'communicationsLead', 'incidentReportingChannel', 'triageTime', 'postIncidentReviewDays', 'updateFrequency', 'customerNotificationHours', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC7.3', 'CC7.4', 'CC7.5'],
  },
  {
    name: 'Business Continuity Plan',
    category: 'Operations',
    description: 'Plan for maintaining business operations during and after disruptions.',
    templateContent: `# Business Continuity Plan

## 1. Purpose

This plan ensures {{companyName}} can maintain critical business functions during and after a disruption.

## 2. Business Impact Analysis

### 2.1 Critical Systems
{{#each criticalSystems}}
- **{{name}}:** RTO {{rto}}, RPO {{rpo}}
{{/each}}

### 2.2 Maximum Tolerable Downtime
- Tier 1 Systems: {{tier1MTD}}
- Tier 2 Systems: {{tier2MTD}}
- Tier 3 Systems: {{tier3MTD}}

## 3. Recovery Strategies

### 3.1 Infrastructure
- Multi-region deployment ({{regions}})
- Automated failover capabilities
- Regular disaster recovery testing

### 3.2 Data Backup
- Daily automated backups
- {{backupRetention}} retention period
- Offsite backup storage
- Backup testing {{backupTestFrequency}}

### 3.3 Alternative Work Locations
- Remote work capabilities for all employees
- Cloud-based tools and systems
- {{alternativeSites}} backup office locations

## 4. Recovery Procedures

### 4.1 Activation Criteria
- Natural disasters
- Cyber attacks
- System failures
- Facility damage

### 4.2 Notification
- Emergency notification via {{notificationSystem}}
- Executive team notification within {{executiveNotificationTime}}
- All staff notification within {{staffNotificationTime}}

### 4.3 Recovery Teams
{{#each recoveryTeams}}
- **{{name}}:** {{members}}
{{/each}}

## 5. Testing and Maintenance

- Annual full disaster recovery test
- Quarterly tabletop exercises
- Plan review after incidents
- Annual plan update

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'criticalSystems', 'tier1MTD', 'tier2MTD', 'tier3MTD', 'regions', 'backupRetention', 'backupTestFrequency', 'alternativeSites', 'notificationSystem', 'executiveNotificationTime', 'staffNotificationTime', 'recoveryTeams', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['A1.1', 'A1.2', 'A1.3'],
  },
  {
    name: 'Data Classification Policy',
    category: 'Data Protection',
    description: 'Policy for classifying and handling data based on sensitivity.',
    templateContent: `# Data Classification Policy

## 1. Purpose

This policy defines how {{companyName}} classifies and handles data based on sensitivity and criticality.

## 2. Data Classifications

### 2.1 Public
- Information intended for public consumption
- No confidentiality requirements
- Examples: {{publicDataExamples}}

### 2.2 Internal
- General business information
- Not for public distribution
- Examples: {{internalDataExamples}}

### 2.3 Confidential
- Sensitive business information
- Limited distribution
- Examples: {{confidentialDataExamples}}

### 2.4 Restricted
- Highly sensitive data
- Strictly controlled access
- Examples: {{restrictedDataExamples}}
- Includes: PII, PCI, PHI, {{otherRestrictedTypes}}

## 3. Handling Requirements

### 3.1 Public Data
- No encryption required
- Standard access controls
- Can be shared externally

### 3.2 Internal Data
- Access control required
- Encryption for transmission
- Internal use only

### 3.3 Confidential Data
- Encryption at rest and in transit ({{encryptionStandard}})
- Role-based access
- Logging and monitoring
- Cannot leave {{companyName}} systems without approval

### 3.4 Restricted Data
- {{restrictedEncryption}} encryption
- Multi-factor authentication required
- Comprehensive audit logging
- Data loss prevention (DLP) controls
- Annual access reviews

## 4. Data Lifecycle

### 4.1 Collection
- Collect only necessary data
- Document purpose and legal basis
- Privacy impact assessment for restricted data

### 4.2 Storage
- Secure storage per classification level
- Geographic restrictions: {{dataResidency}}
- Backup and recovery procedures

### 4.3 Transmission
- Encryption for all non-public data
- Secure file transfer methods
- Approved collaboration tools only

### 4.4 Disposal
- Secure deletion methods
- {{retentionPeriod}} retention policy
- Certificate of destruction for restricted data

## 5. Data Classification Process

- Data owners responsible for classification
- Classification labels applied to all data assets
- Regular classification reviews
- Employee training on classification

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'publicDataExamples', 'internalDataExamples', 'confidentialDataExamples', 'restrictedDataExamples', 'otherRestrictedTypes', 'encryptionStandard', 'restrictedEncryption', 'dataResidency', 'retentionPeriod', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC6.1', 'PI1.1', 'PI1.2', 'PI1.4'],
  },
  {
    name: 'Acceptable Use Policy',
    category: 'Security',
    description: 'Policy defining acceptable use of company IT resources.',
    templateContent: `# Acceptable Use Policy

## 1. Purpose

This policy defines acceptable use of {{companyName}}'s information technology resources.

## 2. Scope

Applies to all:
- Employees, contractors, and third parties
- Company-owned and personal devices (BYOD)
- Systems, networks, and applications

## 3. Acceptable Use

### 3.1 General Use
- Business purposes and authorized personal use
- Compliance with all company policies
- Protection of company and customer data

### 3.2 Email and Communication
- Professional communication
- No unauthorized disclosure of confidential information
- No harassment or discriminatory content
- Email retention: {{emailRetention}}

### 3.3 Internet Access
- Business-related browsing permitted
- Limited personal use acceptable
- Prohibited sites blocked automatically

### 3.4 Software and Applications
- Only approved software installed
- No unauthorized cloud services
- Approved list maintained at {{approvedSoftwareList}}

## 4. Prohibited Activities

### 4.1 Security Violations
- Unauthorized access to systems or data
- Circumventing security controls
- Sharing credentials
- Installing unauthorized software

### 4.2 Illegal Activities
- Copyright infringement
- Hacking or penetration testing without authorization
- Distribution of malware
- Illegal downloads

### 4.3 Inappropriate Content
- Harassment or discrimination
- Offensive or explicit material
- Political campaigning (except where legally protected)

### 4.4 Resource Abuse
- Cryptocurrency mining
- Running personal servers
- Bandwidth-intensive personal use

## 5. Personal Device Use (BYOD)

### 5.1 Requirements
- Mobile device management (MDM) enrollment
- Security controls: {{byodSecurityControls}}
- Company data containerized
- Remote wipe capability

### 5.2 Responsibilities
- Device security maintained
- Company data separated from personal
- Lost/stolen devices reported immediately

## 6. Monitoring and Privacy

- {{companyName}} reserves the right to monitor systems
- No expectation of privacy on company systems
- Monitoring for security and compliance purposes
- Personal communications may be visible

## 7. Consequences

Violations may result in:
- Access suspension
- Disciplinary action
- Termination of employment
- Legal action

## 8. Reporting Violations

Report violations to: {{reportingChannel}}

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'emailRetention', 'approvedSoftwareList', 'byodSecurityControls', 'reportingChannel', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC6.1', 'CC6.2', 'CC7.2'],
  },
  {
    name: 'Password Policy',
    category: 'Security',
    description: 'Policy for password creation, management, and security requirements.',
    templateContent: `# Password Policy

## 1. Purpose

This policy establishes {{companyName}}'s password security requirements to protect against unauthorized access.

## 2. Password Requirements

### 2.1 Complexity
- Minimum length: {{minPasswordLength}} characters
- Must contain:
  - At least {{minUppercase}} uppercase letter
  - At least {{minLowercase}} lowercase letter
  - At least {{minNumbers}} number
  - At least {{minSpecialChars}} special character
- Cannot contain username or common dictionary words

### 2.2 Password Expiration
- Passwords expire every {{passwordExpiryDays}} days
- Warning notification {{expiryWarningDays}} days before expiration
- Grace period: {{gracePeriodDays}} days

### 2.3 Password History
- Cannot reuse last {{passwordHistoryCount}} passwords
- Minimum time between changes: {{minPasswordAge}} hours

### 2.4 Account Lockout
- Account locks after {{maxFailedAttempts}} failed attempts
- Lockout duration: {{lockoutDuration}} minutes
- Administrator unlock required after {{adminUnlockThreshold}} attempts

## 3. Multi-Factor Authentication (MFA)

### 3.1 Required For
- All production system access
- VPN and remote access
- Privileged accounts
- Access to {{restrictedSystems}}

### 3.2 Approved Methods
{{#each mfaMethods}}
- {{method}}: {{description}}
{{/each}}

## 4. Password Management

### 4.1 Creation and Storage
- Use approved password manager: {{passwordManager}}
- Never share passwords
- Different passwords for different systems
- No writing passwords down

### 4.2 Temporary Passwords
- Generated randomly
- Forced change on first use
- Valid for {{tempPasswordValidity}} hours
- Cannot be reused

### 4.3 Service Accounts
- Unique, complex passwords ({{serviceAccountLength}}+ characters)
- Stored in approved secret management system: {{secretManager}}
- Rotated {{serviceAccountRotation}}
- Access logged and monitored

## 5. Password Recovery

### 5.1 Self-Service Reset
- Security questions required
- Email verification to {{emailDomain}}
- SMS verification available

### 5.2 Help Desk Reset
- Identity verification required
- Temporary password issued
- Mandatory change on first login

## 6. Special Account Types

### 6.1 Privileged Accounts
- {{privilegedPasswordLength}}+ characters minimum
- MFA required
- 90-day rotation
- Separate from standard accounts

### 6.2 Emergency Accounts
- Stored in physical safe
- Break-glass procedures
- Post-use audit required
- Password changed immediately after use

## 7. Third-Party Accounts

- Unique credentials for each vendor
- Time-limited access
- Automatic expiration: {{vendorAccessExpiry}}
- Regular access reviews

## 8. Compliance Monitoring

- Password policy compliance monitored automatically
- Quarterly compliance reports
- Violations reported to security team
- Training for repeated violations

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'minPasswordLength', 'minUppercase', 'minLowercase', 'minNumbers', 'minSpecialChars', 'passwordExpiryDays', 'expiryWarningDays', 'gracePeriodDays', 'passwordHistoryCount', 'minPasswordAge', 'maxFailedAttempts', 'lockoutDuration', 'adminUnlockThreshold', 'restrictedSystems', 'mfaMethods', 'passwordManager', 'tempPasswordValidity', 'serviceAccountLength', 'secretManager', 'serviceAccountRotation', 'emailDomain', 'privilegedPasswordLength', 'vendorAccessExpiry', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC6.1', 'CC6.2'],
  },
  {
    name: 'Encryption Policy',
    category: 'Security',
    description: 'Policy for encryption standards and implementation.',
    templateContent: `# Encryption Policy

## 1. Purpose

This policy establishes {{companyName}}'s encryption standards to protect data confidentiality.

## 2. Encryption Standards

### 2.1 Data at Rest
- **Encryption Standard:** {{dataAtRestStandard}} (minimum AES-256)
- **Key Length:** {{keyLengthAtRest}} bits
- **Applies to:**
  - Production databases
  - File storage systems
  - Backup media
  - Laptops and mobile devices
  - Removable media

### 2.2 Data in Transit
- **Encryption Standard:** {{dataInTransitStandard}} (minimum TLS 1.2)
- **Key Length:** {{keyLengthInTransit}} bits
- **Applies to:**
  - All network communications
  - API calls
  - Email (S/MIME or PGP)
  - File transfers (SFTP, FTPS)
  - VPN connections

### 2.3 End-to-End Encryption
Required for:
- Customer PII
- Payment card data
- Healthcare information (PHI)
- {{otherE2ERequirements}}

## 3. Key Management

### 3.1 Key Generation
- Cryptographically secure random number generation
- Key generation in {{keyGenerationLocation}}
- Hardware Security Module (HSM) for production keys: {{hsmProvider}}

### 3.2 Key Storage
- Keys stored separately from encrypted data
- Production keys in HSM or approved key management service: {{kmsService}}
- Development keys in {{devKeyStorage}}
- No keys in source code or configuration files

### 3.3 Key Rotation
- Production keys rotated {{prodKeyRotation}}
- Automated rotation where possible
- Manual rotation procedures documented
- Old keys retained for {{keyRetention}} for decryption

### 3.4 Key Destruction
- Secure key destruction when no longer needed
- Cryptographic erasure methods
- Destruction logged and audited

## 4. Implementation Requirements

### 4.1 Database Encryption
- Transparent Data Encryption (TDE) enabled
- Column-level encryption for sensitive fields
- Encrypted backups

### 4.2 Application Encryption
- Application-level encryption for {{appEncryptionData}}
- Approved libraries: {{approvedCryptoLibraries}}
- No custom cryptography implementations

### 4.3 Disk Encryption
- Full disk encryption on all devices ({{diskEncryptionSolution}})
- BitLocker/FileVault/LUKS as appropriate
- Pre-boot authentication required

### 4.4 Email Encryption
- S/MIME or PGP for sensitive emails
- Transport encryption (TLS) for all email
- DLP integration

## 5. Cloud Services

### 5.1 Cloud Storage
- {{cloudProvider}} encryption features enabled
- Customer-managed keys (BYOK) for {{byokServices}}
- Regular encryption status audits

### 5.2 Cloud Databases
- Encryption at rest enabled
- Encrypted connections required
- Automated encrypted backups

## 6. Compliance and Monitoring

### 6.1 Compliance Checks
- Quarterly encryption compliance scans
- Unencrypted sensitive data alerts
- Remediation within {{remediationSLA}}

### 6.2 Audit Logging
- All key access logged
- Encryption/decryption operations monitored
- Logs retained for {{logRetention}}

## 7. Exceptions

- Exception requests submitted to security team
- Business justification required
- Compensating controls documented
- Annual exception review

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'dataAtRestStandard', 'keyLengthAtRest', 'dataInTransitStandard', 'keyLengthInTransit', 'otherE2ERequirements', 'keyGenerationLocation', 'hsmProvider', 'kmsService', 'devKeyStorage', 'prodKeyRotation', 'keyRetention', 'appEncryptionData', 'approvedCryptoLibraries', 'diskEncryptionSolution', 'cloudProvider', 'byokServices', 'remediationSLA', 'logRetention', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC6.1', 'CC6.6', 'CC6.7'],
  },
  {
    name: 'Vendor Management Policy',
    category: 'Risk Management',
    description: 'Policy for managing third-party vendor relationships and security.',
    templateContent: `# Vendor Management Policy

## 1. Purpose

This policy establishes {{companyName}}'s approach to managing third-party vendors to ensure security and compliance.

## 2. Vendor Classification

### 2.1 Risk Tiers

**Critical (Tier 1):**
- Access to production systems or customer data
- Hosting or processing sensitive data
- Examples: {{tier1Examples}}

**High (Tier 2):**
- Access to internal systems
- Processing company confidential data
- Examples: {{tier2Examples}}

**Medium (Tier 3):**
- Limited system access
- Processing internal data only
- Examples: {{tier3Examples}}

**Low (Tier 4):**
- No system or data access
- General business services
- Examples: {{tier4Examples}}

## 3. Vendor Assessment

### 3.1 Pre-Engagement Due Diligence

**For Tier 1-2 Vendors:**
- Security questionnaire completion
- SOC 2 Type II report review
- ISO 27001 or equivalent certification
- Data processing agreement (DPA) review
- Financial stability check
- Reference checks

**For Tier 3-4 Vendors:**
- Basic security questionnaire
- Insurance verification
- Contract review

### 3.2 Security Requirements

**Tier 1 Vendors Must:**
- Maintain SOC 2 Type II compliance
- Provide annual security reports
- Undergo annual security assessment
- Incident notification within {{tier1NotificationHours}} hours
- Business continuity plan in place
- Cyber insurance: minimum $5M coverage

**Tier 2 Vendors Must:**
- Complete security questionnaire
- Provide security documentation
- Incident notification within {{tier2NotificationHours}} hours
- Cyber insurance: minimum $2M coverage

## 4. Contract Requirements

### 4.1 Standard Clauses
- Security and data protection obligations
- Right to audit
- Incident notification requirements
- Data ownership and return
- Subcontractor restrictions
- Insurance requirements
- Compliance with applicable laws

### 4.2 Data Processing Addendum (DPA)
Required for vendors processing:
- Personal information (PII)
- Payment card data
- Healthcare information
- {{otherDPARequirements}}

## 5. Ongoing Management

### 5.1 Monitoring and Reviews

**Tier 1 Vendors:**
- Annual security review
- Quarterly performance review
- Continuous monitoring via {{vendorMonitoringTool}}
- Annual SOC 2 report review

**Tier 2 Vendors:**
- Annual security questionnaire
- Semi-annual performance review

**Tier 3-4 Vendors:**
- Annual contract review
- As-needed security updates

### 5.2 Access Management
- Principle of least privilege
- Time-limited access
- Separate vendor accounts
- MFA required for system access
- Access reviewed {{vendorAccessReviewFrequency}}

### 5.3 Incident Management
- Vendors must report incidents immediately
- {{companyName}} incident response team engagement
- Root cause analysis required
- Remediation plan and timeline

## 6. Vendor Offboarding

### 6.1 Process
- Data return or destruction certification
- Access revocation
- Equipment return
- Final security audit
- Documentation archival

### 6.2 Data Handling
- All {{companyName}} data deleted or returned
- Confirmation of deletion from backups
- Certificate of destruction provided
- Verification within {{offboardingVerificationDays}} days

## 7. Vendor Inventory

- Central vendor registry maintained in {{vendorRegistrySystem}}
- All active vendors documented
- Contact information current
- Contract expiration tracking
- Risk tier assignments

## 8. Subcontractors

- Prior written approval required
- Same security requirements apply
- {{companyName}} retains audit rights
- Liability flow-down provisions

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'tier1Examples', 'tier2Examples', 'tier3Examples', 'tier4Examples', 'tier1NotificationHours', 'tier2NotificationHours', 'otherDPARequirements', 'vendorMonitoringTool', 'vendorAccessReviewFrequency', 'offboardingVerificationDays', 'vendorRegistrySystem', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC9.1', 'CC9.2'],
  },
  {
    name: 'Risk Assessment Policy',
    category: 'Risk Management',
    description: 'Policy for identifying, assessing, and managing organizational risks.',
    templateContent: `# Risk Assessment Policy

## 1. Purpose

This policy establishes {{companyName}}'s approach to identifying, assessing, and managing risks to information security and business operations.

## 2. Risk Management Framework

### 2.1 Risk Categories
- **Security Risks:** Threats to confidentiality, integrity, availability
- **Compliance Risks:** Regulatory and contractual obligations
- **Operational Risks:** Business continuity and resilience
- **Third-Party Risks:** Vendor and supply chain
- **Strategic Risks:** {{customRiskCategories}}

### 2.2 Risk Assessment Frequency
- Annual comprehensive risk assessment
- Quarterly risk review meetings
- Continuous monitoring of critical risks
- Ad-hoc assessments for significant changes

## 3. Risk Assessment Methodology

### 3.1 Risk Identification
- Threat modeling workshops
- Vulnerability assessments
- Penetration testing: {{pentestFrequency}}
- Industry threat intelligence
- Incident analysis
- Internal and external audit findings

### 3.2 Risk Analysis

**Likelihood Scale:**
- **Rare (1):** <10% probability
- **Unlikely (2):** 10-30% probability
- **Possible (3):** 30-50% probability
- **Likely (4):** 50-75% probability
- **Almost Certain (5):** >75% probability

**Impact Scale:**
- **Negligible (1):** {{negligibleImpact}}
- **Minor (2):** {{minorImpact}}
- **Moderate (3):** {{moderateImpact}}
- **Major (4):** {{majorImpact}}
- **Catastrophic (5):** {{catastrophicImpact}}

**Risk Score:** Likelihood × Impact

### 3.3 Risk Evaluation

**Risk Levels:**
- **Critical (20-25):** Immediate action required
- **High (12-19):** Priority remediation
- **Medium (6-11):** Scheduled remediation
- **Low (1-5):** Accepted or monitored

## 4. Risk Treatment

### 4.1 Treatment Options
- **Mitigate:** Implement controls to reduce risk
- **Transfer:** Insurance or third-party acceptance
- **Avoid:** Eliminate the risk source
- **Accept:** Document acceptance with justification

### 4.2 Risk Mitigation
- Risk owners assigned for each risk
- Mitigation plans with timelines
- Budget allocation
- Progress tracking in {{riskManagementTool}}

### 4.3 Risk Acceptance
- Acceptance requires {{acceptanceAuthority}} approval
- Business justification documented
- Compensating controls identified
- Annual re-evaluation

## 5. Risk Monitoring

### 5.1 Key Risk Indicators (KRIs)
{{#each kris}}
- **{{name}}:** {{description}} - Threshold: {{threshold}}
{{/each}}

### 5.2 Reporting
- Monthly risk dashboard to executive team
- Quarterly risk committee meetings
- Board reporting {{boardReportingFrequency}}
- Trend analysis and metrics

## 6. Roles and Responsibilities

### 6.1 Chief Risk Officer (CRO)
- Overall risk management program
- Risk assessment coordination
- Executive reporting

### 6.2 Risk Owners
- Assigned to specific risks
- Mitigation plan execution
- Status reporting

### 6.3 All Employees
- Report potential risks
- Participate in risk assessments
- Follow risk mitigation procedures

## 7. Risk Register

Maintained in {{riskRegisterLocation}} with:
- Risk description and category
- Likelihood and impact ratings
- Risk score and level
- Treatment plan
- Owner and status
- Review dates

## 8. Integration with Business Processes

- New projects include risk assessment
- Change management includes risk evaluation
- Vendor onboarding includes risk review
- Incident response feeds risk register

**Effective Date:** {{effectiveDate}}`,
    variables: ['companyName', 'customRiskCategories', 'pentestFrequency', 'negligibleImpact', 'minorImpact', 'moderateImpact', 'majorImpact', 'catastrophicImpact', 'riskManagementTool', 'acceptanceAuthority', 'kris', 'boardReportingFrequency', 'riskRegisterLocation', 'effectiveDate'],
    framework: Framework.SOC2,
    controls: ['CC3.1', 'CC3.2', 'CC3.3', 'CC4.1'],
  },
];

export async function seedPolicyTemplates() {
  console.log('🌱 Seeding policy templates...');

  for (const template of policyTemplates) {
    const { controls, ...templateData } = template;

    // Check if template exists
    const existing = await prisma.policyTemplate.findFirst({
      where: { name: template.name },
    });

    const created = existing
      ? await prisma.policyTemplate.update({
          where: { id: existing.id },
          data: templateData,
        })
      : await prisma.policyTemplate.create({
          data: templateData,
        });

    console.log(`✓ Created/Updated template: ${created.name}`);

    if (controls && controls.length > 0) {
      const controlRecords = await prisma.control.findMany({
        where: {
          controlId: { in: controls },
          framework: Framework.SOC2,
        },
      });

      for (const control of controlRecords) {
        await prisma.policyTemplateControl.upsert({
          where: {
            policyTemplateId_controlId: {
              policyTemplateId: created.id,
              controlId: control.id,
            },
          },
          update: {},
          create: {
            policyTemplateId: created.id,
            controlId: control.id,
          },
        });
      }

      console.log(`  → Linked ${controlRecords.length} controls`);
    }
  }

  console.log(`\n✅ Seeded ${policyTemplates.length} policy templates`);
}

// Run if called directly
if (require.main === module) {
  seedPolicyTemplates()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
