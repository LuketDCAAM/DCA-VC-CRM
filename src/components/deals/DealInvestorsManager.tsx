
import React, { useState } from 'react';
import { useDealInvestors } from '@/hooks/useDealInvestors';
import { useInvestors } from '@/hooks/useInvestors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

interface DealInvestorsManagerProps {
  deal: { id: string };
}

export function DealInvestorsManager({ deal }: DealInvestorsManagerProps) {
  const { linkedInvestors, loading: loadingLinked, linkInvestor, unlinkInvestor } = useDealInvestors(deal.id);
  const { investors: allInvestors, loading: loadingAll } = useInvestors();
  const [open, setOpen] = useState(false);

  const availableInvestors = allInvestors.filter(
    (inv) => !linkedInvestors.some((linkedInv) => linkedInv.id === inv.id)
  );
  
  const handleSelectInvestor = async (investorId: string) => {
    await linkInvestor(investorId);
    setOpen(false);
  };
  
  const handleUnlinkInvestor = async (investorId: string) => {
    await unlinkInvestor(investorId);
  };
  
  if (loadingLinked || loadingAll) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investors</CardTitle>
          <CardDescription>Manage investors associated with this deal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Investors</CardTitle>
            <CardDescription>Manage investors associated with this deal.</CardDescription>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
                Link an investor
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search investors..." />
                <CommandList>
                  <CommandEmpty>No available investors to link.</CommandEmpty>
                  <CommandGroup>
                    {availableInvestors.map((investor) => (
                      <CommandItem
                        key={investor.id}
                        value={investor.contact_name}
                        onSelect={() => handleSelectInvestor(investor.id)}
                      >
                        {investor.contact_name}
                        {investor.firm_name && <span className="text-xs text-muted-foreground ml-2">({investor.firm_name})</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {linkedInvestors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investors are linked to this deal yet.</p>
        ) : (
          <div className="space-y-2">
            {linkedInvestors.map((investor) => (
              <div key={investor.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{investor.contact_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{investor.contact_name}</p>
                    <p className="text-sm text-muted-foreground">{investor.firm_name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleUnlinkInvestor(investor.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
