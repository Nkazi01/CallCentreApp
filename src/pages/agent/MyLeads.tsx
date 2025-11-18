import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLeads } from '../../hooks/useLeads';
import { Lead } from '../../types/lead';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatDate, formatDateTime } from '../../utils/formatting';
import { SERVICES } from '../../utils/constants';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, Eye, Edit, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface BankDetails {
  bank_name: string;
  account_number: string;
  branch_code: string;
  account_type: string;
}

export default function MyLeads() {
  const { user } = useAuth();
  const { leads, updateLeadData, refreshLeads } = useLeads();
  const { showToast } = useToast();
  const location = useLocation();
  const searchQuery = (location.state as { searchQuery?: string } | null)?.searchQuery ?? '';
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState<Lead['status']>('New');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const agentLeads = useMemo(() => {
    return leads.filter((lead) => lead.capturedBy === user?.id);
  }, [leads, user]);

  const filteredLeads = useMemo(() => {
    return agentLeads.filter((lead) => {
      const matchesSearch =
        lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.idNumber.includes(searchTerm) ||
        lead.cellNumber.includes(searchTerm) ||
        lead.leadNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesService =
        serviceFilter === 'All' || lead.servicesInterested.includes(serviceFilter);
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [agentLeads, searchTerm, statusFilter, serviceFilter]);

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

  const handleAddNote = () => {
    if (!selectedLead || !newNote.trim() || !user) return;

    const updatedCallHistory = [
      ...selectedLead.callHistory,
      {
        id: Math.random().toString(36).substring(7),
        note: newNote,
        createdBy: user.username,
        createdAt: new Date().toISOString(),
      },
    ];

    updateLeadData(selectedLead.id, {
      callHistory: updatedCallHistory,
    });

    setNewNote('');
    showToast('Note added successfully', 'success');
    setSelectedLead({ ...selectedLead, callHistory: updatedCallHistory });
  };

  const handleUpdateStatus = async () => {
    if (!selectedLead) return;

    try {
      await updateLeadData(selectedLead.id, {
        status: newStatus,
        convertedAt: newStatus === 'Converted' ? new Date().toISOString() : undefined,
      });

      // Refresh leads to get updated data - this will trigger a re-render
      await refreshLeads();
      
      // Update selectedLead with new status immediately
      setSelectedLead({ ...selectedLead, status: newStatus, convertedAt: newStatus === 'Converted' ? new Date().toISOString() : selectedLead.convertedAt });

      showToast('Status updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">My Leads</h1>
        <p className="text-text-secondary">Manage and track all your captured leads.</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              placeholder="Search by name, ID, phone, or lead #"
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
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setServiceFilter('All');
              }}
              className="w-full"
            >
              Clear Filters
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Source</th>
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
                    <td className="py-3 px-4 text-sm text-text-secondary">{lead.source}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{formatDate(lead.createdAt)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewLead(lead)}
                        className="text-primary-cta hover:underline text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
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
        size="lg"
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
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-sm text-text-secondary">Status</p>
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
                <Button variant="primary" size="sm" onClick={handleUpdateStatus}>
                  Update Status
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
              <div className="space-y-3 mb-4">
                {selectedLead.callHistory.map((note) => (
                  <div key={note.id} className="bg-secondary-bg p-3 rounded-md">
                    <p className="text-sm text-text-primary">{note.note}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {formatDateTime(note.createdAt)} by {note.createdBy}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button variant="primary" onClick={handleAddNote} disabled={!newNote.trim()}>
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

