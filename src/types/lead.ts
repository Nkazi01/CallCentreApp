export interface CallNote {
  id: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Lead {
  id: string; // UUID
  leadNumber: string; // Auto-generated: "LEAD-2024-0001"
  
  // Personal Information
  fullName: string;
  idNumber: string; // 13 digits, SA format
  cellNumber: string;
  email?: string;
  residentialAddress: string;
  
  // Lead Details
  source: 'Walk-in' | 'Phone Call' | 'Referral' | 'Marketing';
  servicesInterested: string[]; // Multiple services possible
  notes?: string;
  
  // Status & Tracking
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  priority: 'Low' | 'Medium' | 'High';
  
  // Agent & Timeline
  capturedBy: string; // User UUID
  assignedTo: string; // User UUID
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  convertedAt?: string;
  
  // Follow-up
  nextFollowUp?: string; // ISO date
  callHistory: CallNote[];
}

