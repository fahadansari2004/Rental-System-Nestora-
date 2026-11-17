import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const redirectByRole = (userRole) => {
    if (location.state?.from) return location.state.from;
    const r = (userRole || '').toLowerCase();
    if (r === 'admin') return '/dashboard/admin';
    if (r === 'host' || r === 'owner') return '/dashboard/owner';
    return '/dashboard/renter';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await login(email, password);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      navigate(redirectByRole(data.user.role), { replace: true });
    } catch (error) {
      const msg = error.message || 'Login failed';
      showToast(msg, 'error');
      setErrors({ general: msg, password: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block mb-1">
          SECURE PORTAL
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Sign In to Nestora
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Access your renter lease details, owner listings, or administrator hub.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
          }}
          error={errors.password}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon={LogIn}
          isLoading={isLoading}
          className="w-full text-base font-bold shadow-md shadow-emerald-800/30"
        >
          Sign In to Account
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 font-medium">
        Don't have an account yet?{' '}
        <Link to="/register" className="font-bold text-emerald-800 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default Login;
