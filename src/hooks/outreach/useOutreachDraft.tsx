import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pushReadyDrafts, type OutlookDraftTarget } from '@/lib/outreach/readyDrafts';

export type DraftTarget = 'follow_up' | 'batch_item';

interface DraftResult {
  subject: string;
  body: string;
}

/** Generates outreach email drafts and pushes them into the owner's Outlook Drafts folder. */
export function useOutreachDraft() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ completed: number; total: number } | null>(null);
  const bulkRunning = useRef(false);
  const { toast } = useToast();

  const generate = useCallback(
    async (target: DraftTarget, id: string, note?: string): Promise<DraftResult | null> => {
      setBusyId(id);
      try {
        const { data, error } = await supabase.functions.invoke('outreach-draft', {
          body: { target, id, regenerate_note: note || null },
        });
        if (error) {
          const details = (error as any)?.context ? await (error as any).context.text() : error.message;
          throw new Error(details || error.message);
        }
        if (data?.error) throw new Error(data.error);
        toast({ title: 'Draft ready', description: 'Review it before it goes out.' });
        return { subject: data.subject, body: data.body };
      } catch (error: any) {
        toast({ title: 'Could not write the draft', description: error.message, variant: 'destructive' });
        return null;
      } finally {
        setBusyId(null);
      }
    },
    [toast],
  );

  const pushToOutlook = useCallback(
    async (target: DraftTarget, id: string, opts?: { silent?: boolean }): Promise<boolean> => {
      setBusyId(id);
      try {
        const { data, error } = await supabase.functions.invoke('outlook-app-user', {
          body: { action: 'create_outreach_draft', target, id },
        });
        if (error) {
          const details = (error as any)?.context ? await (error as any).context.text() : error.message;
          throw new Error(details || error.message);
        }
        if (data?.error) throw new Error(data.error);
        if (!opts?.silent) {
          toast({ title: 'Sent to Outlook', description: 'It is waiting in your Drafts folder.' });
        }
        return true;
      } catch (error: any) {
        if (!opts?.silent) {
          toast({ title: 'Could not reach Outlook', description: error.message, variant: 'destructive' });
        }
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [toast],
  );

  const pushAllToOutlook = useCallback(async (drafts: OutlookDraftTarget[]) => {
    if (bulkRunning.current || !drafts.length) return;
    bulkRunning.current = true;
    setBulkProgress({ completed: 0, total: drafts.length });
    try {
      const result = await pushReadyDrafts(
        drafts,
        ({ target, id }) => pushToOutlook(target, id, { silent: true }),
        (completed) => setBulkProgress({ completed, total: drafts.length }),
      );
      toast({
        title: result.failed ? 'Some drafts could not be added' : 'Drafts added to Outlook',
        description: `${result.added} added to your Drafts folder. Nothing was sent.${result.failed ? ` ${result.failed} failed; retry the remaining drafts.` : ''}`,
        variant: result.failed ? 'destructive' : 'default',
      });
      return result;
    } finally {
      bulkRunning.current = false;
      setBulkProgress(null);
      setBusyId(null);
    }
  }, [pushToOutlook, toast]);

  return { generate, pushToOutlook, pushAllToOutlook, busyId, bulkProgress };
}
