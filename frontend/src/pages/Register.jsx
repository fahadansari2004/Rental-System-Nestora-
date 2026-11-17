import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { User, Mail, Lock, Phone, UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Renter',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Invalid email address';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await register(formData);
      showToast(`Account created! Welcome to Nestora, ${data.user.name}.`, 'success');
      const r = (data.user.role || '').toLowerCase();
      navigate(r === 'host' || r === 'owner' ? '/dashboard/owner' : '/dashboard/renter');
    } catch (error) {
      const msg = error.message || 'Registration failed';
      showToast(msg, 'error');
      if (msg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block mb-1">
          JOIN NESTORA
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Create Your Account
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Sign up to lease verified residences or list your rental properties across Kerala and India.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            I am joining as a:
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'Renter' })}
              className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                formData.role === 'Renter'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tenant / Renter
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'Owner' })}
              className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                formData.role === 'Owner'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Property Owner / Host
            </button>
          </div>
        </div>

        <Input
          label="Full Name"
          type="text"
          icon={User}
          placeholder="e.g. Arun Nair"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="arun@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        <Input
          label="Password (min 6 characters)"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          required
        />

        <Input
          label="Phone Number (+91 format)"
          type="tel"
          icon={Phone}
          placeholder="+91 98470 12345"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon={UserPlus}
          isLoading={isLoading}
          className="w-full text-base font-bold shadow-md shadow-emerald-800/30"
        >
          Create Free Account
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 font-medium">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-emerald-800 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Register;
