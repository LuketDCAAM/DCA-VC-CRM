import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Trash2, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";

type Kind = "deck" | "transcript" | "financials" | "link";

interface DocRow {
  id: string;
  scorecard_id: string;
  file_attachment_id: string | null;
  external_url: string | null;
  kind: Kind;
  parsed_excerpt: string | null;
  created_at: string;
  file?: { file_name: string; file_url: string; file_type: string | null } | null;
}

interface Props {
  scorecardId: string;
  dealId: string;
  readonly?: boolean;
}

export function UploadsPanel({ scorecardId, dealId, readonly }: Props) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<Kind>("deck");
  const [linkKind, setLinkKind] = useState<Kind>("link");
  const [linkUrl, setLinkUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scorecard_documents")
      .select("*, file:file_attachments(file_name, file_url, file_type)")
      .eq("scorecard_id", scorecardId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load sources");
    setDocs((data as unknown as DocRow[]) ?? []);
    setLoading(false);
  }, [scorecardId]);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (file: File) => {
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) {
      toast.error("Sign in required");
      setUploading(false);
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${dealId}/scorecard/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("pitch-decks").upload(path, file);
    if (upErr) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("pitch-decks").getPublicUrl(path);
    const { data: att, error: attErr } = await supabase
      .from("file_attachments")
      .insert({
        deal_id: dealId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || "file",
        file_size: file.size,
        uploaded_by: uid,
      })
      .select("id")
      .single();
    if (attErr || !att) {
      toast.error("Attachment record failed");
      setUploading(false);
      return;
    }
    const { error: docErr } = await supabase.from("scorecard_documents").insert({
      scorecard_id: scorecardId,
      file_attachment_id: att.id,
      kind,
      created_by: uid,
    });
    setUploading(false);
    if (docErr) {
      toast.error("Failed to attach source");
      return;
    }
    toast.success("Uploaded");
    load();
  };

  const onAddLink = async () => {
    if (!linkUrl.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("scorecard_documents").insert({
      scorecard_id: scorecardId,
      external_url: linkUrl.trim(),
      kind: linkKind,
      created_by: uid,
    });
    if (error) {
      toast.error("Failed to add link");
      return;
    }
    setLinkUrl("");
    toast.success("Link added");
    load();
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("scorecard_documents").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    load();
  };

  return (
    <div className="space-y-6">
      {!readonly && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-md p-4 space-y-3">
            <h4 className="font-medium text-sm">Upload file</h4>
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deck">Pitch deck</SelectItem>
                  <SelectItem value="transcript">Call transcript</SelectItem>
                  <SelectItem value="financials">Financials / data room</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="file"
              accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.md,.xlsx,.xls,.csv"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            {uploading && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</div>}
          </div>

          <div className="border rounded-md p-4 space-y-3">
            <h4 className="font-medium text-sm">Add link (Notion / Drive / web)</h4>
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select value={linkKind} onValueChange={(v) => setLinkKind(v as Kind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">General link</SelectItem>
                  <SelectItem value="deck">Pitch deck</SelectItem>
                  <SelectItem value="transcript">Call transcript</SelectItem>
                  <SelectItem value="financials">Financials / data room</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://…"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <Button onClick={onAddLink} disabled={!linkUrl.trim()}><Upload className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium text-sm mb-2">Sources ({docs.length})</h4>
        {loading ? (
          <div className="text-muted-foreground text-sm flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sources yet. Upload decks, transcripts, and financials so the AI can draft this scorecard.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {docs.map((d) => {
              const href = d.external_url ?? d.file?.file_url;
              const label = d.file?.file_name ?? d.external_url ?? "(untitled)";
              return (
                <div key={d.id} className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Badge variant="outline" className="capitalize">{d.kind}</Badge>
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="truncate hover:underline">{label}</a>
                    ) : (
                      <span className="truncate">{label}</span>
                    )}
                    {href && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  {!readonly && (
                    <Button variant="ghost" size="icon" onClick={() => onDelete(d.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
