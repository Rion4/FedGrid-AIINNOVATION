import React, { useState, useEffect, useRef } from 'react';
// Supabase import is removed and will be loaded from a CDN.

// --- Third-party Library Imports for Local Development ---
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
// Leaflet imports are removed and will be loaded from a CDN.

// --- Register Chart.js components ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


// --- HELPER DATA & FUNCTIONS ---

const initialRegionalData = {
    'north_mangaluru': { name: 'North Mangalore', trends: { users: 1850, avgConsumption: 29.1 }, forecasts: { day: { value: 53.8, unit: 'MWh' }, week: { value: 376.6, unit: 'MWh' }, month: { value: 1.6, unit: 'GWh' } }, efficiency: 94 },
    'north_east_mangaluru': { name: 'North East Mangalore', trends: { users: 1450, avgConsumption: 28.5 }, forecasts: { day: { value: 41.3, unit: 'MWh' }, week: { value: 289.1, unit: 'MWh' }, month: { value: 1.2, unit: 'GWh' } }, efficiency: 92 },
    'east_mangaluru': { name: 'East Mangalore', trends: { users: 1675, avgConsumption: 30.5 }, forecasts: { day: { value: 51.1, unit: 'MWh' }, week: { value: 357.7, unit: 'MWh' }, month: { value: 1.5, unit: 'GWh' } }, efficiency: 91 },
    'south_east_mangaluru': { name: 'South East Mangalore', trends: { users: 2105, avgConsumption: 31.2 }, forecasts: { day: { value: 65.7, unit: 'MWh' }, week: { value: 460.0, unit: 'MWh' }, month: { value: 1.9, unit: 'GWh' } }, efficiency: 88 },
    'south_mangaluru': { name: 'South Mangalore', trends: { users: 1950, avgConsumption: 32.8 }, forecasts: { day: { value: 64.0, unit: 'MWh' }, week: { value: 448.0, unit: 'MWh' }, month: { value: 1.8, unit: 'GWh' } }, efficiency: 89 },
    'west_mangaluru': { name: 'West Mangalore', trends: { users: 2350, avgConsumption: 27.8 }, forecasts: { day: { value: 65.3, unit: 'MWh' }, week: { value: 457.1, unit: 'MWh' }, month: { value: 2.0, unit: 'GWh' } }, efficiency: 95 }
};

const heatmapData = [
    [12.9659, 74.8295, 0.9],  // North Mangalore (Surathkal area)
    [12.9350, 74.8455, 0.75], // North East Mangalore (Kavoor area)
    [12.9178, 74.8737, 0.65], // East Mangalore (Derebail area)
    [12.8700, 74.8800, 0.85], // South East Mangalore (Kankanady area)
    [12.8223, 74.8485, 0.8],  // South Mangalore (Ullal area)
    [12.8797, 74.8433, 0.95]  // West Mangalore (Bejai/Attavar area)
];


const generateUserData = (period) => {
    const data = [], labels = [];
    let points;
    const now = new Date();
    switch (period) {
        case 'day':
            points = 24;
            for (let i = 0; i < points; i++) {
                labels.push(`${i}:00`);
                const fluctuation = Math.random() * 0.5;
                const base = (i > 6 && i < 9) || (i > 17 && i < 22) ? 1.5 : 0.5;
                data.push(base + fluctuation);
            }
            break;
        case 'week':
            points = 7;
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 0; i < points; i++) {
                const d = new Date();
                d.setDate(now.getDate() - (6 - i));
                labels.push(days[d.getDay()]);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                data.push(isWeekend ? 30 + Math.random() * 10 : 20 + Math.random() * 8);
            }
            break;
        case 'month':
            points = 30;
            for (let i = 1; i <= points; i++) { labels.push(`Day ${i}`); data.push(25 + (Math.random() - 0.5) * 10); }
            break;
        case 'year':
            points = 12;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < points; i++) {
                labels.push(months[i]);
                const isPeakMonth = i < 2 || i > 9 || (i > 4 && i < 7);
                data.push(isPeakMonth ? 800 + Math.random() * 200 : 600 + Math.random() * 150);
            }
            break;
        default:
            return {labels: [], data: []};
    }
    return { labels, data };
};

