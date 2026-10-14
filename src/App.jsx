import React, { useState } from 'react';
import { Bus, MapPin, Calendar, Search, ShieldCheck, ArrowRight, User, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPassId, setSelectedPassId] = useState('REQ-1075');

  // Search Form State (FlixBus style)
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('Main Campus Gate');
  const [searchDate, setSearchDate] = useState('2026-10-15');

  // Sample Applications / Pass Data
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
      remarks: ''
    },
    {
      id: 'REQ-8616',
      passId: 'PASS-UNI-4410',
      fullName: 'Lakshya Jaiswal',
      rollId: 'uhsoet3024200',
      department: 'CSE',
      routeName: 'Kolkata Sector V',
      boardingPoint: 'Salt Lake Karunamoyee',
      busNumber: '08B',
      issueDate: '01/09/2026',
      status: 'Approved',
      remarks: ''
    },
    {
      id: 'REQ-3312',
      passId: '',
      fullName: 'Lakshya Jaiswal',
      rollId: 'uhsoet3024200',
      department: 'CSE',
      routeName: 'Howrah Terminal',
      boardingPoint: 'Howrah Station',
      busNumber: '15C',
      issueDate: '10/10/2026',
      status: 'Under Review',
      remarks: 'Documents verification pending'
    }
  ]);

  const activePass = applications.find(app => app.id === selectedPassId) || applications[0];

  // Scannable QR Payload
  const qrText = activePass ? `PASS: ${activePass.passId || activePass.id}\nNAME: ${activePass.fullName}\nROLL: ${activePass.rollId}\nROUTE: ${activePass.routeName}\nSTATUS: ${activePass.status}` : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}&color=000000&bgcolor=ffffff`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      
      {/* 1. Header & Navigation (UniGo FlixBus Style) */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-lime-500 text-slate-950 p-2 rounded-xl font-black flex items-center justify-center">
              <Bus className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white">
                UniGo <span className="text-lime-400">Mobility</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Campus Express Transport</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { id: 'home', label: 'Home' },
              { id: 'routes', label: 'Routes & Buses' },
              { id: 'apply', label: 'Apply Pass' },
              { id: 'mypass', label: 'My Travel Wallet' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-lime-500 text-slate-950 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            <div className="w-7 h-7 rounded-full bg-lime-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              LJ
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight">Lakshya Jaiswal</p>
              <p className="text-[10px] text-lime-400 font-semibold">Student Pass Active</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Body Content */}
      <main className="mb-auto">

        {/* --- HOME PAGE --- */}
        {activeTab === 'home' && (
          <div>
            {/* FlixBus Dark Ocean Hero Section */}
            <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column Text */}
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

                  {/* Right Column Banner Graphic */}
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

                {/* FlixBus-Style Interactive Search Box */}
                <div className="mt-10 bg-white text-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* From */}
                    <div className="text-left">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Boarding From</label>
                      <div className="relative">
                        <MapPin className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input 
                          type="text"
                          value={searchFrom}
                          onChange={(e) => setSearchFrom(e.target.value)}
                          placeholder="Enter Stop (e.g. Kolkata Gate)"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500"
                        />
                      </div>
                    </div>

                    {/* To */}
                    <div className="text-left">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Destination</label>
                      <div className="relative">
                        <Bus className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input 
                          type="text"
                          value={searchTo}
                          onChange={(e) => setSearchTo(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500"
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-left">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Travel Date</label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input 
                          type="date"
                          value={searchDate}
                          onChange={(e) => setSearchDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500"
                        />
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div>
                      <button 
                        onClick={() => setActiveTab('routes')}
                        className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Search className="w-5 h-5" />
                        <span>Search Bus Pass</span>
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* Feature & Metrics Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
                  <div className="w-12 h-12 rounded-xl bg-lime-500/10 text-lime-600 flex items-center justify-center mb-4">
                    <Bus className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1">Explore Campus Routes</h3>
                  <p className="text-sm text-slate-600 font-medium">Find all active shuttle buses, daily timetables, and exact boarding stops.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
                  <div className="w-12 h-12 rounded-xl bg-lime-500/10 text-lime-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1">Instant Pass Request</h3>
                  <p className="text-sm text-slate-600 font-medium">Apply for semester or monthly passes online without standing in long admin queues.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
                  <div className="w-12 h-12 rounded-xl bg-lime-500/10 text-lime-600 flex items-center justify-center mb-4">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1">Scannable QR Pass</h3>
                  <p className="text-sm text-slate-600 font-medium">Show your scannable QR digital pass directly from your phone while boarding.</p>
                </div>

              </div>
            </section>
          </div>
        )}

        {/* --- MY PASS / TRAVEL WALLET PAGE --- */}
        {(activeTab === 'mypass' || activeTab === 'home') && activeTab === 'mypass' && (
          <section className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            
            {/* Active Pass Card Display */}
            {activePass && (
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

                {/* Pass Details & QR Code */}
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

                  {/* QR Code Container */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-inner">
                    <img src={qrUrl} alt="Pass QR Code" className="w-44 h-44 object-contain" />
                    <p className="text-[11px] font-bold text-slate-700 mt-2">Scan for Bus Conductor Verification</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pass History Activity Timeline */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left">
              <h3 className="text-lg font-black text-slate-900 mb-4">Pass Application History</h3>
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{app.id}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          app.status === 'Under Review' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{app.routeName} • {app.boardingPoint}</p>
                    </div>

                    {app.status === 'Approved' && (
                      <button
                        onClick={() => setSelectedPassId(app.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                        View Pass & QR
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </section>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 UniGo Mobility — Campus Transport Services</p>
          <p className="text-xs text-slate-500">Secure & Paperless Digital Transit System</p>
        </div>
      </footer>

    </div>
  );
}