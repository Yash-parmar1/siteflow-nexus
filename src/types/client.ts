export interface Client {
  id: string;
  name: string;
  type: string;
  status: string;
  sites: number;
  totalUnits: number;
  monthlyRevenue: number;
  contractStart: string;
  contractEnd: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  outstandingAmount: number;
  paymentStatus: string;
  gstNumber: string;
  tradeName: string;
  notes: string;
  attachments?: File[];
}
