import { describe, it, expect } from 'vitest';

import { BrokenLinkReportSchema, transitionReportStatus } from '../../../../src/feedback/domain/BrokenLinkReport';

describe('BrokenLinkReport', () => {
  it('validates a correct report', () => {
    const report = {
      id: '1',
      productId: 'p1',
      merchantName: 'Myntra',
      reportedUrl: 'https://myntra.com/p1',
      issueType: 'DEAD_LINK',
      status: 'OPEN',
      createdAt: Date.now(),
    };
    expect(() => BrokenLinkReportSchema.parse(report)).not.toThrow();
  });

  it('rejects non-https URLs', () => {
    const report = {
      id: '1',
      productId: 'p1',
      merchantName: 'Myntra',
      reportedUrl: 'http://myntra.com/p1',
      issueType: 'DEAD_LINK',
      status: 'OPEN',
      createdAt: Date.now(),
    };
    expect(() => BrokenLinkReportSchema.parse(report)).toThrow('Reported URL must strictly use HTTPS');
  });

  it('rejects invalid issue types', () => {
    const report = {
      id: '1',
      productId: 'p1',
      merchantName: 'Myntra',
      reportedUrl: 'https://myntra.com/p1',
      issueType: 'INVALID_TYPE',
      status: 'OPEN',
      createdAt: Date.now(),
    };
    expect(() => BrokenLinkReportSchema.parse(report)).toThrow();
  });

  it('rejects invalid status', () => {
    const report = {
      id: '1',
      productId: 'p1',
      merchantName: 'Myntra',
      reportedUrl: 'https://myntra.com/p1',
      issueType: 'DEAD_LINK',
      status: 'INVALID_STATUS',
      createdAt: Date.now(),
    };
    expect(() => BrokenLinkReportSchema.parse(report)).toThrow();
  });

  it('transitions report status', () => {
    const report = {
      id: '1',
      productId: 'p1',
      merchantName: 'Myntra',
      reportedUrl: 'https://myntra.com/p1',
      issueType: 'DEAD_LINK',
      status: 'OPEN' as const,
      createdAt: Date.now(),
    };

    const parsedReport = BrokenLinkReportSchema.parse(report);
    const newReport = transitionReportStatus(parsedReport, 'INVESTIGATING');

    expect(newReport.status).toBe('INVESTIGATING');
    expect(newReport.id).toBe(parsedReport.id);
  });
});
