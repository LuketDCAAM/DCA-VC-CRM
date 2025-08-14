
import { Globe, Mail, DollarSign, MapPin, Calendar, Star, Building, User, FileText } from 'lucide-react';

export interface TableColumn {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  width: string;
  sortable: boolean;
  visible: boolean;
  locked?: boolean; // For columns that shouldn't be hidden (like company name)
  dataType: 'string' | 'number' | 'date' | 'currency' | 'enum' | 'score';
}

export const DEFAULT_COLUMNS: TableColumn[] = [
  {
    key: 'company_name',
    label: 'Company',
    icon: Globe,
    width: 'min-w-[280px]',
    sortable: true,
    visible: true,
    locked: true,
    dataType: 'string'
  },
  {
    key: 'contact_name',
    label: 'Contact',
    icon: Mail,
    width: 'min-w-[200px]',
    sortable: true,
    visible: true,
    dataType: 'string'
  },
  {
    key: 'pipeline_stage',
    label: 'Pipeline Stage',
    width: 'min-w-[150px]',
    sortable: true,
    visible: true,
    dataType: 'enum'
  },
  {
    key: 'round_stage',
    label: 'Round Stage',
    width: 'min-w-[130px]',
    sortable: true,
    visible: true,
    dataType: 'enum'
  },
  {
    key: 'round_size',
    label: 'Round Size',
    icon: DollarSign,
    width: 'min-w-[120px]',
    sortable: true,
    visible: true,
    dataType: 'currency'
  },
  {
    key: 'location',
    label: 'Location',
    icon: MapPin,
    width: 'min-w-[130px]',
    sortable: true,
    visible: true,
    dataType: 'string'
  },
  {
    key: 'deal_score',
    label: 'Deal Score',
    icon: Star,
    width: 'min-w-[100px]',
    sortable: true,
    visible: true,
    dataType: 'score'
  },
  {
    key: 'deal_source',
    label: 'Source',
    width: 'min-w-[120px]',
    sortable: true,
    visible: true,
    dataType: 'string'
  },
  {
    key: 'created_at',
    label: 'Date Added',
    icon: Calendar,
    width: 'min-w-[120px]',
    sortable: true,
    visible: true,
    dataType: 'date'
  },
  {
    key: 'last_call_date',
    label: 'Last Call',
    icon: Calendar,
    width: 'min-w-[120px]',
    sortable: true,
    visible: true,
    dataType: 'date'
  },
  {
    key: 'post_money_valuation',
    label: 'Valuation',
    icon: DollarSign,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'currency'
  },
  {
    key: 'revenue',
    label: 'Revenue',
    icon: DollarSign,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'currency'
  },
  {
    key: 'sector',
    label: 'Sector',
    icon: Building,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'string'
  },
  {
    key: 'deal_lead',
    label: 'Deal Lead',
    icon: User,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'string'
  },
  {
    key: 'source_date',
    label: 'Source Date',
    icon: Calendar,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'date'
  },
  {
    key: 'description',
    label: 'Description',
    icon: FileText,
    width: 'min-w-[200px]',
    sortable: false,
    visible: false,
    dataType: 'string'
  }
];
