import React, { useState } from 'react';
import { Bus, MapPin, Calendar, Search, ShieldCheck, User, LogOut, Lock, LogIn, Plus, Navigation, CheckCircle2, XCircle } from 'lucide-react';

export default function App() {
  const ADMIN_EMAIL = "admin@unigo.com";
  const ADMIN_PASSWORD = "admin123";

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
    selectedRole: 'student'
  });

  const [activeTab, setActiveTab] = useState('home');
  const [selectedPassId, setSelectedPassId] = useState('REQ-1075');

  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('Main Campus Gate');
  const [searchDate, setSearchDate] = useState('2026-10-15');

  const [formData, setFormData] = useState({
    fullName: '',
    rollId: '',
    department: 'CSE',
    routeName: 'Kolkata Central Express',
    boardingPoint: ''
  });

  const [routesList, setRoutesList] = useState([
    { id: 1, name: 'Kolkata Central Express', busNo: 'Bus 12A', departure: '07:30 AM', seats: '12 seats left', stops: 'Karunamoyee ➔ VIP Road ➔ Gate 1', mapQuery: 'Kolkata+Central' },
    { id: 2, name: 'Kolkata Sector V', busNo: 'Bus 08B', departure: '08:00 AM', seats: '5 seats left', stops: 'College More ➔ Technopolis ➔ Gate 2', mapQuery: 'Salt+Lake+Sector+V' },
    { id: 3, name: 'Howrah Terminal Express', busNo: 'Bus 15C', departure: '07:15 AM', seats: '18 seats left', stops: 'Howrah Station ➔ Kankurgachi ➔ Campus', mapQuery: 'Howrah+Station' },
    { id: 4, name: 'Barasat Line Shuttle', busNo: 'Bus 04A', departure: '08:30 AM', seats: '22 seats left', stops: 'Barasat Colony ➔ Madhyamgram ➔ Gate 1', mapQuery: 'Barasat' }
  ]);

  const [newRoute, setNewRoute] = useState({
    name: '',
    busNo: '',
    departure: '08:00 AM',
    seats: '30 seats left',
    startPoint: '',
    endPoint: 'Main Campus Gate',
    stops: [],
    mapQuery: 'Kolkata'
  });

  // Central Applications Queue
  const [applications, setApplications] = useState([
    {
      id: 'REQ-1075',
      passId: 'PASS-UNI-9921',
      fullName: 'Lakshya Jaiswal',
      rollId: 'uhsoet3024200',
      department: 'CSE',
      routeName: 'Kolkata Central Express',
      boardingPoint: 'Adamas Gate',
      busNumber: '12A',
      issueDate: '14/10/2026',
      status: 'Approved',
      remarks: 'Approved by System Admin'
    },
    {
      id: 'REQ-3312',
      passId: '',
      fullName: 'Priya Singh',
      rollId: 'uhsoet3024210',
      department: 'ECE',
      routeName: 'Kolkata Sector V',
      boardingPoint: 'Salt Lake Karunamoyee',
      busNumber: '08B',
      issueDate: '14/10/2026',
      status: 'Under Review',
      remarks: 'Verification Pending'
    }
  ]);

  const activePass = applications.find(app => app.id === selectedPassId) || applications[0];
  const qrText = activePass ? `PASS: ${activePass.passId || activePass.id}\nNAME: ${activePass.fullName}\nROLL: ${activePass.rollId}\nROUTE: ${activePass.routeName}\nSTATUS: ${activePass.status}` : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}&color=000000&bgcolor=ffffff`;

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authForm.email.toLowerCase() === ADMIN_EMAIL && authForm.password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setUserRole('admin');
      setUserName('System Administrator');
      setUserEmail(ADMIN_EMAIL);
      setShowAuthModal(false);
      setActiveTab('admin');
      return;
    }

    if (authMode === 'login' && authForm.email.toLowerCase() === ADMIN_EMAIL && authForm.password !== ADMIN_PASSWORD) {
      alert("Invalid Admin Password!");
      return;
    }

    const displayName = authForm.fullName || authForm.email.split('@')[0] || 'Campus User';
    setIsLoggedIn(true);
    setUserRole(authMode === 'register' ? authForm.selectedRole : 'student');
    setUserName(displayName);
    setUserEmail(authForm.email);
    setFormData(prev => ({ ...prev, fullName: displayName }));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('student');
    setUserName('');
    setUserEmail('');
    setActiveTab('home');
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please login or register first to generate a digital bus pass!");
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    const newReq = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      passId: '',
      fullName: formData.fullName || userName || 'Campus Commuter',
      rollId: formData.rollId || 'ROLL-TBD',
      department: formData.department,
      routeName: formData.routeName,
      boardingPoint: formData.boardingPoint || 'Main Gate',
      busNumber: 'TBD',
      issueDate: '14/10/2026',
      status: 'Under Review',
      remarks: 'Submitted by student'
    };

    setApplications([newReq, ...applications]);
    setSelectedPassId(newReq.id);
    setActiveTab('mypass');
  };

  // Admin Approval / Rejection Logic
  const handleAdminStatusChange = (id, newStatus) => {
    setApplications(applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status: newStatus,
          passId: newStatus === 'Approved' ? `PASS-UNI-${Math.floor(1000 + Math.random() * 9000)}` : app.passId,
          remarks: newStatus === 'Approved' ? 'Approved by Admin' : 'Rejected by Admin'
        };
      }
      return app;
    }));
  };

  const handleAddRoute = (e) => {
    e.preventDefault();
    if (!newRoute.name || !newRoute.busNo) return;

    const routeToAdd = {
      id: Date.now(),
      name: newRoute.name,
      busNo: newRoute.busNo,
      departure: newRoute.departure,
      seats: newRoute.seats,
      stops: newRoute.startPoint ? `${newRoute.startPoint} ➔ Main Campus Gate` : 'Main Gate ➔ Campus Quad',
      mapQuery: encodeURIComponent(newRoute.startPoint || newRoute.name)
    };

    setRoutesList([routeToAdd, ...routesList]);
    setNewRoute({
      name: '',
      busNo: '',
      departure: '08:00 AM',
      seats: '30 seats left',
      startPoint: '',
      endPoint: 'Main Campus Gate',
      stops: [],
      mapQuery: 'Kolkata'
    });
    alert("New route published successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      
      {/* Navigation Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-lime-500 text-slate-950 p-2 rounded-xl font-black flex items-center justify-center">
              <Bus className="w-6 h-6" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black tracking-tight text-white">
                UniGo <span className="text-lime-400">Mobility</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Campus Express Transport</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'home' ? 'bg-lime-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'routes' ? 'bg-lime-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Routes & Schedule
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'apply' ? 'bg-lime-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Apply Pass
            </button>
            
            {isLoggedIn && (
              <button
                onClick={() => setActiveTab('mypass')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'mypass' ? 'bg-lime-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                My Travel Wallet
              </button>
            )}

            {isLoggedIn && userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border border-lime-500/50 ${
                  activeTab === 'admin' ? 'bg-lime-500 text-slate-950 shadow-sm' : 'text-lime-400 hover:bg-slate-800'
                }`}
              >
                🛡️ Admin Console
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
                  <div className="w-7 h-7 rounded-full bg-lime-500 text-slate-950 flex items-center justify-center font-bold text-xs uppercase">
                    {userName ? userName.slice(0, 2) : 'US'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-white leading-tight">{userName}</p>
                    <p className="text-[10px] text-lime-400 font-semibold uppercase">{userRole}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-full border border-slate-700 transition-all flex items-center gap-1 text-xs font-bold px-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" /> Login
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-lime-500 hover:bg-lime-400 rounded-lg transition-all shadow-md"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mb-auto">

        {/* HOME PAGE */}
        {activeTab === 'home' && (
          <div>
            <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 text-left space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 font-bold text-xs">
                      <span>🚌 Smart Campus Commute</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                      Smart Campus Travel, <span className="text-lime-400">Simplified.</span>
                    </h1>
                    <p className="text-slate-300 text-base sm:text-lg max-w-xl font-medium">
                      Book digital bus passes, track live college routes, and enjoy seamless paperless travel every day with UniGo.
                    </p>
                  </div>

                  <div className="lg:col-span-5 flex justify-center">
                    <img 
                      src="/hero-bus.png" 
                      alt="UniGo Campus Bus" 
                      className="w-full max-w-sm h-auto object-contain drop-shadow-2xl"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop";
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ROUTES TAB */}
        {activeTab === 'routes' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-left mb-8">
              <h2 className="text-3xl font-black text-slate-900">Campus Active Routes & Maps</h2>
              <p className="text-slate-600 font-medium">Daily operational bus routes and real-time map locations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {routesList.map((route) => (
                <div key={route.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="bg-slate-900 text-lime-400 font-bold text-xs px-3 py-1 rounded-full">{route.busNo}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">{route.seats}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">{route.name}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">Stops: {route.stops}</p>
                    
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 h-40 bg-slate-100 relative">
                      <iframe
                        title={route.name}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${route.mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Departs: {route.departure}</span>
                    <button 
                      onClick={() => {
                        setFormData({...formData, routeName: route.name});
                        setActiveTab('apply');
                      }}
                      className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                    >
                      Book Pass →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* APPLY PASS TAB */}
        {activeTab === 'apply' && (
          <section className="max-w-3xl mx-auto px-4 py-10">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg text-left">
              {!isLoggedIn && (
                <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-900">
                    Authentication required! Please login or register to apply for a digital bus pass.
                  </p>
                </div>
              )}

              <h2 className="text-2xl font-black text-slate-900 mb-2">Apply for Digital Bus Pass</h2>
              <p className="text-xs text-slate-500 font-medium mb-6">Complete your student details to request or renew your active campus bus pass.</p>

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Student Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lakshya Jaiswal"
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roll / ID Number</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. UHSOET3024200"
                      value={formData.rollId} 
                      onChange={e => setFormData({...formData, rollId: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. CSE"
                      value={formData.department} 
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Preferred Route</label>
                  <select 
                    value={formData.routeName}
                    onChange={e => setFormData({...formData, routeName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    {routesList.map(r => <option key={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Boarding Stop Point</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Adamas Gate / Salt Lake"
                    value={formData.boardingPoint} 
                    onChange={e => setFormData({...formData, boardingPoint: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-lime-400 font-black rounded-xl shadow-lg transition-all text-base mt-4"
                >
                  {isLoggedIn ? 'Submit Pass Application →' : 'Login & Generate Pass →'}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* MY TRAVEL WALLET TAB */}
        {activeTab === 'mypass' && isLoggedIn && (
          <section className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-left relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800">
                <div>
                  <span className="bg-lime-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {activePass.status} Digital Pass
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">{activePass.fullName}</h2>
                  <p className="text-sm text-slate-400">Roll ID: <span className="text-slate-200 font-bold">{activePass.rollId}</span> | Dept: {activePass.department}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Pass ID</p>
                  <p className="text-xl font-mono font-black text-lime-400">{activePass.passId || activePass.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-6">
                <div className="md:col-span-8 grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Route Name</p>
                    <p className="text-base font-bold text-white">{activePass.routeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Bus No.</p>
                    <p className="text-base font-bold text-white">{activePass.busNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Boarding Point</p>
                    <p className="text-base font-bold text-white">{activePass.boardingPoint}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Issue Date</p>
                    <p className="text-base font-bold text-white">{activePass.issueDate}</p>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-inner">
                  <img src={qrUrl} alt="Pass QR Code" className="w-44 h-44 object-contain" />
                  <p className="text-[11px] font-bold text-slate-700 mt-2">Scan for Bus Conductor Verification</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left">
              <h3 className="text-lg font-black text-slate-900 mb-4">Pass Application History</h3>
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{app.id}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{app.routeName} • {app.boardingPoint}</p>
                    </div>

                    <button
                      onClick={() => setSelectedPassId(app.id)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      View Pass & QR
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ADMIN CONSOLE TAB */}
        {activeTab === 'admin' && isLoggedIn && userRole === 'admin' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-10">
            <div>
              <span className="bg-lime-500/10 border border-lime-500/30 text-lime-700 font-bold text-xs px-3 py-1 rounded-full">
                🛡️ Verified Admin Portal
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-2">Transport Admin Console</h2>
              <p className="text-slate-600 font-medium text-sm">Review student applications, approve digital passes, or add new vehicle routes.</p>
            </div>

            {/* Interactive Route Builder */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-lime-600" /> Interactive Route Builder & Location Marking
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Route Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Salt Lake Sector V Express"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bus Assigned</label>
                      <input 
                        type="text"
                        placeholder="Bus 19C"
                        value={newRoute.busNo}
                        onChange={(e) => setNewRoute({...newRoute, busNo: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Departure Time</label>
                      <input 
                        type="text"
                        placeholder="08:15 AM"
                        value={newRoute.departure}
                        onChange={(e) => setNewRoute({...newRoute, departure: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Location</label>
                    <input 
                      type="text"
                      placeholder="e.g. Karunamoyee Bus Terminus"
                      value={newRoute.startPoint}
                      onChange={(e) => setNewRoute({...newRoute, startPoint: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <button 
                    onClick={handleAddRoute}
                    className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-black rounded-xl shadow-md transition-all text-sm mt-4"
                  >
                    + Publish Interactive Route
                  </button>
                </div>

                <div className="lg:col-span-7">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Live Map Preview</label>
                  <div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100">
                    <iframe
                      title="Route Preview"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(newRoute.startPoint || 'Kolkata')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Pass Applications Queue for Admin Approval */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
              <div className="p-4 bg-slate-900 text-white font-black text-sm uppercase flex justify-between items-center">
                <span>Student Pass Applications Queue</span>
                <span className="bg-lime-500 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                  {applications.filter(a => a.status === 'Under Review').length} Pending
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-bold">
                      <th className="p-4">Req ID</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Route & Boarding</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action / Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-slate-900">{app.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{app.fullName}</p>
                          <p className="text-xs text-slate-500">{app.rollId} ({app.department})</p>
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          <p>{app.routeName}</p>
                          <p className="text-xs text-slate-500">Stop: {app.boardingPoint}</p>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {app.status === 'Under Review' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleAdminStatusChange(app.id, 'Approved')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleAdminStatusChange(app.id, 'Rejected')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left border border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-1">
              {authMode === 'login' ? 'Portal Login' : 'Create Account'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Admin Credential: <span className="font-mono font-bold text-slate-800">admin@unigo.com</span> / <span className="font-mono font-bold text-slate-800">admin123</span>
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Campus Role</label>
                  <select
                    value={authForm.selectedRole}
                    onChange={(e) => setAuthForm({...authForm, selectedRole: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty / Staff</option>
                  </select>
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lakshya Jaiswal"
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm({...authForm, fullName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email / ID</label>
                <input 
                  type="email" 
                  required
                  placeholder="admin@unigo.com or student@college.edu"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-lime-400 font-black rounded-xl shadow-lg transition-all text-sm mt-2"
              >
                {authMode === 'login' ? 'Login to Portal' : 'Register Account'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-blue-600 font-bold hover:underline"
              >
                {authMode === 'login' ? 'Register New Account' : 'Back to Login'}
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 font-bold hover:text-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 UniGo Mobility — Campus Transport Services</p>
          <p className="text-xs text-slate-500">Secure & Paperless Digital Transit System</p>
        </div>
      </footer>

    </div>
  );
}