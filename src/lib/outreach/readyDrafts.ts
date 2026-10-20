export interface OutlookDraftCandidate {
  id: string;
  owner_id: string;
  subject: string | null;
  body: string | null;
  status: string;
  sync_status: string | null;
}

export interface OutlookDraftTarget {
  target: 'follow_up' | 'batch_item';
  id: string;
}

export function isReadyForOutlook(draft: OutlookDraftCandidate, userId: string): boolean {
  return draft.owner_id === userId && Boolean(draft.subject?.trim() && draft.body?.trim()) &&
    !['sent', 'done', 'snoozed'].includes(draft.status) && draft.sync_status !== 'synced';
}

export async function pushReadyDrafts(
  drafts: OutlookDraftTarget[],
  push: (draft: OutlookDraftTarget) => Promise<boolean>,
  onProgress: (completed: number) => void,
) {
  let added = 0;
  for (const [index, draft] of drafts.entries()) {
    try {
      if (await push(draft)) added += 1;
    } catch {
      // Keep the other drafts moving if one request fails.
    }
    onProgress(index + 1);
  }
  return { added, failed: drafts.length - added };
}