import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { formatPhoneIndian } from '../utils/formatters';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Select from '../components/common/Select';
import { compressImageFile } from '../utils/imageCompressor';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  CheckCircle,
  Sparkles,
  Upload,
  RefreshCw,
  Home,
} from 'lucide-react';

const keralaCities = [
  'Kochi',
  'Ernakulam',
  'Kakkanad',
  'Thiruvananthapuram',
  'Kozhikode',
  'Thrissur',
  'Kottayam',
  'Alappuzha',
  'Kannur',
  'Palakkad',
  'Bengaluru',
  'Chennai',
  'Mumbai',
];

const Profile = () => {
  const { user, updateProfile, switchRole } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security' | 'preferences'
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98470 12345');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Security password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Rental preferences state
  const [preferredCity, setPreferredCity] = useState('Kochi');
  const [targetBudget, setTargetBudget] = useState('25000');

  // Handle local avatar file upload via FileReader with canvas compression
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }

    try {
      showToast('Optimizing avatar photo...', 'info', 1000);
      const compressed = await compressImageFile(file, 400, 400, 0.85);
      setAvatar(compressed);
      showToast('Profile photo updated from device file', 'success');
    } catch (err) {
      console.warn('Avatar process error:', err);
      showToast('Could not process avatar file', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile({ name, phone, bio, avatar });
      showToast('Profile information updated successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setIsChangingPass(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleRoleSwitch = (newRole) => {
    if (switchRole) {
      switchRole(newRole);
      showToast(`Switched active profile role to ${newRole}`, 'success');
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    showToast('Rental search preferences updated!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group">
          <img
            src={
              avatar ||
              user?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
            }
            alt={user?.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100 shadow-md"
          />
          <label
            htmlFor="avatar-file-input"
            className="absolute bottom-0 right-0 p-1.5 bg-emerald-800 text-white rounded-full cursor-pointer hover:bg-emerald-900 transition-colors shadow-md"
            title="Upload profile photo from computer"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              id="avatar-file-input"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
          </label>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
            <Badge variant="primary" size="sm" className="capitalize w-fit mx-auto sm:mx-0">
              {user?.role === 'host' ? 'Owner' : user?.role}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-600 font-semibold">{formatPhoneIndian(user?.phone || phone)}</p>
          <p className="text-xs text-slate-500 max-w-lg mt-1">{user?.bio || 'Verified Member of Nestora Platform'}</p>
        </div>

        {/* Quick Role Switcher for Testing */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-emerald-800" /> Switch Demo Role:
          </span>
          <div className="flex gap-1">
            {['Renter', 'Owner', 'Admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${user?.role?.toLowerCase() === r.toLowerCase() ||
                  (user?.role === 'host' && r === 'Owner')
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'details'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          Account Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'security'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          Security &amp; Password
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'preferences'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          Rental Preferences
        </button>
      </div>

      {/* Tab 1: Account Details */}
      {activeTab === 'details' && (
        <form
          onSubmit={handleUpdateProfile}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5 max-w-2xl"
        >
          <h3 className="text-base font-bold text-slate-900">Personal Information</h3>

          <Input
            label="Full Name"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Phone Number (+91 format)"
            icon={Phone}
            placeholder="+91 98470 12345"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5">
              Avatar Image (Upload from Computer or URL)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste direct image URL or use file button above"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                wrapperClassName="flex-1"
              />
              <label
                htmlFor="avatar-file-input-inline"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Browse File
                <input
                  type="file"
                  id="avatar-file-input-inline"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileSelect}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5">
              Bio / About You
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell property owners or prospective tenants a bit about yourself..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isUpdating}>
            Save Profile Changes
          </Button>
        </form>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5 max-w-md"
        >
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-800" />
            Update Account Password
          </h3>

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="md" isLoading={isChangingPass}>
            Update Password
          </Button>
        </form>
      )}

      {/* Tab 3: Rental Preferences */}
      {activeTab === 'preferences' && (
        <form
          onSubmit={handleSavePreferences}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5 max-w-md"
        >
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-800" />
            Tenant Match Preferences
          </h3>

          <Select
            label="Preferred Location in Kerala"
            value={preferredCity}
            onChange={(e) => setPreferredCity(e.target.value)}
            options={keralaCities}
          />

          <Input
            label="Target Monthly Budget (₹/month)"
            type="number"
            step="1000"
            value={targetBudget}
            onChange={(e) => setTargetBudget(e.target.value)}
          />

          <Button type="submit" variant="primary" size="md">
            Save Preferences
          </Button>
        </form>
      )}
    </div>
  );
};

export default Profile;
