import { describe, it, expect } from 'vitest';

import { AppFeedbackSchema } from '../../../../src/feedback/domain/AppFeedback';

describe('AppFeedback', () => {
  it('validates correct feedback', () => {
    const feedback = {
      id: '1',
      category: 'BUG',
      message: 'App crashes',
      deviceInfo: {
        platform: 'iOS',
        appVersion: '1.0.0',
        osVersion: '15.0',
      },
      screenshotUrls: ['https://example.com/screenshot.png'],
      createdAt: Date.now(),
    };
    expect(() => AppFeedbackSchema.parse(feedback)).not.toThrow();
  });

  it('rejects invalid category', () => {
    const feedback = {
      id: '1',
      category: 'INVALID',
      message: 'App crashes',
      deviceInfo: {
        platform: 'iOS',
        appVersion: '1.0.0',
        osVersion: '15.0',
      },
      createdAt: Date.now(),
    };
    expect(() => AppFeedbackSchema.parse(feedback)).toThrow();
  });

  it('validates default screenshotUrls array', () => {
    const feedback = {
      id: '1',
      category: 'BUG',
      message: 'App crashes',
      deviceInfo: {
        platform: 'iOS',
        appVersion: '1.0.0',
        osVersion: '15.0',
      },
      createdAt: Date.now(),
    };
    const parsed = AppFeedbackSchema.parse(feedback);
    expect(parsed.screenshotUrls).toEqual([]);
  });

  it('rejects invalid screenshot URLs', () => {
      const feedback = {
      id: '1',
      category: 'BUG',
      message: 'App crashes',
      deviceInfo: {
        platform: 'iOS',
        appVersion: '1.0.0',
        osVersion: '15.0',
      },
      screenshotUrls: ['invalid-url'],
      createdAt: Date.now(),
    };
    expect(() => AppFeedbackSchema.parse(feedback)).toThrow();
  });
});
