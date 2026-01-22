/**
 * Export Utilities
 * Functions for exporting application data in various formats
 */

import { Artifact, ContextGroup } from '@/store/useStore';

/**
 * Export artifacts as JSON
 */
export function exportArtifactsAsJSON(artifacts: Artifact[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    totalCount: artifacts.length,
    artifacts: artifacts,
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `kushim-artifacts-${getTimestamp()}.json`,
    'application/json'
  );
}

/**
 * Export artifacts as CSV
 */
export function exportArtifactsAsCSV(artifacts: Artifact[]): void {
  const headers = [
    'External ID',
    'Platform',
    'Type',
    'Title',
    'Author',
    'Timestamp',
    'URL',
    'Participants',
  ];

  const rows = artifacts.map((a) => [
    a.externalId,
    a.sourcePlatform,
    a.artifactType,
    escapeCsvValue(a.title),
    a.author,
    a.timestamp,
    a.url,
    a.participants.join('; '),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  downloadFile(
    csv,
    `kushim-artifacts-${getTimestamp()}.csv`,
    'text/csv'
  );
}

/**
 * Export context groups as JSON
 */
export function exportContextGroupsAsJSON(groups: ContextGroup[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    totalGroups: groups.length,
    contextGroups: groups,
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `kushim-context-groups-${getTimestamp()}.json`,
    'application/json'
  );
}

/**
 * Copy data to clipboard
 */
export async function copyToClipboard(data: any, format: 'json' | 'csv' = 'json'): Promise<boolean> {
  try {
    const text = format === 'json' 
      ? JSON.stringify(data, null, 2)
      : convertToCSV(data);

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Helper: Download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Get timestamp for filenames
 */
function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Helper: Escape CSV values
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Helper: Convert array to CSV
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((header) => escapeCsvValue(String(item[header] || ''))).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
