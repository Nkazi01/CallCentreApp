export const SERVICES = [
  {
    id: 'judgement',
    name: 'JUDGEMENT',
    cost: 'R 4,500',
    requirements: [
      'Power of attorney',
      'Income and expenditure',
      'Creditors list',
      'Identity document',
      'Bank statement',
      'Proof of address'
    ]
  },
  {
    id: 'debt-review',
    name: 'DEBT REVIEW',
    cost: 'R 9,000',
    requirements: [
      'Power of attorney',
      'A letter from your debt counsellor',
      'Creditor\'s list',
      'Income and expenditure',
      'Identity document',
      'Bank statement',
      'Proof of address'
    ]
  },
  {
    id: 'default-adverse',
    name: 'DEFAULT/ADVERSE LISTING',
    cost: 'R 4,500',
    requirements: [
      'Power of attorney',
      'Income and expenditure',
      'Creditors list'
    ]
  },
  {
    id: 'admin-order',
    name: 'ADMIN ORDER',
    cost: 'R 9,000',
    requirements: [
      'If ordered by court, we will need a little front court',
      'Proof of address',
      'Bank statement',
      'Income and expenditure',
      'Identity document',
      'Creditors list'
    ]
  },
  {
    id: 'account-negotiations',
    name: 'ACCOUNT NEGOTIATIONS',
    cost: 'R 850 per creditor (if creditors are more than 3, it will cost R 3,200 only)',
    requirements: [
      'Power of attorney',
      'Income and expenditure',
      'Identity document',
      'Proof of address'
    ]
  },
  {
    id: 'assessment',
    name: 'ASSESSMENT',
    cost: 'R 350',
    requirements: [
      'Power of attorney',
      'Identity document',
      'Bank statement',
      'Proof of address'
    ]
  },
  {
    id: 'garnishment',
    name: 'GARNISHMENT',
    cost: 'R 7,000',
    requirements: [
      'Power of attorney',
      'Identity document',
      'Proof of address',
      'Income and expenditure',
      'Payslip',
      'Bank statement'
    ]
  },
  {
    id: 'updating-disputes',
    name: 'UPDATING/DISPUTES',
    cost: 'R 4,000',
    requirements: [
      'Power of attorney',
      'Identity Document',
      'Paid Up Letters',
      '17.W Form (Counsellor)'
    ],
    additionalNotes: 'Clearance Certificate included'
  }
] as const;

