import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, Trash2, Crown } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { EmptyUsers } from '../../components/ui/EmptyState';
import { showSuccess, showError } from '../../components/ui/Toast';

// ============================================
// TEAM MANAGEMENT PAGE
// Invite users, manage roles, view team
// ============================================

export default function TeamManagement() {
  const [team, setTeam] = useState<any[]>([]);
  const [firm, setFirm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadTeam();
    loadFirm();
  }, []);

  const loadTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/firm/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load team');

      const data = await response.json();
      setTeam(data.teamMembers);
    } catch (error) {
      console.error('Load team error:', error);
      showError('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const loadFirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/firm/details', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load firm');

      const data = await response.json();
      setFirm(data.firm);
    } catch (error) {
      console.error('Load firm error:', error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      showError('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/firm/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }

      const data = await response.json();
      
      showSuccess(`Invitation sent to ${inviteEmail}`);
      
      // Show invitation link
      alert(`Invitation Link:\n\n${data.invitationLink}\n\nShare this link with the user.`);
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('STAFF');
    } catch (error: any) {
      console.error('Invite error:', error);
      showError(error.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/firm/team/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to change role');

      showSuccess('Role updated successfully');
      loadTeam();
    } catch (error) {
      console.error('Change role error:', error);
      showError('Failed to change role');
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the firm?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/firm/team/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to remove user');

      showSuccess('User removed successfully');
      loadTeam();
    } catch (error) {
      console.error('Remove user error:', error);
      showError('Failed to remove user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'PARTNER':
        return 'bg-blue-100 text-blue-800';
      case 'MANAGER':
        return 'bg-green-100 text-green-800';
      case 'STAFF':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canManageTeam = currentUser.role === 'ADMIN' || currentUser.isOwner;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `${team.length} team member${team.length !== 1 ? 's' : ''}`}
              {firm && ` • ${firm.users.length}/${firm.maxUsers} users`}
            </p>
          </div>
          {canManageTeam && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite User
            </button>
          )}
        </div>

        {/* Firm Info */}
        {firm && (
          <div className="mb-6 bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Firm Code: <span className="font-mono font-bold">{firm.firmCode}</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Share this code with team members to join your firm
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-700">
                  Plan: {firm.subscriptionPlan}
                </p>
                <p className="text-xs text-blue-700">
                  Users: {firm.users.length}/{firm.maxUsers}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team Table */}
        {loading ? (
          <LoadingTable rows={5} />
        ) : team.length === 0 ? (
          <EmptyUsers onInvite={() => setShowInviteModal(true)} />
        ) : (
          <div className="bg-white border border-gray-300">
            {/* Table Header */}
            <div className="border-b border-gray-300 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-gray-700">
                <div className="col-span-3">NAME</div>
                <div className="col-span-3">EMAIL</div>
                <div className="col-span-2">ROLE</div>
                <div className="col-span-2">JOINED</div>
                <div className="col-span-2">ACTIONS</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {team.map((member: any) => (
                <div
                  key={member.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      {member.isOwner && (
                        <Crown className="w-4 h-4 text-yellow-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        {member.isOwner && (
                          <p className="text-xs text-yellow-600">Owner</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <p className="text-sm text-gray-900">{member.email}</p>
                  </div>

                  <div className="col-span-2">
                    {canManageTeam && !member.isOwner ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(member.role)}`}
                      >
                        <option value="STAFF">Staff</option>
                        <option value="MANAGER">Manager</option>
                        <option value="PARTNER">Partner</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    {canManageTeam && !member.isOwner && member.id !== currentUser.id && (
                      <button
                        onClick={() => handleRemoveUser(member.id, `${member.firstName} ${member.lastName}`)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="PARTNER">Partner</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-medium mb-1">Role Permissions:</p>
                  <ul className="space-y-1">
                    <li>• <strong>Staff:</strong> Create and manage own cases</li>
                    <li>• <strong>Manager:</strong> Review cases, manage team cases</li>
                    <li>• <strong>Partner:</strong> Approve cases, full access</li>
                    <li>• <strong>Admin:</strong> Full system access, manage users</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('STAFF');
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
