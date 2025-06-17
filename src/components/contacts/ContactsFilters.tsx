
import { FilterOption } from '@/components/common/SearchAndFilter';

export const contactsFilterOptions: FilterOption[] = [
  {
    key: 'contact_type',
    label: 'Contact Type',
    value: 'contact_type',
    type: 'select',
    options: [
      { label: 'Deal Contacts', value: 'deal' },
      { label: 'Investor Contacts', value: 'investor' },
      { label: 'Portfolio Contacts', value: 'portfolio' },
      { label: 'General Contacts', value: 'general' },
    ]
  },
  {
    key: 'has_email',
    label: 'Has Email',
    value: 'has_email',
    type: 'select',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ]
  },
  {
    key: 'has_phone',
    label: 'Has Phone',
    value: 'has_phone',
    type: 'select',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ]
  },
  {
    key: 'created_at',
    label: 'Date Added',
    value: 'created_at',
    type: 'date'
  }
];
