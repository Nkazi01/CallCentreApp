import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLeads } from '../../hooks/useLeads';
import { Lead } from '../../types/lead';
import { User } from '../../types/user';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatDate } from '../../utils/formatting';
import { SERVICES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Search, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface BankDetails {
  bank_name: string;
  account_number: string;
  branch_code: string;
  account_type: string;
}

export default function AllLeads() {
  const { leads, updateLeadData, deleteLead, refreshLeads } = useLeads();
  const { showToast } = useToast();
  const location = useLocation();
  const searchQuery = (location.state as { searchQuery?: string } | null)?.searchQuery ?? '';
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Lead['status']>('New');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [agents, setAgents] = useState<User[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

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

  const agentMap = useMemo(() => {
    const map: Record<string, User> = {};
    agents.forEach((agent) => {
      map[agent.id] = agent;
      map[agent.username] = agent;
    });
    return map;
  }, [agents]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const capturedId = agentMap[lead.capturedBy]?.id || lead.capturedBy;
      const assignedId = agentMap[lead.assignedTo ?? '']?.id || lead.assignedTo;
      const matchesSearch =
        lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.idNumber.includes(searchTerm) ||
        lead.cellNumber.includes(searchTerm) ||
        lead.leadNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesService =
        serviceFilter === 'All' || lead.servicesInterested.includes(serviceFilter);
      const matchesAgent =
        agentFilter === 'All' ||
        capturedId === agentFilter ||
        assignedId === agentFilter;
      return matchesSearch && matchesStatus && matchesService && matchesAgent;
    });
  }, [leads, searchTerm, statusFilter, serviceFilter, agentFilter]);

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

  const handleViewLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setNewAssignedTo(lead.assignedTo);
    setIsModalOpen(true);
    setLoadingBankDetails(true);
    
    // Fetch banking details
    const { data, error } = await supabase
      .from('bank_details')
      .select('bank_name, account_number, branch_code, account_type')
      .eq('lead_id', lead.id)
      .maybeSingle();
    
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch banking details', error);
    } else {
      setBankDetails(data);
    }
    setLoadingBankDetails(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedLead) return;

    try {
      await updateLeadData(selectedLead.id, {
        status: newStatus,
        convertedAt: newStatus === 'Converted' ? new Date().toISOString() : undefined,
      });

      // Refresh leads to get updated data
      await refreshLeads();
      
      // Update selectedLead with new status immediately
      setSelectedLead({ ...selectedLead, status: newStatus, convertedAt: newStatus === 'Converted' ? new Date().toISOString() : selectedLead.convertedAt });

      showToast('Status updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleReassign = async () => {
    if (!selectedLead || !newAssignedTo) return;

    try {
      await updateLeadData(selectedLead.id, {
        assignedTo: newAssignedTo,
      });

      // Refresh leads to get updated data
      await refreshLeads();
      
      // Update selectedLead with new assignment
      setSelectedLead({ ...selectedLead, assignedTo: newAssignedTo });

      showToast('Lead reassigned successfully', 'success');
    } catch (error) {
      showToast('Failed to reassign lead', 'error');
    }
  };

  const handleDeleteLead = () => {
    if (!selectedLead) return;
    if (confirm(`Are you sure you want to delete lead ${selectedLead.leadNumber}? This action cannot be undone.`)) {
      deleteLead(selectedLead.id);
      showToast('Lead deleted successfully', 'success');
      setIsModalOpen(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Lead #', 'Client Name', 'ID Number', 'Cell Number', 'Email', 'Status', 'Source', 'Services', 'Agent', 'Created'];
    const rows = filteredLeads.map((lead) => [
      lead.leadNumber,
      lead.fullName,
      lead.idNumber,
      lead.cellNumber,
      lead.email || '',
      lead.status,
      lead.source,
      lead.servicesInterested.join('; '),
      lead.capturedBy,
      formatDate(lead.createdAt),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Data exported to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">All Leads</h1>
          <p className="text-text-secondary">View and manage all leads from all agents.</p>
        </div>
        <Button variant="primary" onClick={exportToCSV}>
          Export to CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            label="Status"
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'New', label: 'New' },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Qualified', label: 'Qualified' },
              { value: 'Converted', label: 'Converted' },
              { value: 'Lost', label: 'Lost' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            label="Service"
            options={[
              { value: 'All', label: 'All Services' },
              ...SERVICES.map((s) => ({ value: s.id, label: s.name })),
            ]}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          />
          <Select
            label="Agent"
            options={[
              { value: 'All', label: 'All Agents' },
              ...agents.map((a) => ({ value: a.id, label: a.fullName })),
            ]}
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setServiceFilter('All');
                setAgentFilter('All');
              }}
              className="w-full"
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>No leads found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Lead #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Client Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Service(s)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Agent</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border hover:bg-secondary-bg">
                    <td className="py-3 px-4 text-sm text-text-primary font-medium">{lead.leadNumber}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{lead.fullName}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {lead.servicesInterested.slice(0, 2).join(', ')}
                      {lead.servicesInterested.length > 2 && '...'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(lead.status)}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {agentMap[lead.capturedBy]?.fullName || lead.capturedBy}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{formatDate(lead.createdAt)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewLead(lead)}
                        className="text-primary-cta hover:underline text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Lead Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBankDetails(null);
        }}
        title={selectedLead ? `Lead ${selectedLead.leadNumber}` : ''}
        size="xl"
      >
        {selectedLead && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Client Name</p>
                <p className="font-medium">{selectedLead.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">ID Number</p>
                <p className="font-medium">{selectedLead.idNumber}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Cell Number</p>
                <p className="font-medium">{selectedLead.cellNumber}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Email</p>
                <p className="font-medium">{selectedLead.email || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-text-secondary">Address</p>
                <p className="font-medium">{selectedLead.residentialAddress}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-text-secondary mb-2">Status</p>
                  <Select
                    options={[
                      { value: 'New', label: 'New' },
                      { value: 'Contacted', label: 'Contacted' },
                      { value: 'Qualified', label: 'Qualified' },
                      { value: 'Converted', label: 'Converted' },
                      { value: 'Lost', label: 'Lost' },
                    ]}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as Lead['status'])}
                  />
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-2">Reassign to Agent</p>
                  <Select
                    options={agents.map((a) => ({ value: a.username, label: a.fullName }))}
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleUpdateStatus}>
                  Update Status
                </Button>
                <Button variant="secondary" size="sm" onClick={handleReassign}>
                  Reassign Lead
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteLead}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-3">Banking Details</h3>
              {loadingBankDetails ? (
                <p className="text-sm text-text-secondary">Loading banking details...</p>
              ) : bankDetails ? (
                <div className="grid grid-cols-2 gap-4 bg-secondary-bg p-4 rounded-md">
                  <div>
                    <p className="text-sm text-text-secondary">Bank Name</p>
                    <p className="font-medium">{bankDetails.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Account Number</p>
                    <p className="font-medium">{bankDetails.account_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Branch Code</p>
                    <p className="font-medium">{bankDetails.branch_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Account Type</p>
                    <p className="font-medium">{bankDetails.account_type}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No banking details available</p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-3">Call History & Notes</h3>
              <div className="space-y-3">
                {selectedLead.callHistory.map((note) => (
                  <div key={note.id} className="bg-secondary-bg p-3 rounded-md">
                    <p className="text-sm text-text-primary">{note.note}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {formatDate(note.createdAt)} by {note.createdBy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

