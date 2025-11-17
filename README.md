# IY Finance Solutions - Call Center Management System

A production-ready call center lead management system for IY Finance Solutions (Inqubeko Yezibusiso Pty Ltd), a licensed South African financial services provider (FSP 49179).

## Features

- **Role-Based Access Control**: Separate dashboards for agents and managers
- **Lead Management**: Complete CRUD operations for client leads
- **Form Validation**: Comprehensive validation including South African ID and cell number formats
- **Analytics & Reporting**: Manager dashboard with charts and performance metrics
- **Agent Management**: Create, edit, and manage agent accounts
- **Data Export**: Export leads to CSV format
- **Responsive Design**: Mobile-first design that works on all devices
- **LocalStorage Persistence**: Data persists across page refreshes

## Tech Stack

- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **React Hook Form** with Zod validation
- **Recharts** for data visualization
- **Lucide React** for icons
- **date-fns** for date handling
- **Vite** as build tool

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase project (URL + anon key) or Firebase/Supabase alternative

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

4. Copy `.env.example` to `.env` and add your Supabase (or Firebase) credentials:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=public-anon-key
```

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Default Login Credentials

### Agents
- Username: `agent1` | Password: `agent123`
- Username: `agent2` | Password: `agent123`
- Username: `agent3` | Password: `agent123`

### Manager
- Username: `manager` | Password: `manager123`

## Project Structure

```
src/
├── assets/          # Images and static assets
├── components/     # Reusable UI components
│   ├── common/     # Basic components (Button, Input, Card, etc.)
│   └── layout/      # Layout components (Header, Sidebar)
├── context/        # React Context providers
├── data/           # Sample data and constants
├── hooks/          # Custom React hooks
├── pages/          # Page components
│   ├── agent/      # Agent-specific pages
│   └── manager/    # Manager-specific pages
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Key Features

### Agent Features
- Capture new leads with comprehensive validation
- View and manage own leads only
- Update lead status and add notes
- View service information and pricing
- Dashboard with personal statistics

### Manager Features
- View all leads from all agents
- Agent performance analytics
- Reassign leads between agents
- Create and manage agent accounts
- Export data to CSV
- Comprehensive reports and analytics
- Advanced filtering and search

## Brand Colors

The application uses IY Finance Solutions brand colors:
- **Header/Nav**: #0D4D3D (Deep teal-green)
- **Primary CTA**: #708238 (Olive green)
- **Logo Accent**: #7CB342 (Bright green)
- **Success**: #4CAF50 (Green)

## Services

The system includes 8 financial services:
1. JUDGEMENT (R 4,500)
2. DEBT REVIEW (R 9,000)
3. DEFAULT/ADVERSE LISTING (R 4,500)
4. ADMIN ORDER (R 9,000)
5. ACCOUNT NEGOTIATIONS (R 850 per creditor)
6. ASSESSMENT (R 350)
7. GARNISHMENT (R 7,000)
8. UPDATING/DISPUTES (R 4,000)

## Data Storage

The app now uses Supabase (or any Firebase-compatible backend) through the shared data layer. Replace the environment values with your actual project credentials to switch environments instantly.

## Validation Rules

### South African ID Number
- Must be exactly 13 digits
- Validates date format (YYMMDD)
- Includes Luhn algorithm checksum validation

### Cell Number
- Must be 10 digits
- Must start with 0
- Auto-formats as: 000 000 0000

## Future Enhancements

- Backend API integration
- Database storage
- Email/SMS notifications
- Advanced reporting with PDF export
- Dark mode toggle
- Audit logging
- POPIA compliance features
- Multi-language support

## License

Proprietary - IY Finance Solutions

## Support

For issues or questions, please contact the development team.

