export interface Client {
  id: string;
  name: string;
  projects: number;

  status: string;
  sites: number;
  totalUnits: number;
  monthlyRevenue: number;
  contractStart: string;
  contractEnd: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  outstandingAmount: number;
  paymentStatus: string;
  gstNumber: string;
  tradeName: string;
  notes: string;
  attachments?: File[];
}
