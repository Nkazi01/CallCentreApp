import { useState, useMemo, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { User } from '../../types/user';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { formatDate } from '../../utils/formatting';
import { SERVICES } from '../../utils/constants';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Reports() {
  const { leads } = useLeads();
  const [agents, setAgents] = useState<User[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .eq('role', 'agent')
      .then(({ data, error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load agents', error);
          return;
        }
        setAgents((data || []) as User[]);
      });
  }, []);

  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      if (dateRange === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (dateRange === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      }
      filtered = filtered.filter((lead) => new Date(lead.createdAt) >= filterDate);
    }

    // Agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.capturedBy === agentFilter);
    }

    // Service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.servicesInterested.includes(serviceFilter));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    return filtered;
  }, [leads, dateRange, agentFilter, serviceFilter, statusFilter]);

  const conversionReport = useMemo(() => {
    const byAgent = agents.map((agent) => {
      const agentLeads = filteredLeads.filter((l) => l.capturedBy === agent.username);
      const converted = agentLeads.filter((l) => l.status === 'Converted');
      return {
        name: agent.fullName,
        total: agentLeads.length,
        converted: converted.length,
        rate: agentLeads.length > 0 ? (converted.length / agentLeads.length) * 100 : 0,
      };
    });

    const byService = SERVICES.map((service) => {
      const serviceLeads = filteredLeads.filter((l) => l.servicesInterested.includes(service.id));
      const converted = serviceLeads.filter((l) => l.status === 'Converted');
      return {
        name: service.name,
        total: serviceLeads.length,
        converted: converted.length,
        rate: serviceLeads.length > 0 ? (converted.length / serviceLeads.length) * 100 : 0,
      };
    });

    return { byAgent, byService };
  }, [filteredLeads, agents]);

  const revenueReport = useMemo(() => {
    const convertedLeads = filteredLeads.filter((l) => l.status === 'Converted');
    const byService: Record<string, number> = {};

    convertedLeads.forEach((lead) => {
      lead.servicesInterested.forEach((serviceId) => {
        const service = SERVICES.find((s) => s.id === serviceId);
        if (service) {
          const match = service.cost.match(/R\s*([\d,]+)/);
          if (match) {
            const amount = parseInt(match[1].replace(/,/g, ''));
            byService[service.name] = (byService[service.name] || 0) + amount;
          }
        }
      });
    });

    return Object.entries(byService).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const sourceAnalysis = useMemo(() => {
    const sourceCounts: Record<string, { total: number; converted: number }> = {};
    filteredLeads.forEach((lead) => {
      if (!sourceCounts[lead.source]) {
        sourceCounts[lead.source] = { total: 0, converted: 0 };
      }
      sourceCounts[lead.source].total++;
      if (lead.status === 'Converted') {
        sourceCounts[lead.source].converted++;
      }
    });

    return Object.entries(sourceCounts).map(([name, data]) => ({
      name,
      total: data.total,
      converted: data.converted,
      rate: data.total > 0 ? (data.converted / data.total) * 100 : 0,
    }));
  }, [filteredLeads]);

  const COLORS = ['#708238', '#7CB342', '#4CAF50', '#2196F3', '#FF9800', '#F44336'];

  const exportReport = () => {
    const reportData = {
      dateRange,
      agentFilter,
      serviceFilter,
      statusFilter,
      totalLeads: filteredLeads.length,
      convertedLeads: filteredLeads.filter((l) => l.status === 'Converted').length,
      conversionReport,
      revenueReport,
      sourceAnalysis,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Reports & Analytics</h1>
          <p className="text-text-secondary">Generate detailed reports and analyze performance.</p>
        </div>
        <Button variant="primary" onClick={exportReport}>
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Date Range"
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'month', label: 'Last Month' },
              { value: 'week', label: 'Last Week' },
              { value: 'today', label: 'Today' },
            ]}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          />
          <Select
            label="Agent"
            options={[
              { value: 'all', label: 'All Agents' },
              ...agents.map((a) => ({ value: a.username, label: a.fullName })),
            ]}
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          />
          <Select
            label="Service"
            options={[
              { value: 'all', label: 'All Services' },
              ...SERVICES.map((s) => ({ value: s.id, label: s.name })),
            ]}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          />
          <Select
            label="Status"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'New', label: 'New' },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Qualified', label: 'Qualified' },
              { value: 'Converted', label: 'Converted' },
              { value: 'Lost', label: 'Lost' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Leads</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{filteredLeads.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Converted</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {filteredLeads.filter((l) => l.status === 'Converted').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Conversion Rate</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {filteredLeads.length > 0
              ? ((filteredLeads.filter((l) => l.status === 'Converted').length / filteredLeads.length) * 100).toFixed(1)
              : 0}
            %
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Estimated Revenue</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            R {revenueReport.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-ZA')}
          </p>
        </Card>
      </div>

      {/* Conversion Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Conversion by Agent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionReport.byAgent}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#708238" name="Total Leads" />
              <Bar dataKey="converted" fill="#4CAF50" name="Converted" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Conversion by Service</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionReport.byService}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#708238" name="Total Leads" />
              <Bar dataKey="converted" fill="#4CAF50" name="Converted" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Revenue & Source Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Revenue by Service</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueReport}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: R${value.toLocaleString('en-ZA')}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueReport.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Source Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourceAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#708238" name="Total Leads" />
              <Bar dataKey="converted" fill="#4CAF50" name="Converted" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

