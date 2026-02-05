import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock API client
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}

// All providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockCustomer = {
  id: 'cust-123',
  name: 'Test Company',
  plan: 'GROWTH',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  customerId: 'cust-123',
  role: 'ADMIN',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockIntegration = {
  id: 'int-123',
  customerId: 'cust-123',
  type: 'AWS',
  status: 'ACTIVE',
  config: {},
  healthScore: 0.95,
  lastSyncAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockControl = {
  id: 'ctrl-123',
  framework: 'SOC2',
  controlId: 'CC6.1',
  title: 'Logical Access Controls',
  description: 'The entity implements logical access security controls',
  category: 'Logical and Physical Access Controls',
  frequency: 'DAILY',
  testProcedure: 'Verify MFA is enabled for all users',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockComplianceCheck = {
  id: 'check-123',
  customerId: 'cust-123',
  controlId: 'ctrl-123',
  status: 'PASS',
  evidenceId: 'ev-123',
  checkedAt: new Date('2024-01-01'),
  nextCheckAt: new Date('2024-01-02'),
  createdAt: new Date('2024-01-01'),
}

export const mockEvidence = {
  id: 'ev-123',
  customerId: 'cust-123',
  controlId: 'ctrl-123',
  integrationId: 'int-123',
  data: { mfaEnabled: true },
  hash: 'abc123',
  collectedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))
