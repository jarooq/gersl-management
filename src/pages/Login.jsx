import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Heart, Users, TrendingUp, Shield } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading for smooth UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await login(username, password);
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const features = [
    { icon: Heart, label: 'Orphan Care', color: 'text-pink-500' },
    { icon: Users, label: 'Team Management', color: 'text-blue-500' },
    { icon: TrendingUp, label: 'Project Tracking', color: 'text-green-500' },
    { icon: Shield, label: 'Secure & Reliable', color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 relative z-10">
        {/* Left side - Branding and features */}
        <div className="hidden lg:flex flex-col justify-center text-white space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">GERSL</h1>
                <p className="text-blue-100 text-sm">Management System</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              Empowering Communities<br />Through Compassion
            </h2>
            <p className="text-blue-100 text-lg">
              A comprehensive platform for managing charity operations, tracking projects, and making a lasting impact.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className={`w-8 h-8 ${feature.color} mb-2`} />
                <p className="text-sm font-medium">{feature.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-sm text-blue-100 mb-2">Trusted by organizations worldwide</p>
            <p className="text-2xl font-bold">10,000+ Lives Impacted</p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex items-center justify-center animate-scale-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">GERSL</h1>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm animate-slide-down flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-modern"
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-semibold mb-3 text-center">Demo Credentials</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 rounded-lg p-2.5 text-center border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-1">Admin</p>
                  <p className="text-blue-600">admin</p>
                  <p className="text-blue-600">admin123</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2.5 text-center border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-1">CEO</p>
                  <p className="text-purple-600">ceo</p>
                  <p className="text-purple-600">ceo123</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2.5 text-center border border-green-100">
                  <p className="font-semibold text-green-900 mb-1">PM</p>
                  <p className="text-green-600">progmanager</p>
                  <p className="text-green-600">pm123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
