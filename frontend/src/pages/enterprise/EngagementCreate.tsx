import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

// ============================================
// ENGAGEMENT CREATE - Screen 3
// Controlled form with validation
// ============================================

interface Client {
  id: string;
  name: string;
  industry: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const ENGAGEMENT_TYPES = [
  'AUDIT',
  'CONSULTING',
  'TAX',
  'ADVISORY',
  'DUE_DILIGENCE',
  'RISK_ASSESSMENT'
];

export default function EngagementCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    clientId: preselectedClientId || '',
    year: new Date().getFullYear(),
    type: '',
    leadPartnerId: '',
    managerIds: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load clients
      const clientsRes = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clientsData = await clientsRes.json();
      setClients(clientsData.clients || []);

      // Load partners
      const partnersRes = await fetch('/api/users/by-role/PARTNER', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const partnersData = await partnersRes.json();
      setPartners(partnersData.users || []);

      // Load managers
      const managersRes = await fetch('/api/users/by-role/MANAGER', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const managersData = await managersRes.json();
      setManagers(managersData.users || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) newErrors.clientId = 'Client is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.type) newErrors.type = 'Engagement type is required';
    if (!formData.leadPartnerId) newErrors.leadPartnerId = 'Lead partner is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/engagements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        alert('Engagement created successfully!');
        navigate(`/engagements/${data.engagement.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create engagement');
      }
    } catch (error) {
      console.error('Failed to create engagement:', error);
      alert('Failed to create engagement');
    } finally {
      setLoading(false);
    }
  };

  const toggleManager = (managerId: string) => {
    setFormData(prev => ({
      ...prev,
      managerIds: prev.managerIds.includes(managerId)
        ? prev.managerIds.filter(id => id !== managerId)
        : [...prev.managerIds, managerId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create New Engagement</h1>
            <p className="text-sm text-gray-500 mt-1">All fields are required</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.industry}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.clientId}
                </p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                min={2000}
                max={2100}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.year}
                </p>
              )}
            </div>

            {/* Engagement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engagement Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select engagement type</option>
                {ENGAGEMENT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.type}
                </p>
              )}
            </div>

            {/* Lead Partner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Partner *
              </label>
              <select
                value={formData.leadPartnerId}
                onChange={(e) => setFormData({ ...formData, leadPartnerId: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.leadPartnerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select lead partner</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.firstName} {partner.lastName} ({partner.email})
                  </option>
                ))}
              </select>
              {errors.leadPartnerId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.leadPartnerId}
                </p>
              )}
            </div>

            {/* Managers (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Managers (Optional)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                {managers.length === 0 ? (
                  <p className="text-sm text-gray-500">No managers available</p>
                ) : (
                  managers.map(manager => (
                    <label key={manager.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.managerIds.includes(manager.id)}
                        onChange={() => toggleManager(manager.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {manager.firstName} {manager.lastName} ({manager.email})
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Selected: {formData.managerIds.length} manager(s)
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Engagement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