const generateOperatorChartData = (points, min, max) => {
    const data = [];
    for (let i = 0; i < points; i++) {
        data.push(min + Math.random() * (max - min));
    }
    return data;
};

// --- ICON COMPONENTS ---

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-3"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>;
const HeatmapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const ModelWeightsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>;
const SignOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>;
const DailyForecastIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-blue-500"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const WeeklyForecastIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>;
const MonthlyForecastIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-blue-500"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 1 0 4h-4a2 2 0 0 1 0-4h4z"></path></svg>;
const GridEfficiencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-500 mr-3"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>;

// --- GENERIC MODAL COMPONENT ---
const Modal = ({ show, onClose, title, children }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-600 w-full max-w-md">
                <div className="flex items-center mb-4">
                    <AlertTriangleIcon />
                    <h2 className="text-xl font-bold text-slate-100">{title}</h2>
                </div>
                <div className="text-slate-300 mb-6">
                    {children}
                </div>
                <button
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                    Acknowledge
                </button>
            </div>
        </div>
    );
};


// --- CHART COMPONENTS ---

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { beginAtZero: false, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
};

const UserConsumptionChart = ({ period }) => {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });

    useEffect(() => {
        const { labels, data } = generateUserData(period);
        setChartData({
            labels,
            datasets: [{
                label: 'kWh Consumed',
                data,
                borderColor: '#3b82f6',
                backgroundColor: (context) => {
                    if (!context.chart.ctx) return 'rgba(0,0,0,0)';
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, '#3b82f640');
                    gradient.addColorStop(1, '#3b82f600');
                    return gradient;
                },
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#1e293b',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3b82f6',
                tension: 0.4,
                fill: true,
            }]
        });
    }, [period]);

    return <Line options={chartOptions} data={chartData} />;
};

const OperatorConsumptionChart = ({ data }) => {
    const chartData = {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        datasets: [{
            label: 'Energy Consumption',
            data: data,
            borderColor: '#3b82f6',
            backgroundColor: (context) => {
                if (!context.chart.ctx) return 'rgba(0,0,0,0)';
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, '#3b82f640');
                gradient.addColorStop(1, '#3b82f600');
                return gradient;
            },
            tension: 0.4,
            fill: true,
        }]
    };
    return <Line options={chartOptions} data={chartData} />;
};

const ProductionChart = () => {
    const data = {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        datasets: [{
            label: 'Energy Production',
            data: generateOperatorChartData(30, 20, 40),
            backgroundColor: '#10b981',
        }]
    };
    return <Bar options={chartOptions} data={data} />;
};

// --- LEAFLET HEATMAP COMPONENT ---

const HeatmapComponent = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        const checkLeaflet = setInterval(() => {
            if (window.L && window.L.heatLayer) {
                clearInterval(checkLeaflet);
                
                if (mapRef.current && !mapInstance.current) {
                    const mangaloreBounds = window.L.latLngBounds([12.75, 74.75], [13.05, 75.00]);
                    mapInstance.current = window.L.map(mapRef.current, {
                        center: [12.9141, 74.8560],
                        zoom: 11,
                        minZoom: 11,
                        maxBounds: mangaloreBounds,
                        maxBoundsViscosity: 1.0
                    });
                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(mapInstance.current);
                    
                    window.L.heatLayer(heatmapData, { 
                        radius: 35, 
                        blur: 20, 
                        gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'} 
                    }).addTo(mapInstance.current);

                    setTimeout(() => mapInstance.current?.invalidateSize(), 100);
                }
            }
        }, 100);

        return () => clearInterval(checkLeaflet);
    }, []);

    return <div ref={mapRef} id="operatorMap" className="w-full h-full rounded-lg" style={{ height: 'calc(100vh - 12rem)' }}></div>;
};

