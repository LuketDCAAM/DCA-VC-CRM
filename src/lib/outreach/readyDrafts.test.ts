import { describe, expect, test } from 'bun:test';
import { isReadyForOutlook, pushReadyDrafts, type OutlookDraftCandidate } from './readyDrafts';

const draft: OutlookDraftCandidate = {
  id: 'draft-1', owner_id: 'me', subject: 'Check-in', body: 'Hello', status: 'drafted', sync_status: 'pending',
};

describe('ready Outlook drafts', () => {
  test('includes ready drafts and failed pushes for retry', () => {
    expect(isReadyForOutlook(draft, 'me')).toBe(true);
    expect(isReadyForOutlook({ ...draft, sync_status: 'error' }, 'me')).toBe(true);
  });
  test('skips drafts already in Outlook', () => {
    expect(isReadyForOutlook({ ...draft, sync_status: 'synced' }, 'me')).toBe(false);
  });
  test('skips another owner’s drafts', () => {
    expect(isReadyForOutlook(draft, 'teammate')).toBe(false);
  });
  test('skips incomplete drafts', () => {
    expect(isReadyForOutlook({ ...draft, body: ' ' }, 'me')).toBe(false);
    expect(isReadyForOutlook({ ...draft, subject: null }, 'me')).toBe(false);
  });
  test('skips sent and completed drafts', () => {
    for (const status of ['sent', 'done']) {
      expect(isReadyForOutlook({ ...draft, status }, 'me')).toBe(false);
    }
  });
  test('skips active snoozes but includes expired snoozes', () => {
    const snoozed = { ...draft, status: 'snoozed' };
    expect(isReadyForOutlook({ ...snoozed, snooze_until: '2026-10-21' }, 'me', '2026-10-20')).toBe(false);
    expect(isReadyForOutlook({ ...snoozed, snooze_until: '2026-10-20' }, 'me', '2026-10-20')).toBe(true);
    expect(isReadyForOutlook({ ...snoozed, snooze_until: '2026-10-19' }, 'me', '2026-10-20')).toBe(true);
  });
  test('pushes every draft once and continues after failures', async () => {
    const calls: string[] = [];
    const progress: number[] = [];
    const result = await pushReadyDrafts([
      { target: 'follow_up', id: 'one' }, { target: 'batch_item', id: 'two' }, { target: 'batch_item', id: 'three' },
    ], async ({ id }) => {
      calls.push(id);
      if (id === 'two') throw new Error('Outlook unavailable');
      return true;
    }, (completed) => progress.push(completed));
    expect(calls).toEqual(['one', 'two', 'three']);
    expect(progress).toEqual([1, 2, 3]);
    expect(result).toEqual({ added: 2, failed: 1 });
  });
});