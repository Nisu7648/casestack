import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Settings as SettingsIcon, Plus } from 'lucide-react';

// ============================================
// 9️⃣ ADMIN & BILLING SCREEN
// User management, subscription, firm settings
// Case data NOT editable here
// ============================================

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [firm, setFirm] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CONSULTANT'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');

      if (activeTab === 'users') {
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setUsers(data.users);
      }

      if (activeTab === 'billing') {
        const response = await fetch('/api/settings/subscription', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setSubscription(data.subscription);
        setFirm(data.firm);
      }

      if (activeTab === 'settings') {
        const response = await fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setFirm(data.firm);
        setSettings(data.firm.settings);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        alert('User created successfully');
        setShowAddUser(false);
        setNewUser({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'CONSULTANT'
        });
        loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      alert('Failed to create user');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      loadData();
    } catch (error) {
      console.error('Toggle user error:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Firm Administration</h1>
          <p className="text-sm text-gray-600 mt-1">
            User management, billing, and firm settings
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 mb-6">
          <div className="flex gap-6">
            {['users', 'billing', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'users' && <Users className="w-4 h-4" />}
                {tab === 'billing' && <CreditCard className="w-4 h-4" />}
                {tab === 'settings' && <SettingsIcon className="w-4 h-4" />}
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            <div className="bg-white border border-gray-300">
              <div className="px-4 py-3 border-b border-gray-300">
                <h2 className="text-sm font-bold text-gray-900">USERS & ROLES</h2>
                <p className="text-xs text-gray-600 mt-1">{users.length} users</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">EMAIL</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ROLE</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">LAST LOGIN</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{user.role}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-1 text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-50 text-green-800' 
                              : 'bg-red-50 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-md border border-gray-300">
                  <div className="px-6 py-4 border-b border-gray-300">
                    <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
                      >
                        <option value="CONSULTANT">Consultant</option>
                        <option value="MANAGER">Manager</option>
                        <option value="PARTNER">Partner</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowAddUser(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddUser}
                        className="flex-1 px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 text-sm font-medium"
                      >
                        Add User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && subscription && firm && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-300 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">SUBSCRIPTION STATUS</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <p className="text-sm font-medium text-gray-900">{subscription.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Billing Cycle</p>
                  <p className="text-sm font-medium text-gray-900">{subscription.billingCycle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Price Per User</p>
                  <p className="text-sm font-medium text-gray-900">
                    {subscription.currency} {subscription.pricePerUser}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Active Users</p>
                  <p className="text-sm font-medium text-gray-900">{subscription.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">LICENSE USAGE</h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Seats Licensed</p>
                  <p className="text-2xl font-bold text-gray-900">{firm.seatsLicensed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Seats Used</p>
                  <p className="text-2xl font-bold text-gray-900">{firm.seatsUsed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Seats Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {firm.seatsLicensed - firm.seatsUsed}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 h-2">
                  <div
                    className="bg-gray-800 h-2"
                    style={{ width: `${(firm.seatsUsed / firm.seatsLicensed) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {((firm.seatsUsed / firm.seatsLicensed) * 100).toFixed(1)}% utilized
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 p-4">
              <p className="text-xs text-gray-600">
                Billing logic is independent from case data. Contact support to upgrade your plan.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && firm && settings && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-300 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">FIRM INFORMATION</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Firm Name</p>
                  <p className="text-sm text-gray-900">{firm.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Country</p>
                  <p className="text-sm text-gray-900">{firm.country}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Industry</p>
                  <p className="text-sm text-gray-900">{firm.industry || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">License Type</p>
                  <p className="text-sm text-gray-900">{firm.licenseType}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">FIRM SETTINGS</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-900">Require Partner for Finalization</p>
                    <p className="text-xs text-gray-600">Only partners can finalize cases</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium ${
                    settings.requirePartnerForFinalization 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {settings.requirePartnerForFinalization ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-900">Enable Download Tracking</p>
                    <p className="text-xs text-gray-600">Track all file downloads</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium ${
                    settings.enableDownloadTracking 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {settings.enableDownloadTracking ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-gray-900">Auto Archive After Years</p>
                    <p className="text-xs text-gray-600">Automatic archival period</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                    {settings.autoArchiveAfterYears} years
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 p-4">
              <p className="text-xs text-gray-600">
                Case data is NOT editable from admin settings. Settings control firm-wide behavior only.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
