import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Input, Textarea } from '../components/common/Input';
import Button from '../components/common/Button';
import { Select } from '../components/common/Select';
import { useToast } from '../context/ToastContext';

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'agent', label: 'Agent' },
];

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'manager' as 'manager' | 'agent',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Use RPC function to check if user exists (bypasses RLS)
      const { data: userExists, error: checkError } = await supabase.rpc('user_exists', {
        check_username: formData.username,
        check_email: formData.email,
      });

      if (checkError) {
        throw checkError;
      }

      if (userExists) {
        setError('An account with that username or email already exists.');
        setLoading(false);
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            role: formData.role,
            notes: formData.notes,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError || !signUpData.user) {
        throw signUpError || new Error('Failed to create authentication record.');
      }

      // If email confirmation is disabled, create profile immediately
      // Otherwise, the trigger will create it when email is confirmed
      if (signUpData.session) {
        // User is immediately signed in (email confirmation disabled)
        const { error: profileError } = await supabase.from('users').insert([
          {
            id: signUpData.user.id,
            username: formData.username,
            password: '', // Empty password since we use Supabase Auth
            role: formData.role,
            full_name: formData.fullName,
            email: formData.email,
            active: true,
          },
        ]);

        if (profileError) {
          // eslint-disable-next-line no-console
          console.error('Profile creation error (may be handled by trigger)', profileError);
          // Don't throw - trigger might handle it
        }
        
        setSuccessMessage('Account created successfully! You can now log in.');
        showToast('Registration successful!', 'success');
      } else {
        // Email confirmation required
        setSuccessMessage('Registration successful! Please check your email to confirm your account before logging in.');
        showToast('Please check your email to confirm your account', 'success');
      }
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'manager',
        notes: '',
      });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Registration failed', err);
      setError(err?.message || 'Failed to register. Please try again.');
      showToast('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-header-nav to-primary-cta p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-header-nav">Register an Account</h1>
          <p className="text-sm text-text-secondary mt-2">
            Use this form to create the initial manager account or onboard agents. Only share this URL with trusted administrators.
          </p>
        </div>

        {error && (
          <div className="bg-status-error/10 border border-status-error text-status-error px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-status-success/10 border border-status-success text-status-success px-4 py-3 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            placeholder="e.g. Nkazimulomongezi Mlambo"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Username"
            placeholder="Unique username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'agent' | 'manager' })}
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={8}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            minLength={8}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Add a note about this account. Visible only to administrators."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Register Account
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-primary-cta hover:underline"
            onClick={() => navigate('/')}
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

