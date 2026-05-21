import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, ExternalLink } from 'lucide-react';

interface NotionPage {
  id: string;
  title: string;
  url: string;
  last_edited_time: string;
  icon: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'deal' | 'investor' | 'portfolio_company';
  entityId: string;
  onImported?: () => void;
}

export function NotionImportDialog({ open, onOpenChange, entityType, entityId, onImported }: Props) {
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const search = async (q: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('notion-search', {
        body: { query: q },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setPages((data as any).pages || []);
    } catch (e: any) {
      toast({
        title: 'Notion search failed',
        description: e.message || 'Make sure Notion is connected in Integrations.',
        variant: 'destructive',
      });
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      search('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('notion-import-page', {
        body: { pageIds: Array.from(selected), entityType, entityId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: 'Imported from Notion',
        description: `${selected.size} note${selected.size > 1 ? 's' : ''} added.`,
      });
      onImported?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Notes from Notion</DialogTitle>
          <DialogDescription>
            Select one or more Notion pages to add as call notes. Only pages shared with your Notion integration appear here.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Notion pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-1 border rounded-md p-2">
          {loading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : pages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pages found. Share pages with your Notion integration to see them here.
            </p>
          ) : (
            pages.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
              >
                <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                {p.icon && <span className="text-lg">{p.icon}</span>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Edited {new Date(p.last_edited_time).toLocaleDateString()}
                  </div>
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={selected.size === 0 || importing}>
            {importing ? 'Importing...' : `Import ${selected.size || ''}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
