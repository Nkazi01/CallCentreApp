import { useState, useEffect, useCallback } from 'react';
import { Lead } from '../types/lead';
import { supabase } from '../lib/supabaseClient';

const leadSelect =
  `id,` +
  `leadNumber:lead_number,` +
  `fullName:full_name,` +
  `idNumber:id_number,` +
  `cellNumber:cell_number,` +
  `email,` +
  `residentialAddress:residential_address,` +
  `source,` +
  `servicesInterested:services_interested,` +
  `notes,` +
  `status,` +
  `priority,` +
  `capturedBy:captured_by,` +
  `assignedTo:assigned_to,` +
  `createdAt:created_at,` +
  `updatedAt:updated_at,` +
  `convertedAt:converted_at,` +
  `nextFollowUp:next_follow_up,` +
  `callHistory:call_history`;

async function getNextLeadNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .ilike('lead_number', `LEAD-${year}-%`);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to calculate next lead number', error);
    return `LEAD-${year}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  const nextNumber = ((count ?? 0) + 1).toString().padStart(4, '0');
  return `LEAD-${year}-${nextNumber}`;
}

function mapLeadToDb(lead: Partial<Lead>) {
  const mapped: Record<string, unknown> = {};

  if (lead.fullName !== undefined) mapped.full_name = lead.fullName;
  if (lead.idNumber !== undefined) mapped.id_number = lead.idNumber;
  if (lead.cellNumber !== undefined) mapped.cell_number = lead.cellNumber;
  if (lead.email !== undefined) mapped.email = lead.email;
  if (lead.residentialAddress !== undefined) mapped.residential_address = lead.residentialAddress;
  if (lead.source !== undefined) mapped.source = lead.source;
  if (lead.servicesInterested !== undefined) mapped.services_interested = lead.servicesInterested;
  if (lead.notes !== undefined) mapped.notes = lead.notes;
  if (lead.status !== undefined) mapped.status = lead.status;
  if (lead.priority !== undefined) mapped.priority = lead.priority;
  if (lead.capturedBy !== undefined) mapped.captured_by = lead.capturedBy;
  if (lead.assignedTo !== undefined) mapped.assigned_to = lead.assignedTo;
  if (lead.nextFollowUp !== undefined) mapped.next_follow_up = lead.nextFollowUp;
  if (lead.leadNumber !== undefined) mapped.lead_number = lead.leadNumber;
  if (lead.createdAt !== undefined) mapped.created_at = lead.createdAt;
  if (lead.updatedAt !== undefined) mapped.updated_at = lead.updatedAt;
  if (lead.convertedAt !== undefined) mapped.converted_at = lead.convertedAt;
  if (lead.callHistory !== undefined) mapped.call_history = lead.callHistory;

  return mapped;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('leads')
      .select(leadSelect)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError('Failed to load leads');
      // eslint-disable-next-line no-console
      console.error(queryError);
    } else {
      setLeads((data || []) as Lead[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const createLead = useCallback(
    async (leadData: Omit<Lead, 'id' | 'leadNumber' | 'createdAt' | 'updatedAt' | 'callHistory'>) => {
      const leadNumber = await getNextLeadNumber();
      const payload = {
        ...leadData,
        leadNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        callHistory: [],
      };

      const { data, error: insertError } = await supabase
        .from('leads')
        .insert([mapLeadToDb(payload)])
        .select(leadSelect)
        .single();

      if (insertError) {
        // eslint-disable-next-line no-console
        console.error('Failed to create lead', insertError);
        throw insertError;
      }

      await loadLeads();
      return data as Lead;
    },
    [loadLeads]
  );

  const updateLeadData = useCallback(
    async (leadId: string, updates: Partial<Lead>) => {
      const { error: updateError } = await supabase
        .from('leads')
        .update(
          mapLeadToDb({
            ...updates,
            updatedAt: new Date().toISOString(),
          })
        )
        .eq('id', leadId);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error('Failed to update lead', updateError);
        throw updateError;
      }

      await loadLeads();
    },
    [loadLeads]
  );

  const deleteLead = useCallback(
    async (leadId: string) => {
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (deleteError) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete lead', deleteError);
        throw deleteError;
      }

      await loadLeads();
    },
    [loadLeads]
  );

  return {
    leads,
    loading,
    error,
    createLead,
    updateLeadData,
    deleteLead,
    refreshLeads: loadLeads,
  };
}

