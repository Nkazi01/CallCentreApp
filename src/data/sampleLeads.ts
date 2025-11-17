import { Lead } from '../types/lead';

export const sampleLeads: Lead[] = [
  {
    id: '1',
    leadNumber: 'LEAD-2024-0001',
    fullName: 'Mandla Sibiya',
    idNumber: '8503155800083',
    cellNumber: '0824567890',
    email: 'mandla@example.com',
    residentialAddress: '45 Main Road, Sandton, 2196',
    source: 'Phone Call',
    servicesInterested: ['judgement', 'debt-review'],
    notes: 'Client called regarding debt review process. Very interested.',
    status: 'Contacted',
    priority: 'High',
    capturedBy: 'agent1',
    assignedTo: 'agent1',
    createdAt: '2024-10-15T09:30:00Z',
    updatedAt: '2024-10-15T10:15:00Z',
    nextFollowUp: '2024-10-20T09:00:00Z',
    callHistory: [
      {
        id: '1',
        note: 'Initial contact made. Client provided all required documents.',
        createdBy: 'agent1',
        createdAt: '2024-10-15T10:15:00Z'
      }
    ]
  },
  {
    id: '2',
    leadNumber: 'LEAD-2024-0002',
    fullName: 'Lindiwe Mthembu',
    idNumber: '9205204800085',
    cellNumber: '0831234567',
    email: 'lindiwe@example.com',
    residentialAddress: '12 Oak Street, Pretoria, 0001',
    source: 'Walk-in',
    servicesInterested: ['default-adverse'],
    notes: 'Walk-in client. Needs urgent help with credit listing.',
    status: 'Qualified',
    priority: 'High',
    capturedBy: 'agent2',
    assignedTo: 'agent2',
    createdAt: '2024-10-18T14:20:00Z',
    updatedAt: '2024-10-19T11:30:00Z',
    callHistory: [
      {
        id: '2',
        note: 'Client visited office. Documents reviewed and verified.',
        createdBy: 'agent2',
        createdAt: '2024-10-18T14:20:00Z'
      },
      {
        id: '3',
        note: 'Follow-up call completed. Client ready to proceed.',
        createdBy: 'agent2',
        createdAt: '2024-10-19T11:30:00Z'
      }
    ]
  },
  {
    id: '3',
    leadNumber: 'LEAD-2024-0003',
    fullName: 'Sipho Nkosi',
    idNumber: '8807105800087',
    cellNumber: '0849876543',
    email: 'sipho.nkosi@example.com',
    residentialAddress: '78 Park Avenue, Durban, 4001',
    source: 'Referral',
    servicesInterested: ['garnishment'],
    status: 'New',
    priority: 'Medium',
    capturedBy: 'agent1',
    assignedTo: 'agent1',
    createdAt: '2024-10-20T08:45:00Z',
    updatedAt: '2024-10-20T08:45:00Z',
    callHistory: []
  },
  {
    id: '4',
    leadNumber: 'LEAD-2024-0004',
    fullName: 'Nomsa Dlamini',
    idNumber: '9102254800089',
    cellNumber: '0712345678',
    email: 'nomsa.d@example.com',
    residentialAddress: '23 High Street, Cape Town, 8001',
    source: 'Marketing',
    servicesInterested: ['assessment', 'account-negotiations'],
    notes: 'Found us through online marketing. Interested in multiple services.',
    status: 'Contacted',
    priority: 'Medium',
    capturedBy: 'agent3',
    assignedTo: 'agent3',
    createdAt: '2024-10-22T10:00:00Z',
    updatedAt: '2024-10-22T15:30:00Z',
    nextFollowUp: '2024-10-25T10:00:00Z',
    callHistory: [
      {
        id: '4',
        note: 'Initial call made. Explained services and pricing.',
        createdBy: 'agent3',
        createdAt: '2024-10-22T15:30:00Z'
      }
    ]
  },
  {
    id: '5',
    leadNumber: 'LEAD-2024-0005',
    fullName: 'Thabo Mkhize',
    idNumber: '8604155800091',
    cellNumber: '0823456789',
    email: 'thabo.m@example.com',
    residentialAddress: '56 River Road, Johannesburg, 2000',
    source: 'Phone Call',
    servicesInterested: ['admin-order'],
    status: 'Converted',
    priority: 'High',
    capturedBy: 'agent2',
    assignedTo: 'agent2',
    createdAt: '2024-09-28T11:00:00Z',
    updatedAt: '2024-10-10T14:00:00Z',
    convertedAt: '2024-10-10T14:00:00Z',
    callHistory: [
      {
        id: '5',
        note: 'Client signed agreement. Payment received.',
        createdBy: 'agent2',
        createdAt: '2024-10-10T14:00:00Z'
      }
    ]
  },
  {
    id: '6',
    leadNumber: 'LEAD-2024-0006',
    fullName: 'Zanele Khumalo',
    idNumber: '9306304800093',
    cellNumber: '0834567890',
    email: 'zanele.k@example.com',
    residentialAddress: '89 Mountain View, Bloemfontein, 9301',
    source: 'Referral',
    servicesInterested: ['updating-disputes'],
    status: 'Lost',
    priority: 'Low',
    capturedBy: 'agent1',
    assignedTo: 'agent1',
    createdAt: '2024-09-15T09:00:00Z',
    updatedAt: '2024-09-25T16:00:00Z',
    callHistory: [
      {
        id: '6',
        note: 'Client decided to go with another provider.',
        createdBy: 'agent1',
        createdAt: '2024-09-25T16:00:00Z'
      }
    ]
  },
  {
    id: '7',
    leadNumber: 'LEAD-2024-0007',
    fullName: 'Bongani Ndlovu',
    idNumber: '8705205800095',
    cellNumber: '0721234567',
    email: 'bongani@example.com',
    residentialAddress: '34 Beach Road, Port Elizabeth, 6001',
    source: 'Walk-in',
    servicesInterested: ['judgement'],
    notes: 'Urgent case. Court date approaching.',
    status: 'Qualified',
    priority: 'High',
    capturedBy: 'agent3',
    assignedTo: 'agent3',
    createdAt: '2024-10-19T13:15:00Z',
    updatedAt: '2024-10-20T09:00:00Z',
    nextFollowUp: '2024-10-22T09:00:00Z',
    callHistory: [
      {
        id: '7',
        note: 'Client visited. Documents collected. Processing started.',
        createdBy: 'agent3',
        createdAt: '2024-10-19T13:15:00Z'
      }
    ]
  },
  {
    id: '8',
    leadNumber: 'LEAD-2024-0008',
    fullName: 'Ntombi Zulu',
    idNumber: '9008154800097',
    cellNumber: '0812345678',
    email: 'ntombi.z@example.com',
    residentialAddress: '67 Garden Street, East London, 5201',
    source: 'Phone Call',
    servicesInterested: ['debt-review', 'default-adverse'],
    status: 'New',
    priority: 'Medium',
    capturedBy: 'agent2',
    assignedTo: 'agent2',
    createdAt: '2024-10-21T10:30:00Z',
    updatedAt: '2024-10-21T10:30:00Z',
    callHistory: []
  },
  {
    id: '9',
    leadNumber: 'LEAD-2024-0009',
    fullName: 'Sibusiso Mthembu',
    idNumber: '8912255800099',
    cellNumber: '0845678901',
    email: 'sibusiso@example.com',
    residentialAddress: '12 Main Street, Polokwane, 0700',
    source: 'Marketing',
    servicesInterested: ['garnishment'],
    status: 'Contacted',
    priority: 'Medium',
    capturedBy: 'agent1',
    assignedTo: 'agent1',
    createdAt: '2024-10-20T14:00:00Z',
    updatedAt: '2024-10-21T11:00:00Z',
    nextFollowUp: '2024-10-24T10:00:00Z',
    callHistory: [
      {
        id: '8',
        note: 'Initial contact. Explained garnishment process.',
        createdBy: 'agent1',
        createdAt: '2024-10-21T11:00:00Z'
      }
    ]
  },
  {
    id: '10',
    leadNumber: 'LEAD-2024-0010',
    fullName: 'Phumzile Dlamini',
    idNumber: '9204104800101',
    cellNumber: '0734567890',
    email: 'phumzile@example.com',
    residentialAddress: '45 Church Street, Nelspruit, 1200',
    source: 'Referral',
    servicesInterested: ['assessment'],
    status: 'Converted',
    priority: 'Low',
    capturedBy: 'agent3',
    assignedTo: 'agent3',
    createdAt: '2024-10-05T09:00:00Z',
    updatedAt: '2024-10-12T15:00:00Z',
    convertedAt: '2024-10-12T15:00:00Z',
    callHistory: [
      {
        id: '9',
        note: 'Assessment completed. Client satisfied with service.',
        createdBy: 'agent3',
        createdAt: '2024-10-12T15:00:00Z'
      }
    ]
  }
];

