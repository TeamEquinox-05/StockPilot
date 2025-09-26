import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { setToken } from '../utils/auth';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegisterMode ? 'register' : 'login';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const authEndpoint = import.meta.env.VITE_API_AUTH_ENDPOINT || '/api/auth';

    try {
      const response = await fetch(`${apiBaseUrl}${authEndpoint}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        if (isRegisterMode) {
          setError('');
          setIsRegisterMode(false);
          setUsername('');
          setPassword('');
          alert('Registration successful! Please login.');
        } else {
          setToken(data.token);
          navigate('/dashboard');
        }
      } else {
        setError(data.message || `${isRegisterMode ? 'Registration' : 'Login'} failed`);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm"></div>
            </div>
            <span className="text-2xl font-bold tracking-tight">{import.meta.env.VITE_APP_NAME || 'StockPilot'}</span>
          </div>
          <Button onClick={() => navigate('/')} variant="ghost" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Hero Section with RippleGrid Background */}
         
          {/* Login Card */}
          <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-sm backdrop-blur-sm" style={{boxShadow: '0 2px 4px 0 rgba(31, 38, 135, 0.1)', border: '1px solid rgba(255,255,255,0.1)'}}>
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-center text-gray-900">
                  {isRegisterMode ? 'Create Account' : 'Sign In'}
                </CardTitle>
                <CardDescription className="text-center text-gray-600">
                  {isRegisterMode ? 'Start your inventory optimization journey' : 'Access your dashboard and insights'}
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0 mt-0.5"></div>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 px-4 bg-white/70 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 px-4 pr-11 bg-white/70 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {!isRegisterMode && (
                    <div className="text-right">
                      <button 
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-semibold bg-black hover:bg-gray-800 rounded-lg shadow-sm" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{isRegisterMode ? 'Creating Account...' : 'Signing in...'}</span>
                      </div>
                    ) : (
                      isRegisterMode ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <span className="text-gray-600 text-sm">
                      {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
                    </span>
                    <button 
                      type="button"
                      className="ml-2 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setError('');
                        setUsername('');
                        setPassword('');
                      }}
                    >
                      {isRegisterMode ? 'Sign In' : 'Register'}
                    </button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} StockPilot. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;