import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Phone, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLeads } from '../../hooks/useLeads';
import { Lead } from '../../types/lead';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatting';
import { isDateInMonth } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

export default function AgentDashboard() {
  const { user } = useAuth();
  const { leads, loading } = useLeads();
  const navigate = useNavigate();
  const [agentLeads, setAgentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (user) {
      const filtered = leads.filter((lead) => lead.capturedBy === user.id);
      setAgentLeads(filtered);
    }
  }, [leads, user]);

  const thisMonthLeads = agentLeads.filter((lead) => isDateInMonth(lead.createdAt));
  const newLeads = agentLeads.filter((lead) => lead.status === 'New');
  const contactedLeads = agentLeads.filter((lead) => lead.status === 'Contacted');
  const convertedLeads = agentLeads.filter((lead) => lead.status === 'Converted');
  const recentLeads = agentLeads
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const getStatusBadge = (status: Lead['status']) => {
    const variants: Record<Lead['status'], 'success' | 'progress' | 'warning' | 'error' | 'neutral'> = {
      New: 'neutral',
      Contacted: 'progress',
      Qualified: 'warning',
      Converted: 'success',
      Lost: 'error',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-text-secondary">Here's an overview of your leads and performance.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Leads (This Month)</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{thisMonthLeads.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-cta/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-cta" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">New Leads</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{newLeads.length}</p>
            </div>
            <div className="w-12 h-12 bg-status-neutral/10 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-status-neutral" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Contacted</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{contactedLeads.length}</p>
            </div>
            <div className="w-12 h-12 bg-status-progress/10 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-status-progress" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Converted</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{convertedLeads.length}</p>
            </div>
            <div className="w-12 h-12 bg-status-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-status-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/agent/capture-lead')}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Capture New Lead
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/agent/leads')}
        >
          View All My Leads
        </Button>
      </div>

      {/* Recent Leads */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Leads</h2>
        {recentLeads.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <p>No leads captured yet.</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/agent/capture-lead')}
            >
              Capture Your First Lead
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Lead #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Client Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border hover:bg-secondary-bg">
                    <td className="py-3 px-4 text-sm text-text-primary">{lead.leadNumber}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{lead.fullName}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {lead.servicesInterested[0] || 'N/A'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(lead.status)}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{formatDate(lead.createdAt)}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/agent/leads/${lead.id}`}
                        className="text-primary-cta hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