// --- AUTHENTICATION COMPONENT ---

const AuthView = ({ supabase }) => {
    const [authMode, setAuthMode] = useState('user'); // 'user' or 'operator'
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Reset form state when switching modes
        setEmail('');
        setPassword('');
        setError('');
        setMessage('');
        setIsLogin(true); // Always default to login view on mode switch
    }, [authMode]);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        if (!supabase) {
            setError("Supabase client is not initialized.");
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // User Login/Signup Flow
            if (authMode === 'user') {
                let response;
                if (isLogin) {
                    response = await supabase.auth.signInWithPassword({ email, password });
                } else {
                    response = await supabase.auth.signUp({ email, password });
                    if (!response.error) {
                        setMessage('Sign up successful! Please check your email to verify your account.');
                    }
                }
                if (response.error) {
                    throw response.error;
                }
            } 
            // Operator (Admin) Login Flow
            else if (authMode === 'operator') {
                 if (!isLogin) {
                    // This case is disabled in the UI, but added as a safeguard.
                    setError("Sign up is not available for operators from this page.");
                    setLoading(false);
                    return;
                }

                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

                if (signInError) {
                    throw signInError;
                }

                if (signInData.user) {
                    // After successful login, check the user's role.
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', signInData.user.id)
                        .single();
                    
                    if (profileError) {
                        // If profile doesn't exist or there's an error, sign out and deny access.
                        await supabase.auth.signOut();
                        throw new Error("Could not verify operator role. Access denied.");
                    }

                    if (profile.role !== 'operator') {
                        // If the user is not an operator, sign them out immediately.
                        await supabase.auth.signOut();
                        throw new Error("Access Denied: You do not have operator privileges.");
                    }
                    // If role is 'operator', the session continues and the main App component will handle routing.
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-800">
            <div className="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-lg border border-slate-700 shadow-lg">
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <svg className="h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m13.5 10.5-3 3"></path><path d="m10.5 10.5 3 3"></path></svg>
                        <h1 className="text-3xl font-bold text-slate-100">FedGrid</h1>
                    </div>
                </div>

                {/* --- Login Mode Toggle Buttons --- */}
                <div className="flex items-center bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setAuthMode('user')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${authMode === 'user' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                        User Login
                    </button>
                    <button onClick={() => setAuthMode('operator')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${authMode === 'operator' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                        Operator Login
                    </button>
                </div>

                <div className="text-center pt-2">
                     <h2 className="text-2xl font-bold text-slate-200">
                        {authMode === 'user' ? (isLogin ? 'User Sign In' : 'Create User Account') : 'Operator Sign In'}
                     </h2>
                    <p className="text-slate-400">to access your dashboard</p>
                </div>
                
                <form className="space-y-6" onSubmit={handleAuthAction}>
                    <input type="email" placeholder="Email address" required
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" required
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit" disabled={loading}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                {error && <p className="text-center text-red-400">{error}</p>}
                {message && <p className="text-center text-green-400">{message}</p>}

                {/* Only show signup toggle for Users */}
                {authMode === 'user' && (
                    <div className="text-center">
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }} className="text-sm text-blue-400 hover:underline">
                            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- VIEW COMPONENTS ---

const UserView = ({ user, supabase }) => {
    const [period, setPeriod] = useState('day');
    const [prediction, setPrediction] = useState(null);

    const handleSimulate = () => {
        setPrediction(`${(30 + Math.random() * 20).toFixed(1)} kWh`);
    };

    return (
      <>
        <header className="bg-slate-900 sticky top-0 z-50 border-b border-slate-600">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                    <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m13.5 10.5-3 3"></path><path d="m10.5 10.5 3 3"></path></svg>
                    <h1 className="text-xl font-bold text-slate-100">FedGrid User</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm hidden sm:block">{user.email}</span>
                  <button onClick={() => supabase.auth.signOut()} className="flex items-center justify-center px-4 py-2 text-slate-300 rounded-lg transition-colors bg-slate-800 hover:bg-red-500 hover:text-white">
                      <SignOutIcon /> <span className="hidden sm:inline ml-2">Sign Out</span>
                  </button>
                </div>
            </div>
          </nav>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">Current Power Prediction</h2>
                        <div className="flex items-baseline space-x-2">
                            <p className="text-5xl font-bold text-slate-100">1.25</p>
                            <span className="text-lg text-slate-400">kWh</span>
                        </div>
                        <p className="text-sm text-green-400 mt-2">▼ 5% from last hour</p>
                        <p className="text-xs text-slate-400 mt-4">Next update in 45 minutes.</p>
                    </div>
                    <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">Predict Future Consumption</h2>
                        <div className="space-y-4">
                             <select className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100">
                                 <option>Next 24 Hours</option>
                                 <option>Next 7 Days</option>
                                 <option>Next 30 Days</option>
                             </select>
                            <button onClick={handleSimulate} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Simulate</button>
                            {prediction && (
                                <div className="text-center pt-2">
                                    <p className="text-slate-400">Predicted Consumption:</p>
                                    <p className="text-2xl font-bold text-blue-500">{prediction}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-100 mb-2 sm:mb-0">Power Consumption</h2>
                        <div className="flex items-center bg-slate-800 p-1 rounded-lg">
                            {['Day', 'Week', 'Month', 'Year'].map(p => (
                                <button key={p} onClick={() => setPeriod(p.toLowerCase())} className={`timespan-btn px-3 py-1 text-sm font-semibold rounded-md transition-colors ${period === p.toLowerCase() ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                    <div className="relative" style={{ height: '50vh' }}>
                        <UserConsumptionChart period={period} />
                    </div>
                </div>
            </div>
        </main>
      </>
    );
};

const OperatorView = ({ user, supabase }) => {
    const [subView, setSubView] = useState('dashboard');
    const [region, setRegion] = useState('north_mangaluru');
    const [regionalData, setRegionalData] = useState(initialRegionalData);
    const [consumptionChartData, setConsumptionChartData] = useState(generateOperatorChartData(30, 135, 150));
    const [modalInfo, setModalInfo] = useState({ show: false, title: '', message: '' });

    // Simulate real-time data updates and check for outages
    useEffect(() => {
        const interval = setInterval(() => {
            let outageDetected = false;
            const updatedData = { ...regionalData };
            
            // Randomly decide if an outage should occur for simulation purposes
            const outageChance = Math.random();
            if (outageChance < 0.1) { // 10% chance per interval
                const regionKeys = Object.keys(updatedData);
                const randomRegionKey = regionKeys[Math.floor(Math.random() * regionKeys.length)];

                // Check if there is not already an active outage
                if (updatedData[randomRegionKey].forecasts.day.value > 0) {
                     updatedData[randomRegionKey].forecasts.day.value = 0; // Simulate outage
                     outageDetected = true;
                     setModalInfo({
                        show: true,
                        title: 'Power Outage Alert',
                        message: `A power outage has been detected in the ${updatedData[randomRegionKey].name} region at ${new Date().toLocaleTimeString()}. The daily forecast value has dropped to 0.`
                    });
                }
            }
            
            // Also simulate minor fluctuations for other regions
            Object.keys(updatedData).forEach(key => {
                // If this region is not the one with the outage, fluctuate its value
                if (updatedData[key].forecasts.day.value !== 0) {
                    const originalValue = initialRegionalData[key].forecasts.day.value;
                    const fluctuation = (Math.random() - 0.5) * 2; // Fluctuate by +/- 1 MWh
                    updatedData[key].forecasts.day.value = Math.max(0, parseFloat((originalValue + fluctuation).toFixed(1)));
                }
            });

            setRegionalData(updatedData);

            // Also update chart data with a new random value
            setConsumptionChartData(prevData => {
                const newData = [...prevData];
                newData.shift(); // remove first element
                newData.push(135 + Math.random() * 15); // add a new random element
                return newData;
            });

        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [regionalData]);


    const data = regionalData[region];

    const Sidebar = () => (
        <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col flex-shrink-0 h-screen sticky top-0">
            <div className="flex items-center space-x-3 h-16 px-4 border-b border-slate-700">
                 <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m13.5 10.5-3 3"></path><path d="m10.5 10.5 3 3"></path></svg>
                 <h1 className="text-xl font-bold text-slate-100">FedGrid Operator</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                <a href="#" onClick={(e) => { e.preventDefault(); setSubView('dashboard'); }} className={`flex items-center px-4 py-2.5 rounded-lg transition-colors hover:bg-blue-500 hover:text-white ${subView === 'dashboard' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}>
                    <DashboardIcon /> Dashboard
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); setSubView('heatmap'); }} className={`flex items-center px-4 py-2.5 rounded-lg transition-colors hover:bg-blue-500 hover:text-white ${subView === 'heatmap' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}>
                    <HeatmapIcon /> Heatmap
                </a>
                <a href="#" className="flex items-center px-4 py-2.5 rounded-lg transition-colors text-slate-400 hover:bg-blue-500 hover:text-white opacity-50 cursor-not-allowed">
                    <ModelWeightsIcon /> Model Weights
                </a>
            </nav>
            <div className="px-4 py-4 mt-auto border-t border-slate-700">
                <div className="px-4 py-3 rounded-lg bg-slate-800">
                    <p className="text-sm font-medium text-white">Operator Email</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="flex items-center justify-center w-full mt-4 px-4 py-2.5 text-slate-300 rounded-lg transition-colors bg-slate-800 hover:bg-red-500 hover:text-white">
                    <SignOutIcon /> Sign Out
                </button>
            </div>
        </aside>
    );

    const Dashboard = () => (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Energy Dashboard</h1>
                    <p className="text-slate-400 mt-1">Viewing data for the {regionalData[region].name} region.</p>
                </div>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full sm:w-auto mt-4 sm:mt-0 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100">
                    {Object.keys(regionalData).map(regionKey => (
                        <option key={regionKey} value={regionKey}>{regionalData[regionKey].name}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-400 mb-4 flex items-center"><DailyForecastIcon />Daily Forecast</h3>
                    <p className={`text-4xl font-bold ${data.forecasts.day.value === 0 ? 'text-red-500' : 'text-slate-100'}`}>
                        {data.forecasts.day.value} <span className="text-2xl text-slate-400">{data.forecasts.day.unit}</span>
                    </p>
                    <p className="text-sm text-slate-400 mt-2">92% confidence</p>
                </div>
                 <div className="lg:col-span-1 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-400 mb-4 flex items-center"><WeeklyForecastIcon />Weekly Forecast</h3>
                    <p className="text-4xl font-bold text-slate-100">{data.forecasts.week.value} <span className="text-2xl text-slate-400">{data.forecasts.week.unit}</span></p>
                    <p className="text-sm text-slate-400 mt-2">89% confidence</p>
                </div>
                 <div className="lg:col-span-1 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-400 mb-4 flex items-center"><MonthlyForecastIcon />Monthly Forecast</h3>
                    <p className="text-4xl font-bold text-slate-100">{data.forecasts.month.value} <span className="text-2xl text-slate-400">{data.forecasts.month.unit}</span></p>
                    <p className="text-sm text-slate-400 mt-2">85% confidence</p>
                </div>
                <div className="lg:col-span-1 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-400 mb-4 flex items-center"><GridEfficiencyIcon />Grid Efficiency</h3>
                    <p className="text-4xl font-bold text-emerald-500">{data.efficiency}%</p>
                    <p className="text-sm text-slate-400 mt-2">Real-time performance</p>
                </div>
                <div className="md:col-span-2 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-400 mb-6">Regional Trends</h3>
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-slate-400">Average Consumption</p>
                            <p className="text-3xl font-bold text-slate-100 mt-1">{data.trends.avgConsumption} <span className="text-lg">kWh</span></p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Prosumers</p>
                            <p className="text-3xl font-bold text-slate-100 mt-1">{data.trends.users.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 lg:col-span-4 xl:col-span-2 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-400 mb-4">Energy Consumption</h3>
                    <div className="relative h-64"><OperatorConsumptionChart data={consumptionChartData} /></div>
                </div>
                <div className="md:col-span-2 lg:col-span-4 xl:col-span-2 bg-slate-700 p-6 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-400 mb-4">Energy Production</h3>
                    <div className="relative h-64"><ProductionChart /></div>
                </div>
            </div>
        </div>
    );
    
    const Heatmap = () => (
         <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-6">Mangalore Regional Power Consumption Heatmap</h1>
            <HeatmapComponent />
        </div>
    );

    return (
        <div className="flex w-full min-h-screen bg-slate-800 text-slate-300 font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                 <Modal 
                    show={modalInfo.show} 
                    onClose={() => setModalInfo({ ...modalInfo, show: false })} 
                    title={modalInfo.title}
                >
                    <p>{modalInfo.message}</p>
                </Modal>
                {subView === 'dashboard' ? <Dashboard /> : <Heatmap />}
            </main>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

export default function App() {
    const [supabase, setSupabase] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load Supabase and other libraries from CDN
        if (document.getElementById('supabase-js')) {
            if (window.supabase) {
                const client = window.supabase.createClient(
                    'YOUR_SUPABASE_URL',
                    'YOUR_SUPABASE_ANON_KEY'
                );
                setSupabase(client);
            }
            return;
        }

        const loadScript = (id, src, onload) => {
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.onload = onload;
            document.body.appendChild(script);
        };

        const leafletCss = document.createElement('link');
        leafletCss.id = 'leaflet-css';
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCss);
        
        loadScript('leaflet-js', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', () => {
             loadScript('leaflet-heat-js', 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js');
        });

        loadScript('supabase-js', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js', () => {
             if (window.supabase) {
                const client = window.supabase.createClient(
                    'https://thefenrcadclcnazqqhx.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZWZlbnJjYWRjbGNuYXpxcWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTQ2NjIsImV4cCI6MjA3NDIzMDY2Mn0.GEmk4iCNu_fKTMENc8kJaWlB9WDlUwTXO9CZeNBqltg'
                );
                setSupabase(client);
            }
        });

    }, []);

    useEffect(() => {
        if (!supabase) return;

        setLoading(true);
        // Fetch the initial session
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };
        fetchSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    useEffect(() => {
        // Fetch user profile when session changes
        if (session?.user && supabase) {
            setLoading(true);
            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                
                if (error) {
                    console.error('Error fetching profile:', error);
                } else {
                    setProfile(data);
                }
                setLoading(false);
            };
            fetchProfile();
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [session, supabase]);
    

    const renderContent = () => {
        if (loading) {
            return <div className="min-h-screen bg-slate-800 flex items-center justify-center text-white">Loading FedGrid...</div>;
        }

        if (!session) {
            return <AuthView supabase={supabase} />;
        }

        if (profile?.role === 'operator') {
            return <OperatorView user={session.user} supabase={supabase} />;
        }
        
        return <UserView user={session.user} supabase={supabase} />;
    };

    return (
        <div className="min-h-screen bg-slate-800 text-slate-300 font-sans">
            {renderContent()}
        </div>
    );
}

