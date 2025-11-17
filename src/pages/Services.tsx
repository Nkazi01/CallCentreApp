import { useState } from 'react';
import { SERVICES } from '../utils/constants';
import Card from '../components/common/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Services() {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Our Services & Pricing</h1>
        <p className="text-text-secondary">
          Comprehensive financial solutions to help you achieve financial freedom.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">{service.name}</h3>
              <button
                onClick={() => toggleService(service.id)}
                className="text-primary-cta hover:text-primary-cta/80"
                aria-label={expandedServices.has(service.id) ? 'Hide details' : 'Show details'}
              >
                {expandedServices.has(service.id) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xl font-bold text-primary-cta mb-4">{service.cost}</p>
            {expandedServices.has(service.id) && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-text-secondary mb-2">Requirements:</p>
                <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                  {service.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
                {service.additionalNotes && (
                  <div className="mt-3 p-2 bg-primary-cta/10 rounded-md">
                    <p className="text-sm text-primary-cta font-medium">
                      {service.additionalNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

