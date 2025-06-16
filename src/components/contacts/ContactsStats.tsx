
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Contact } from '@/types/contact';

interface ContactsStatsProps {
  contacts: Contact[];
}

export function ContactsStats({ contacts }: ContactsStatsProps) {
  const totalContacts = contacts.length;
  const dealContacts = contacts.filter(c => c.deal_id).length;
  const investorContacts = contacts.filter(c => c.investor_id).length;
  const portfolioContacts = contacts.filter(c => c.portfolio_company_id).length;
  const generalContacts = contacts.filter(c => !c.deal_id && !c.investor_id && !c.portfolio_company_id).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">{totalContacts}</div>
          <p className="text-sm text-gray-600">Total Contacts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{dealContacts}</div>
          <p className="text-sm text-gray-600">Deal Contacts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">{investorContacts}</div>
          <p className="text-sm text-gray-600">Investor Contacts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-teal-600">{portfolioContacts}</div>
          <p className="text-sm text-gray-600">Portfolio Contacts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-orange-600">{generalContacts}</div>
          <p className="text-sm text-gray-600">General Contacts</p>
        </CardContent>
      </Card>
    </div>
  );
}
