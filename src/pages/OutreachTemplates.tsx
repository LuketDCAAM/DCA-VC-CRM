import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useOutreachTemplates, type OutreachTemplate } from '@/hooks/outreach/useOutreachTemplates';
import { Loader2 } from 'lucide-react';

function TemplateCard({
  template,
  onSave,
}: {
  template: OutreachTemplate;
  onSave: (id: string, updates: Partial<OutreachTemplate>) => Promise<unknown>;
}) {
  const [tone, setTone] = useState(template.tone);
  const [instructions, setInstructions] = useState(template.instructions);
  const [isActive, setIsActive] = useState(template.is_active);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTone(template.tone);
    setInstructions(template.instructions);
    setIsActive(template.is_active);
  }, [template]);

  const dirty = tone !== template.tone || instructions !== template.instructions || isActive !== template.is_active;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{template.label}</CardTitle>
            {template.description && (
              <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">In use</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tone</Label>
          <Input value={tone} onChange={(e) => setTone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">What every email of this kind should do</Label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="text-sm"
          />
        </div>
        {dirty && (
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(template.id, { tone, instructions, is_active: isActive });
              setSaving(false);
            }}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function OutreachTemplates() {
  const { templates, loading, updateTemplate } = useOutreachTemplates();

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Email styles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          These notes shape every draft the app writes for you. Changes apply team-wide.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onSave={updateTemplate} />
          ))}
          {!templates.length && <p className="text-sm text-muted-foreground">No email styles set up yet.</p>}
        </div>
      )}
    </div>
  );
}
