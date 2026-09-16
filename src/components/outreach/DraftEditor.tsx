import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Loader2, Mail, RefreshCw, Send, Sparkles } from 'lucide-react';

interface DraftEditorProps {
  subject: string | null;
  body: string | null;
  recipientEmail?: string | null;
  syncStatus?: string | null;
  syncError?: string | null;
  webLink?: string | null;
  outlookConnected: boolean;
  busy?: boolean;
  onGenerate: (note?: string) => void;
  onSave: (subject: string, body: string) => void;
  onPushToOutlook: () => void;
  onMarkSent?: () => void;
}

export function DraftEditor({
  subject,
  body,
  recipientEmail,
  syncStatus,
  syncError,
  webLink,
  outlookConnected,
  busy,
  onGenerate,
  onSave,
  onPushToOutlook,
  onMarkSent,
}: DraftEditorProps) {
  const [localSubject, setLocalSubject] = useState(subject ?? '');
  const [localBody, setLocalBody] = useState(body ?? '');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const { toast } = useToast();

  useEffect(() => setLocalSubject(subject ?? ''), [subject]);
  useEffect(() => setLocalBody(body ?? ''), [body]);

  const dirty = localSubject !== (subject ?? '') || localBody !== (body ?? '');
  const hasDraft = Boolean(subject || body);

  const copyAll = async () => {
    await navigator.clipboard.writeText(`Subject: ${localSubject}\n\n${localBody}`);
    toast({ title: 'Copied', description: 'Paste it straight into your email.' });
  };

  const mailtoHref = `mailto:${recipientEmail ?? ''}?subject=${encodeURIComponent(localSubject)}&body=${encodeURIComponent(localBody)}`;

  return (
    <div className="space-y-3">
      {!hasDraft ? (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">No draft yet.</p>
          <Button size="sm" onClick={() => onGenerate()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Write the draft
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input value={localSubject} onChange={(e) => setLocalSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              rows={14}
              className="text-sm leading-relaxed"
            />
          </div>

          {showNote && (
            <div className="space-y-1.5">
              <Label className="text-xs">What should change?</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Shorter, mention the pilot with Acme, warmer tone…"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <Button size="sm" onClick={() => onSave(localSubject, localBody)} disabled={busy}>
                Save changes
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (!showNote) {
                  setShowNote(true);
                  return;
                }
                onGenerate(note || undefined);
                setNote('');
                setShowNote(false);
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {showNote ? 'Rewrite' : 'Rewrite with a note'}
            </Button>
            <Button size="sm" variant="outline" onClick={copyAll} disabled={busy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            {outlookConnected ? (
              <Button size="sm" variant="secondary" onClick={onPushToOutlook} disabled={busy || dirty}>
                <Send className="h-4 w-4 mr-2" />
                Put in my Outlook drafts
              </Button>
            ) : (
              <Button size="sm" variant="secondary" asChild>
                <a href={mailtoHref}>
                  <Mail className="h-4 w-4 mr-2" />
                  Open in email
                </a>
              </Button>
            )}
            {webLink && (
              <Button size="sm" variant="ghost" asChild>
                <a href={webLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Outlook
                </a>
              </Button>
            )}
            {onMarkSent && (
              <Button size="sm" variant="ghost" onClick={onMarkSent} disabled={busy}>
                Mark as sent
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {recipientEmail ? <span>To: {recipientEmail}</span> : <span>No email address on file yet</span>}
            {syncStatus === 'synced' && <Badge variant="secondary">In Outlook drafts</Badge>}
            {syncStatus === 'not_connected' && <Badge variant="outline">Waiting on Outlook access</Badge>}
            {syncStatus === 'error' && <Badge variant="destructive">Outlook error</Badge>}
          </div>
          {syncError && syncStatus === 'error' && (
            <p className="text-xs text-destructive break-words">{syncError}</p>
          )}
          {dirty && <p className="text-xs text-muted-foreground">Save your edits before sending them to Outlook.</p>}
        </>
      )}
    </div>
  );
}
