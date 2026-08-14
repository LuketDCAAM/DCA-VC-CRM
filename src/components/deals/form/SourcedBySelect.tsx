import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSourcerProfiles } from '@/hooks/useSourcerProfiles';

const EXTERNAL = '__external__';
const NONE = '__none__';

interface SourcedBySelectProps {
  /** The deal's stored sourced_by_id, so a former employee still renders */
  currentSourcedById?: string | null;
}

/**
 * "Sourced By" picker. Writes `sourced_by_id` for internal staff, or free-text
 * `sourced_by` (with a null id) for people/firms outside the firm.
 */
export function SourcedBySelect({ currentSourcedById }: SourcedBySelectProps) {
  const form = useFormContext();
  const { profiles } = useSourcerProfiles(currentSourcedById ?? form.getValues('sourced_by_id'));

  const sourcedById: string | null = form.watch('sourced_by_id') ?? null;
  const sourcedByText: string = form.watch('sourced_by') ?? '';

  const [external, setExternal] = useState(!sourcedById && !!sourcedByText);

  useEffect(() => {
    if (sourcedById) setExternal(false);
  }, [sourcedById]);

  const handleSelect = (value: string) => {
    if (value === EXTERNAL) {
      setExternal(true);
      form.setValue('sourced_by_id', null, { shouldDirty: true });
      return;
    }
    setExternal(false);
    if (value === NONE) {
      form.setValue('sourced_by_id', null, { shouldDirty: true });
      form.setValue('sourced_by', '', { shouldDirty: true });
      return;
    }
    form.setValue('sourced_by_id', value, { shouldDirty: true });
    form.setValue('sourced_by', '', { shouldDirty: true });
  };

  return (
    <div className="space-y-2">
      <FormField
        control={form.control}
        name="sourced_by_id"
        render={() => (
          <FormItem>
            <FormLabel>Sourced By</FormLabel>
            <Select
              value={sourcedById ?? (external ? EXTERNAL : NONE)}
              onValueChange={handleSelect}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select who sourced this deal" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.email || 'Unnamed'}
                  </SelectItem>
                ))}
                <SelectItem value={EXTERNAL}>Someone outside the firm…</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {external && (
        <FormField
          control={form.control}
          name="sourced_by"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="e.g. Wischoff Ventures"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
