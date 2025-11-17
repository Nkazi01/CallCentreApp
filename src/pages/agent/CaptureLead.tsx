import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLeads } from '../../hooks/useLeads';
import { SERVICES } from '../../utils/constants';
import { validateSAID, validateSACellNumber, formatCellNumber } from '../../utils/validation';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const leadSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters').regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  idNumber: z.string().refine((val) => validateSAID(val), 'Invalid South African ID number'),
  cellNumber: z.string().refine((val) => validateSACellNumber(val.replace(/[\s-]/g, '')), 'Invalid cell number (must be 10 digits starting with 0)'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  residentialAddress: z.string().min(10, 'Address must be at least 10 characters'),
  source: z.enum(['Walk-in', 'Phone Call', 'Referral', 'Marketing']),
  servicesInterested: z.array(z.string()).min(1, 'Please select at least one service'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  nextFollowUp: z.string().optional(),
  bankName: z.string().min(3, 'Bank name must be at least 3 characters'),
  accountNumber: z.string().min(6, 'Account number must be at least 6 digits'),
  branchCode: z.string().min(3, 'Branch code must be at least 3 characters'),
  accountType: z.enum(['Savings', 'Cheque', 'Transmission', 'Business', 'Other']),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function CaptureLead() {
  const { user } = useAuth();
  const { createLead } = useLeads();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    trigger,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      priority: 'Medium',
      servicesInterested: [],
      accountType: 'Savings',
    },
  });

  const selectedServices = watch('servicesInterested') || [];
  const cellNumber = watch('cellNumber');

  // Format cell number as user types
  const handleCellNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[\s-]/g, '');
    if (value.length <= 10 && /^[0-9]*$/.test(value)) {
      const formatted = formatCellNumber(value);
      setValue('cellNumber', formatted, { shouldValidate: true });
    }
  };

  const toggleService = (serviceId: string) => {
    const current = selectedServices;
    if (current.includes(serviceId)) {
      setValue('servicesInterested', current.filter((id) => id !== serviceId), { shouldValidate: true });
    } else {
      setValue('servicesInterested', [...current, serviceId], { shouldValidate: true });
    }
  };

  const toggleServiceDetails = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const stepOneFields: (keyof LeadFormData)[] = [
    'fullName',
    'idNumber',
    'cellNumber',
    'email',
    'residentialAddress',
    'source',
    'servicesInterested',
    'notes',
    'priority',
    'nextFollowUp',
  ];

  const handleNextStep = async () => {
    const valid = await trigger(stepOneFields);
    if (valid) {
      setCurrentStep(2);
    } else {
      showToast('Please fix the errors before continuing.', 'error');
    }
  };

  const calculateTotalCost = () => {
    // Simple calculation - in real app, would need more sophisticated parsing
    let total = 0;
    selectedServices.forEach((serviceId) => {
      const service = SERVICES.find((s) => s.id === serviceId);
      if (service) {
        const match = service.cost.match(/R\s*([\d,]+)/);
        if (match) {
          total += parseInt(match[1].replace(/,/g, ''));
        }
      }
    });
    return total;
  };

  const onSubmit = async (data: LeadFormData) => {
    if (!user) return;

    try {
      const newLead = await createLead({
        fullName: data.fullName,
        idNumber: data.idNumber,
        cellNumber: data.cellNumber.replace(/[\s-]/g, ''),
        email: data.email || undefined,
        residentialAddress: data.residentialAddress,
        source: data.source,
        servicesInterested: data.servicesInterested,
        notes: data.notes,
        status: 'New',
        priority: data.priority,
        capturedBy: user.id,
        assignedTo: user.id,
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp).toISOString() : undefined,
      });

      const { error: bankError } = await supabase.from('bank_details')
        .upsert({
          lead_id: newLead.id,
          bank_name: data.bankName,
          account_number: data.accountNumber,
          branch_code: data.branchCode,
          account_type: data.accountType,
          captured_by: newLead.capturedBy,
        }, { onConflict: 'lead_id' });

      if (bankError) {
        // eslint-disable-next-line no-console
        console.error('Failed to save banking details', bankError);
        showToast('Lead saved, but banking details failed. Please update later.', 'warning');
      } else {
        showToast(`Lead ${newLead.leadNumber} captured successfully!`, 'success');
      }

      navigate('/agent/leads');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      showToast('Failed to capture lead. Please try again.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Capture New Lead</h1>
        <p className="text-text-secondary">Fill in the client information below to create a new lead.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`px-3 py-1 rounded-full ${currentStep === 1 ? 'bg-primary-cta text-white' : 'bg-secondary-bg text-text-primary'}`}>Step 1: Lead Details</span>
          <span className="text-text-secondary">→</span>
          <span className={`px-3 py-1 rounded-full ${currentStep === 2 ? 'bg-primary-cta text-white' : 'bg-secondary-bg text-text-primary'}`}>Step 2: Banking Details</span>
        </div>

        {currentStep === 1 && (
        <>
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name and Surname"
              placeholder="e.g., Thabo Mkhize"
              {...register('fullName')}
              error={errors.fullName?.message}
            />
            <Input
              label="ID Number"
              placeholder="e.g., 9012015800083"
              maxLength={13}
              {...register('idNumber')}
              error={errors.idNumber?.message}
              helperText="13-digit South African ID number"
            />
            <Input
              label="Cell Number"
              placeholder="e.g., 0821234567"
              maxLength={12}
              value={cellNumber || ''}
              onChange={handleCellNumberChange}
              error={errors.cellNumber?.message}
              helperText="10 digits starting with 0"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g., thabo@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Residential Address"
              placeholder="e.g., 123 Main Street, Johannesburg, 2000"
              rows={3}
              {...register('residentialAddress')}
              error={errors.residentialAddress?.message}
            />
          </div>
        </Card>

        {/* Lead Details */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Lead Details</h2>
          <div className="space-y-4">
            <Select
              label="Source"
              options={[
                { value: 'Walk-in', label: 'Walk-in' },
                { value: 'Phone Call', label: 'Phone Call' },
                { value: 'Referral', label: 'Referral' },
                { value: 'Marketing', label: 'Marketing' },
              ]}
              placeholder="Select source"
              {...register('source')}
              error={errors.source?.message}
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Services Interested <span className="text-status-error">*</span>
              </label>
              {errors.servicesInterested && (
                <p className="text-sm text-status-error mb-2">{errors.servicesInterested.message}</p>
              )}
              <div className="space-y-2">
                {SERVICES.map((service) => (
                  <div key={service.id} className="border border-border rounded-md p-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="mt-1 w-4 h-4 text-primary-cta border-border rounded focus:ring-primary-cta"
                      />
                      <div className="flex-1">
                        <label htmlFor={service.id} className="font-medium text-text-primary cursor-pointer">
                          {service.name} - <span className="text-primary-cta">{service.cost}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleServiceDetails(service.id)}
                          className="ml-2 text-primary-cta text-sm hover:underline flex items-center gap-1"
                        >
                          {expandedServices.has(service.id) ? (
                            <>
                              Hide Details <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Show Requirements <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        {expandedServices.has(service.id) && (
                          <div className="mt-2 ml-6">
                            <p className="text-sm font-medium text-text-secondary mb-1">Requirements:</p>
                            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                              {service.requirements.map((req, idx) => (
                                <li key={idx}>{req}</li>
                              ))}
                            </ul>
                            {service.additionalNotes && (
                              <p className="text-sm text-primary-cta mt-2 font-medium">
                                Note: {service.additionalNotes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedServices.length > 0 && (
                <div className="mt-4 p-3 bg-primary-cta/10 rounded-md">
                  <p className="text-sm font-medium text-text-primary">
                    Total Estimated Cost: <span className="text-primary-cta text-lg">R {calculateTotalCost().toLocaleString('en-ZA')}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Notes & Priority */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Notes & Priority</h2>
          <div className="space-y-4">
            <Textarea
              label="Notes"
              placeholder="Any additional information, client concerns, or follow-up requirements..."
              rows={4}
              maxLength={500}
              {...register('notes')}
              error={errors.notes?.message}
              helperText={`${watch('notes')?.length || 0}/500 characters`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Priority"
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                ]}
                {...register('priority')}
                error={errors.priority?.message}
              />
              <Input
                label="Next Follow-up Date"
                type="date"
                {...register('nextFollowUp')}
                error={errors.nextFollowUp?.message}
              />
            </div>
          </div>
        </Card>
        </>
        )}

        {currentStep === 2 && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Banking Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              placeholder="e.g., First National Bank"
              {...register('bankName')}
              error={errors.bankName?.message}
            />
            <Input
              label="Account Number"
              placeholder="e.g., 1234567890"
              {...register('accountNumber')}
              error={errors.accountNumber?.message}
            />
            <Input
              label="Branch Code"
              placeholder="e.g., 250655"
              {...register('branchCode')}
              error={errors.branchCode?.message}
            />
            <Select
              label="Account Type"
              options={[
                { value: 'Savings', label: 'Savings' },
                { value: 'Cheque', label: 'Cheque / Current' },
                { value: 'Transmission', label: 'Transmission' },
                { value: 'Business', label: 'Business' },
                { value: 'Other', label: 'Other' },
              ]}
              {...register('accountType')}
              error={errors.accountType?.message}
            />
          </div>
        </Card>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
                  navigate('/agent/dashboard');
                }
              }}
            >
              Cancel
            </Button>
            {currentStep === 2 && (
              <Button type="button" variant="secondary" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
            )}
            {currentStep === 1 ? (
              <Button type="button" variant="primary" onClick={handleNextStep}>
                Next: Banking Details
              </Button>
            ) : (
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Lead
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

