import { useEffect, useMemo, useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Lead } from '../../types/lead';
import { User } from '../../types/user';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatting';
import { isDateInMonth } from '../../utils/dateUtils';
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
import { supabase } from '../../lib/supabaseClient';

export default function ManagerDashboard() {
  const { leads, loading } = useLeads();
  const [agents, setAgents] = useState<User[]>([]);

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .eq('role', 'agent')
      .eq('active', true)
      .then(({ data, error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch agents', error);
          return;
        }
        setAgents((data || []) as User[]);
      });
  }, []);

  const thisMonthLeads = leads.filter((lead) => isDateInMonth(lead.createdAt));
  const convertedLeads = leads.filter((lead) => lead.status === 'Converted');
  const conversionRate = leads.length > 0 ? (convertedLeads.length / leads.length) * 100 : 0;

  // Status distribution
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Converted: 0,
      Lost: 0,
    };
    leads.forEach((lead) => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Service distribution
  const serviceData = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    leads.forEach((lead) => {
      lead.servicesInterested.forEach((serviceId) => {
        serviceCounts[serviceId] = (serviceCounts[serviceId] || 0) + 1;
      });
    });
    return Object.entries(serviceCounts).map(([id, value]) => {
      const service = SERVICES.find((s) => s.id === id);
      return { name: service?.name || id, value };
    });
  }, [leads]);

  // Source distribution
  const sourceData = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    leads.forEach((lead) => {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    });
    return Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Agent performance
  const agentPerformance = useMemo(() => {
    return agents.map((agent) => {
      const agentLeads = leads.filter((l) => l.capturedBy === agent.username);
      const converted = agentLeads.filter((l) => l.status === 'Converted');
      return {
        name: agent.fullName,
        leads: agentLeads.length,
        converted: converted.length,
        conversionRate: agentLeads.length > 0 ? (converted.length / agentLeads.length) * 100 : 0,
      };
    });
  }, [leads, agents]);

  const COLORS = ['#708238', '#7CB342', '#4CAF50', '#2196F3', '#FF9800'];

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Manager Dashboard</h1>
        <p className="text-text-secondary">Overview of call center performance and analytics.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Leads</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{leads.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">This Month</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{thisMonthLeads.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Conversion Rate</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{conversionRate.toFixed(1)}%</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Active Agents</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{agents.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Converted</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{convertedLeads.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">New Leads</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {leads.filter((l) => l.status === 'New').length}
          </p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Lead Status Pipeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#708238" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Leads by Service</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Leads by Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#7CB342" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#708238" name="Total Leads" />
              <Bar dataKey="converted" fill="#4CAF50" name="Converted" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Agent Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Agent Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Leads Captured</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Converted</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Conversion Rate</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {agentPerformance.map((agent, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-secondary-bg">
                  <td className="py-3 px-4 text-sm text-text-primary">{agent.name}</td>
                  <td className="py-3 px-4 text-sm text-text-primary">{agent.leads}</td>
                  <td className="py-3 px-4 text-sm text-text-primary">{agent.converted}</td>
                  <td className="py-3 px-4 text-sm text-text-primary">{agent.conversionRate.toFixed(1)}%</td>
                  <td className="py-3 px-4">
                    <Badge variant="success">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

