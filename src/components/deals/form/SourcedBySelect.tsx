import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSourcerProfiles } from '@/hooks/useSourcerProfiles';
import { useSourcedByValues } from '@/hooks/deals/useSourcedByValues';

const EXTERNAL = '__external__';
const TEXT_PREFIX = 'text:';
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
  // Names already stored in the deals.sourced_by column
  const columnValues = useSourcedByValues();

  const sourcedById: string | null = form.watch('sourced_by_id') ?? null;
  const sourcedByText: string = form.watch('sourced_by') ?? '';

  const profileNames = new Set(
    profiles.map(p => (p.name || p.email || '').trim().toLowerCase()).filter(Boolean)
  );
  const existingNames = columnValues
    .map(o => o.value)
    .filter(name => !profileNames.has(name.trim().toLowerCase()));

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
    if (value.startsWith(TEXT_PREFIX)) {
      setExternal(false);
      form.setValue('sourced_by_id', null, { shouldDirty: true });
      form.setValue('sourced_by', value.slice(TEXT_PREFIX.length), { shouldDirty: true });
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
              value={
                sourcedById ??
                (external
                  ? EXTERNAL
                  : sourcedByText && existingNames.includes(sourcedByText)
                    ? `${TEXT_PREFIX}${sourcedByText}`
                    : sourcedByText
                      ? EXTERNAL
                      : NONE)
              }
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
                {existingNames.map(name => (
                  <SelectItem key={name} value={`${TEXT_PREFIX}${name}`}>
                    {name}
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
