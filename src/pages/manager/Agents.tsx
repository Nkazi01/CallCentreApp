import { useState, useEffect, useCallback } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { User } from '../../types/user';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Agents() {
  const [agents, setAgents] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    active: true,
  });
  const { leads } = useLeads();
  const { showToast } = useToast();

  const loadAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'agent')
      .order('full_name');

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load agents', error);
      showToast('Unable to load agents', 'error');
      return;
    }

    setAgents((data || []) as User[]);
  }, [showToast]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleOpenModal = (agent?: User) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        fullName: agent.fullName,
        username: agent.username,
        email: agent.email,
        password: '',
        active: agent.active,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!formData.fullName || !formData.username || !formData.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (editingAgent) {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          username: formData.username,
          email: formData.email,
          active: formData.active,
          password: formData.password || editingAgent.password,
        })
        .eq('id', editingAgent.id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to update agent', error);
        showToast('Failed to update agent', 'error');
        return;
      }

      showToast('Agent updated successfully', 'success');
    } else {
      // Create new agent
      if (!formData.password) {
        showToast('Password is required for new agents', 'error');
        return;
      }

      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .maybeSingle();

      if (existingError) {
        // eslint-disable-next-line no-console
        console.error('Failed to validate username', existingError);
      }

      if (existingUser) {
        showToast('Username already exists', 'error');
        return;
      }

      const { error } = await supabase.from('users').insert([
        {
          username: formData.username,
          password: formData.password,
          role: 'agent',
          full_name: formData.fullName,
          email: formData.email,
          active: formData.active,
        },
      ]);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to create agent', error);
        showToast('Failed to create agent', 'error');
        return;
      }

      showToast('Agent created successfully', 'success');
    }

    await loadAgents();
    setIsModalOpen(false);
  };

  const handleToggleActive = async (agent: User) => {
    const { error } = await supabase
      .from('users')
      .update({ active: !agent.active })
      .eq('id', agent.id);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update agent status', error);
      showToast('Failed to update agent status', 'error');
      return;
    }

    await loadAgents();
    showToast(`Agent ${agent.active ? 'deactivated' : 'activated'}`, 'success');
  };

  const getAgentStats = (agent: User) => {
    const agentLeads = leads.filter((l) => l.capturedBy === agent.username);
    const converted = agentLeads.filter((l) => l.status === 'Converted');
    return {
      totalLeads: agentLeads.length,
      converted: converted.length,
      conversionRate: agentLeads.length > 0 ? (converted.length / agentLeads.length) * 100 : 0,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Call Center Agents</h1>
          <p className="text-text-secondary">Manage agent accounts and view performance.</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add New Agent
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Agent Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Username</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Total Leads</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Conversion Rate</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const stats = getAgentStats(agent);
                return (
                  <tr key={agent.id} className="border-b border-border hover:bg-secondary-bg">
                    <td className="py-3 px-4 text-sm text-text-primary">{agent.fullName}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{agent.username}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{agent.email}</td>
                    <td className="py-3 px-4">
                      {agent.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">{stats.totalLeads}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {stats.conversionRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(agent)}
                          className="text-primary-cta hover:underline text-sm flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(agent)}
                          className="text-text-secondary hover:text-text-primary text-sm flex items-center gap-1"
                        >
                          {agent.active ? (
                            <>
                              <UserX className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Agent Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAgent ? 'Edit Agent' : 'Add New Agent'}
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={!!editingAgent}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label={editingAgent ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingAgent}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-primary-cta border-border rounded focus:ring-primary-cta"
            />
            <label htmlFor="active" className="ml-2 text-sm text-text-secondary">
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAgent}>
              {editingAgent ? 'Update' : 'Create'} Agent
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

