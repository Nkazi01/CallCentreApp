import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authenticatedUser = await login(username, password);
      if (authenticatedUser) {
        showToast('Login successful!', 'success');
        if (authenticatedUser.role === 'manager') {
          navigate('/manager/dashboard');
        } else {
          navigate('/agent/dashboard');
        }
      } else {
        const friendlyError = authError?.message || 'Invalid username/email or password';
        setError(friendlyError);
        showToast('Login failed. Please check your credentials.', 'error');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      showToast('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-header-nav to-primary-cta p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-logo-accent rounded-md flex items-center justify-center font-bold text-white text-xl">
              IY
            </div>
            <h1 className="text-2xl font-bold text-header-nav">IY Finance Solutions</h1>
          </div>
          <p className="text-text-secondary text-sm">Your Path to Financial Freedom</p>
          <p className="text-text-secondary text-xs mt-2">Inqubeko Yezibusiso Pty Ltd</p>
          <p className="text-text-secondary text-xs">FSP 49179</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-status-error/10 border border-status-error text-status-error px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Input
            label="Username or Email"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            placeholder="Enter your username or email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary-cta border-border rounded focus:ring-primary-cta"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-text-secondary">
              Remember me
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Login
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-text-secondary text-center">
            Use your company-issued credentials. Contact an administrator if you need access.
          </p>
          <p className="text-xs text-text-secondary text-center mt-2">
            Administrators can register accounts via the&nbsp;
            <button
              type="button"
              className="text-primary-cta hover:underline"
              onClick={() => navigate('/register')}
            >
              secure registration page
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

