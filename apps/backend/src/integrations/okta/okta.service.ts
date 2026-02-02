import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as okta from '@okta/okta-sdk-nodejs';
import { retryWithBackoff, CircuitBreaker } from '../../common/utils/retry.util';

@Injectable()
export class OktaService {
  private readonly logger = new Logger(OktaService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private defaultOktaClient: okta.Client;

  constructor(private configService: ConfigService) {
    const orgUrl = this.configService.get('OKTA_DOMAIN', '');
    const token = this.configService.get('OKTA_API_TOKEN', '');

    this.defaultOktaClient = new okta.Client({
      orgUrl,
      token,
    });
  }

  private getClient(config?: { orgUrl: string; token: string }): okta.Client {
    if (!config) return this.defaultOktaClient;
    return new okta.Client(config);
  }

  /**
   * Check connection validity
   */
  async checkConnection(config?: { orgUrl: string; token: string }): Promise<boolean> {
    try {
      const client = this.getClient(config);
      await client.userApi.listUsers({ limit: 1 });
      return true;
    } catch (error) {
      this.logger.error('Okta connection check failed', error);
      return false;
    }
  }

  /**
   * Collect MFA enforcement evidence
   * SOC 2 Control: CC6.1 (Logical Access Controls)
   */
  async collectMfaEnforcementEvidence(config?: { orgUrl: string; token: string }) {
    this.logger.log('Collecting Okta MFA enforcement evidence...');
    const client = this.getClient(config);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const users: any[] = [];
        
        // Collect all users
        const userCollection = await client.userApi.listUsers({});
        for await (const user of userCollection) {
          users.push(user);
        }

        const userMfaStatus = await Promise.all(
          users.map(async (user) => {
            try {
              const factors: any[] = [];
              const factorCollection = await client.userFactorApi.listFactors({
                userId: user.id,
              });
              
              for await (const factor of factorCollection) {
                factors.push(factor);
              }

              const enrolledFactors = factors.filter(
                (f) => f.status === 'ACTIVE',
              );

              return {
                userId: user.id,
                email: user.profile?.email,
                firstName: user.profile?.firstName,
                lastName: user.profile?.lastName,
                status: user.status,
                hasMfa: enrolledFactors.length > 0,
                enrolledFactorCount: enrolledFactors.length,
                factorTypes: enrolledFactors.map((f) => f.factorType),
              };
            } catch (error) {
              // User might not have factors
              return {
                userId: user.id,
                email: user.profile?.email,
                firstName: user.profile?.firstName,
                lastName: user.profile?.lastName,
                status: user.status,
                hasMfa: false,
                enrolledFactorCount: 0,
                factorTypes: [],
              };
            }
          }),
        );

        const activeUsers = userMfaStatus.filter((u) => u.status === 'ACTIVE');
        const activeUsersWithMfa = activeUsers.filter((u) => u.hasMfa);
        const mfaComplianceRate =
          activeUsers.length > 0 ? activeUsersWithMfa.length / activeUsers.length : 0;

        this.logger.log(
          `MFA enforcement evidence collected: ${activeUsersWithMfa.length}/${activeUsers.length} active users have MFA`,
        );

        return {
          type: 'OKTA_MFA_ENFORCEMENT',
          timestamp: new Date(),
          data: {
            totalUsers: users.length,
            activeUsers: activeUsers.length,
            activeUsersWithMfa: activeUsersWithMfa.length,
            activeUsersWithoutMfa: activeUsers.length - activeUsersWithMfa.length,
            mfaComplianceRate,
            users: userMfaStatus,
          },
          status: mfaComplianceRate >= 0.95 ? 'PASS' : 'FAIL', // 95% threshold
        };
      });
    });
  }

  /**
   * Collect user access evidence
   * SOC 2 Control: CC6.2 (User Access Management)
   */
  async collectUserAccessEvidence(config?: { orgUrl: string; token: string }) {
    this.logger.log('Collecting Okta user access evidence...');
    const client = this.getClient(config);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const users: any[] = [];
        
        const userCollection = await client.userApi.listUsers({});
        for await (const user of userCollection) {
          users.push(user);
        }

        const usersByStatus = users.reduce((acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
        const suspendedUsers = users.filter((u) => u.status === 'SUSPENDED').length;
        const deprovisionedUsers = users.filter((u) => u.status === 'DEPROVISIONED').length;

        this.logger.log(`User access evidence collected: ${users.length} total users`);

        return {
          type: 'OKTA_USER_ACCESS',
          timestamp: new Date(),
          data: {
            totalUsers: users.length,
            activeUsers,
            suspendedUsers,
            deprovisionedUsers,
            usersByStatus,
          },
          status: 'PASS',
        };
      });
    });
  }

  /**
   * Collect policy compliance evidence
   * SOC 2 Control: CC6.1 (Access Policies)
   */
  async collectPolicyComplianceEvidence(config?: { orgUrl: string; token: string }) {
    this.logger.log('Collecting Okta policy compliance evidence...');
    const client = this.getClient(config);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const policies: any[] = [];
        
        try {
          const policyCollection = await client.policyApi.listPolicies({
            type: 'PASSWORD',
          });
          
          for await (const policy of policyCollection) {
            policies.push(policy);
          }
        } catch (error) {
          this.logger.warn('Could not fetch policies, using empty list');
        }

        const policyDetails = policies.map((policy) => ({
          id: policy.id,
          name: policy.name,
          status: policy.status,
          type: policy.type,
          priority: policy.priority,
        }));

        const activePolicies = policies.filter((p) => p.status === 'ACTIVE').length;

        this.logger.log(`Policy compliance evidence collected: ${activePolicies} active policies`);

        return {
          type: 'OKTA_POLICY_COMPLIANCE',
          timestamp: new Date(),
          data: {
            totalPolicies: policies.length,
            activePolicies,
            policies: policyDetails,
          },
          status: activePolicies > 0 ? 'PASS' : 'WARNING',
        };
      });
    });
  }

  /**
   * Calculate overall health score for Okta integration
   */
  async calculateHealthScore(config?: { orgUrl: string; token: string }): Promise<number> {
    try {
      const [mfaEnforcement, userAccess, policyCompliance] = await Promise.all([
        this.collectMfaEnforcementEvidence(config),
        this.collectUserAccessEvidence(config),
        this.collectPolicyComplianceEvidence(config),
      ]);

      const scores = [
        mfaEnforcement.data.mfaComplianceRate,
        1, // User access always passes
        policyCompliance.status === 'PASS' ? 1 : 0.5,
      ];

      const healthScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      this.logger.log(`Okta health score calculated: ${(healthScore * 100).toFixed(2)}%`);

      return healthScore;
    } catch (error) {
      this.logger.error('Failed to calculate Okta health score:', error);
      return 0;
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
    };
  }
}

