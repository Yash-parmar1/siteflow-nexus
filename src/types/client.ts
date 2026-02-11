export interface Client {
  id: string;
  name: string;
  tradeName?: string;
  projects: number;

  status: string;
  sites: number;
  totalUnits: number;
  monthlyRevenue: number;
  contractStart: string;
  contractEnd: string;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  outstandingAmount: number;
  paymentStatus: string;
  gstNumber?: string;
  notes?: string;
  attachments?: File[];
  isActive?: boolean;
}
