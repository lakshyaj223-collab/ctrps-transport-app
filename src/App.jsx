import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight, Bus, Check, CheckCircle2, ChevronRight, Clock3, FileCheck2,
  IdCard, LogIn, LogOut, MapPin, Menu, Route as RouteIcon, Search,
  ShieldCheck, UserRound, Users, X, XCircle,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from 'react-leaflet'
import heroBusImg from './assets/hero-bus.png.png'

const API_BASE = 'http://localhost:5000/api'
const CURRENT_APPLICATION_KEY = 'ctrps-current-application'
const SESSION_KEY = 'ctrps-user-session'
const PROFILE_KEY = 'ctrps-user-profile'
const PASS_METADATA_KEY = 'ctrps-pass-metadata'
const ROUTE_METADATA_KEY = 'ctrps-route-metadata'

const routeColors = [
  'bg-indigo-600', 'bg-slate-700', 'bg-slate-500', 'bg-indigo-400'
]

const fallbackCoordinates = (index) => {
  const centers = [
    [[22.5726, 88.3639], [22.578, 88.37], [22.585, 88.365], [22.59, 88.375]],
    [[22.565, 88.35], [22.57, 88.342], [22.58, 88.35], [22.59, 88.36]],
    [[22.56, 88.38], [22.568, 88.39], [22.58, 88.385], [22.59, 88.375]],
  ]
  return centers[index % centers.length]
}

const parseCoordinates = (value, fallback) => {
  if (Array.isArray(value) && value.length) return value
  if (typeof value === 'string') { try { const parsed = JSON.parse(value); if (Array.isArray(parsed) && parsed.length) return parsed } catch { /* use fallback */ } }
  return fallback
}

const normalizeRoute = (route, index, metadata = {}) => ({
  name: route.route_name,
  code: String(route.route_id),
  bus: route.bus_no,
  timing: route.time,
  stops: String(route.stops || '').split('->').map((stop) => stop.trim()).filter(Boolean),
  fee: route.fee,
  color: routeColors[index % routeColors.length],
  coordinates: parseCoordinates(route.coordinates, metadata[String(route.route_id)]?.coordinates || fallbackCoordinates(index))
})

const normalizePass = (pass, metadata = {}) => ({
  ...pass,
  ...(metadata[pass.id] || {}),
  status: pass.status,
  fullName: pass.name,
  rollId: pass.collegeId,
  routeName: pass.route,
  passId: pass.id,
  submittedAt: pass.appliedOn
})

const initialForm = { fullName: '', rollId: '', category: 'Student', department: '', boardingPoint: '', duration: '1 Month', phone: '', address: '', routeCode: '', confirmed: false }

const readPassMetadata = () => {
  try { return JSON.parse(localStorage.getItem(PASS_METADATA_KEY) || '{}') } catch { return {} }
}

const readRouteMetadata = () => {
  try { return JSON.parse(localStorage.getItem(ROUTE_METADATA_KEY) || '{}') } catch { return {} }
}

const stopIcon = L.divIcon({ className: 'ctrps-stop-pin', html: '<span style="display:block;width:16px;height:16px;background:#4f46e5;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(15,23,42,.35)"></span>', iconSize: [22, 22], iconAnchor: [11, 11] })

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
  })
  
  const user = currentUser
  const setUser = setCurrentUser
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const authOpen = isLoginModalOpen
  const setAuthOpen = setIsLoginModalOpen
  const [authMode, setAuthMode] = useState('login')
  
  const [routes, setRoutes] = useState([])
  const [routeMetadata, setRouteMetadata] = useState(readRouteMetadata)
  const [applications, setApplications] = useState([])
  const [passMetadata, setPassMetadata] = useState(readPassMetadata)
  const [currentId, setCurrentId] = useState(() => localStorage.getItem(CURRENT_APPLICATION_KEY) || '')
  const [form, setForm] = useState(() => ({
    ...initialForm,
    fullName: user?.name || '',
    rollId: user?.collegeId || '',
    category: user?.category || user?.role || initialForm.category,
    department: user?.department || '',
    phone: user?.phone || ''
  }))
  const [notice, setNotice] = useState('')
  const [adminSearch, setAdminSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadData = async () => {
      try {
        const [routesResponse, passesResponse] = await Promise.all([
          fetch(`${API_BASE}/routes`),
          fetch(`${API_BASE}/passes`)
        ]);
        if (!routesResponse.ok || !passesResponse.ok) throw new Error('Unable to load data from the transport server.')
        const [routeData, passData] = await Promise.all([routesResponse.json(), passesResponse.json()])
        if (!cancelled) {
          const normalizedRoutes = routeData.map((route, index) => normalizeRoute(route, index, readRouteMetadata()))
          setRoutes(normalizedRoutes)
          setForm((current) => current.routeCode ? current : { ...current, routeCode: normalizedRoutes[0]?.code || '' })
          setApplications(passData.map((pass) => normalizePass(pass, readPassMetadata())))
        }
      } catch (error) {
        if (!cancelled) setNotice(error.message || 'Unable to connect to the transport server.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  useEffect(() => { localStorage.setItem(PASS_METADATA_KEY, JSON.stringify(passMetadata)) }, [passMetadata])
  useEffect(() => { localStorage.setItem(ROUTE_METADATA_KEY, JSON.stringify(routeMetadata)) }, [routeMetadata])

  useEffect(() => {
    if (currentId) localStorage.setItem(CURRENT_APPLICATION_KEY, currentId);
    else localStorage.removeItem(CURRENT_APPLICATION_KEY)
  }, [currentId])

  const userPasses = applications.filter((app) =>
    (user?.collegeId && String(app.rollId || app.collegeId || '').toLowerCase() === String(user.collegeId).toLowerCase()) ||
    (user?.name && String(app.fullName || app.name || '').toLowerCase() === String(user.name).toLowerCase())
  )
  const approvedPass = userPasses.find((app) => app.status === 'Approved')
  const currentApplication = userPasses.find((app) => app.id === currentId) || userPasses[0]
  
  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((a) => ['Pending', 'Submitted', 'Under Review', 'Renewal Requested'].includes(a.status)).length,
    approved: applications.filter((a) => a.status === 'Approved').length
  }), [applications])

  const filteredApplications = applications.filter((app) =>
    [app.fullName, app.rollId, app.routeName].some((val) => (val || '').toLowerCase().includes(adminSearch.toLowerCase()))
  )

  const navigate = (tab) => {
    if (tab === 'admin' && user?.role !== 'admin') {
      setActiveTab('home'); setMobileMenuOpen(false); setNotice('Admin access is restricted to authorized administrators.'); return
    }
    if ((tab === 'apply' || tab === 'pass') && !user) {
      setAuthMode('login'); setAuthOpen(true); setNotice('Please log in to access your transport pass.'); return
    }
    setActiveTab(tab); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAuthSuccess = (sessionUser) => {
    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setForm((current) => ({
      ...current,
      fullName: sessionUser.name || '',
      rollId: sessionUser.collegeId || '',
      category: sessionUser.category || sessionUser.role || 'Student',
      department: sessionUser.department || '',
      phone: sessionUser.phone || ''
    }));
    setAuthOpen(false);
    setNotice(`Welcome, ${sessionUser.name}.`)
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveTab('home');
    setNotice('You have been logged out.')
  }

  const submitApplication = async (event) => {
    event.preventDefault()
    const selectedRoute = routes.find((route) => route.code === form.routeCode)
    if (!selectedRoute) { setNotice('Please select an available route.'); return }
    try {
      const response = await fetch(`${API_BASE}/passes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.fullName, collegeId: form.rollId, category: form.category, department: form.department, route: selectedRoute.name, boardingPoint: form.boardingPoint, duration: form.duration, phone: form.phone, address: form.address })
      })
      if (!response.ok) throw new Error('Unable to submit the pass application.')
      const responseData = await response.json()
      const application = normalizePass({ ...responseData, status: responseData.status || 'Submitted' }, passMetadata)
      const metadata = { ...passMetadata, [application.id]: { department: form.department, boardingPoint: form.boardingPoint, duration: form.duration, phone: form.phone, address: form.address, busNumber: selectedRoute.bus, remarks: '' } }
      setPassMetadata(metadata)
      setApplications((current) => [normalizePass({ ...application, status: application.status }, metadata), ...current]);
      setCurrentId(application.id);
      setNotice('Application submitted successfully. You can track it in My Pass.');
      navigate('pass')
    } catch (error) { setNotice(error.message || 'Unable to submit the pass application.') }
  }

  const updateStatus = async (id, status, remarks = '') => {
    try {
      const response = await fetch(`${API_BASE}/passes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks })
      })
      if (!response.ok) throw new Error('Unable to update application status.')
      const refreshed = await fetch(`${API_BASE}/passes`)
      if (!refreshed.ok) throw new Error('Application updated, but the list could not be refreshed.')
      const metadata = { ...passMetadata, [id]: { ...(passMetadata[id] || {}), remarks } }
      setPassMetadata(metadata)
      setApplications((await refreshed.json()).map((pass) => normalizePass(pass, metadata)));
      setNotice(`Application ${status.toLowerCase()} successfully.`)
    } catch (error) { setNotice(error.message || 'Unable to update application status.') }
  }

  const refreshRoutes = async () => {
    const response = await fetch(`${API_BASE}/routes`)
    if (!response.ok) throw new Error('Unable to refresh routes.')
    const data = await response.json()
    setRoutes(data.map((route, index) => normalizeRoute(route, index, routeMetadata)))
  }

  const addRoute = async (routeForm) => {
    if (user?.role !== 'admin') { setNotice('Admin access is required to manage routes.'); return }
    try {
      const stops = routeForm.stops.split(',').map((stop) => stop.trim()).filter(Boolean)
      const response = await fetch(`${API_BASE}/routes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_name: routeForm.name, source: stops[0] || routeForm.name, destination: stops[stops.length - 1] || 'College', stops: stops.join(' -> '), bus_no: routeForm.bus, time: routeForm.timing, fee: routeForm.fee, coordinates: JSON.stringify(routeForm.coordinates || []) })
      })
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Unable to add route.') }
      const created = await response.json()
      const nextMetadata = { ...routeMetadata, [String(created.route_id)]: { coordinates: routeForm.coordinates || [] } }
      setRouteMetadata(nextMetadata)
      setRoutes((current) => [...current, normalizeRoute({ ...created, coordinates: routeForm.coordinates }, current.length, nextMetadata)])
      setNotice('New route added successfully.')
    } catch (error) { setNotice(error.message || 'Unable to add route.') }
  }

  const deactivateRoute = async (routeId) => {
    if (user?.role !== 'admin') { setNotice('Admin access is required to manage routes.'); return }
    try {
      const response = await fetch(`${API_BASE}/routes/${encodeURIComponent(routeId)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Unable to deactivate route.')
      const nextMetadata = { ...routeMetadata }
      delete nextMetadata[String(routeId)]
      setRouteMetadata(nextMetadata)
      await refreshRoutes(); setNotice('Route deactivated successfully.')
    } catch (error) { setNotice(error.message || 'Unable to deactivate route.') }
  }

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'routes', label: 'Routes' },
    { id: 'apply', label: 'Apply Pass' },
    { id: 'pass', label: 'My Pass' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel' }] : [])
  ]

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
          <button onClick={() => navigate('home')} className="flex items-center gap-3 text-left">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-950/50">
              <Bus size={23} />
            </span>
            <span>
            <span className="block text-lg font-black tracking-tight text-slate-900">CTRPS</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Campus Mobility</span>
            </span>
          </button>
          
          <div className="hidden items-center gap-2 lg:flex">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => <NavButton key={item.id} item={item} activeTab={activeTab} navigate={navigate} />)}
            </nav>
            {user ? (
              <div className="ml-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <UserRound size={16} />
                </span>
                <span className="text-left">
                  <span className="block text-xs font-black text-slate-800">{user.name}</span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{user.category || user.role}</span>
                </span>
                <button onClick={handleLogout} className="ml-1 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="ml-3 flex items-center gap-2">
                <button onClick={() => { setAuthMode('login'); setAuthOpen(true) }} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900">Log in</button>
                <button onClick={() => { setAuthMode('register'); setAuthOpen(true) }} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500">Register</button>
              </div>
            )}
          </div>
          
          <button className="rounded-xl p-2 text-slate-600 lg:hidden" onClick={() => setMobileMenuOpen((open) => !open)}>
            <Menu />
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 sm:px-8 lg:hidden">
            {navItems.map((item) => <NavButton key={item.id} item={item} activeTab={activeTab} navigate={navigate} mobile />)}
            <div className="mt-3 border-t border-slate-200 pt-3">
              {user ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <UserRound size={17} className="text-blue-600" />{user.name} · {user.category || user.role}
                  </span>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-rose-600">
                    <LogOut size={15} />Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setAuthMode('login'); setAuthOpen(true); setMobileMenuOpen(false) }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700">
                    <LogIn className="mr-2 inline" size={16} />Log in
                  </button>
                  <button onClick={() => { setAuthMode('register'); setAuthOpen(true); setMobileMenuOpen(false) }} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white">
                    Register
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="w-full px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        {notice && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-400">
            <span className="flex items-center gap-2"><CheckCircle2 size={18} />{notice}</span>
            <button onClick={() => setNotice('')}><X size={17} /></button>
          </div>
        )}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm font-bold text-zinc-500">Loading transport data...</div>
        ) : (
          <>
            {activeTab === 'home' && <Home navigate={navigate} stats={stats} routesCount={routes.length} />}
            {activeTab === 'routes' && <RoutesView navigate={navigate} routes={routes} />}
            {activeTab === 'apply' && <ApplyView form={form} setForm={setForm} submitApplication={submitApplication} routes={routes} />}
            {activeTab === 'pass' && <PassView application={currentApplication} approvedPass={approvedPass} userPasses={userPasses} navigate={navigate} onRequestRenewal={(id) => updateStatus(id || currentApplication?.id, 'Renewal Requested')} onApplyAgain={() => navigate('apply')} />}
            {activeTab === 'admin' && user?.role === 'admin' && <AdminView applications={filteredApplications} stats={stats} search={adminSearch} setSearch={setAdminSearch} updateStatus={updateStatus} routes={routes} addRoute={addRoute} deactivateRoute={deactivateRoute} />}
          </>
        )}
      </main>

      <footer className="w-full border-t border-slate-200 bg-white">
        <div className="flex w-full flex-col gap-2 px-4 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>© {new Date().getFullYear()} CTRPS · College Transport Services</p>
          <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> Secure and paperless campus travel</p>
        </div>
      </footer>

      {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />}
    </div>
  )
}

function NavButton({ item, activeTab, navigate, mobile = false }) {
  return (
    <button
      onClick={() => navigate(item.id)}
      className={`${mobile ? 'block w-full rounded-xl px-3 py-3 text-left' : 'rounded-xl px-4 py-2'} text-sm font-bold transition ${
        activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {item.label}
    </button>
  )
}

function PageHeading({ eyebrow, title, text }) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-500">{eyebrow}</p>
      <h1 className="text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl">{title}</h1>
      {text && <p className="mt-3 max-w-2xl leading-7 text-zinc-400">{text}</p>}
    </div>
  )
}

function Home({ navigate, stats, routesCount }) {
  return (
    <div className="space-y-14">
      <section className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-2 lg:p-12">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-900">
            <Bus size={14} /> Campus Transport Portal · CTRPS
          </div>
          <h1 className="text-4xl font-black text-black">Campus Transport Portal <span className="text-blue-600">- CTRPS</span></h1>
          <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-800 lg:text-lg">
            Your single digital hub to discover college routes, apply for a bus pass, and travel with confidence—every day.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => navigate('apply')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500">
              Apply for a Pass <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('routes')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500">
              Explore Routes <RouteIcon size={18} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-xl">
          <img src={heroBusImg} alt="Campus Transport" className="mx-auto h-auto max-h-80 w-full object-contain drop-shadow-lg" />
        </div>
      </section>

      <section className="rounded-3xl border border-blue-900/40 bg-blue-950 p-6 text-white shadow-xl sm:p-8">
        <div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">Quick status</p><h2 className="mt-2 text-2xl font-black text-zinc-100">Transport at a glance</h2></div>
        <div className="grid divide-y divide-zinc-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <QuickMetric label="Active routes" value={routesCount} icon={<RouteIcon size={18} />} />
          <QuickMetric label="Processed applications" value={stats.total} icon={<FileCheck2 size={18} />} />
          <QuickMetric label="Approved passes" value={stats.approved} icon={<CheckCircle2 size={18} />} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Feature icon={<RouteIcon />} title="Plan your route" text="Browse routes and stops that fit your daily campus commute." />
        <Feature icon={<FileCheck2 />} title="Apply in minutes" text="Submit your digital application without standing in a queue." />
        <Feature icon={<Bus />} title="Travel paperless" text="Keep your approved pass ready whenever you board." />
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        <Stat label="Active routes" value={routesCount} icon={<Bus />} />
        <Stat label="Applications processed" value={stats.total} icon={<Users />} />
        <Stat label="Digital passes approved" value={stats.approved} icon={<CheckCircle2 />} />
      </section>
    </div>
  )
}

function Feature({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-blue-900/40 bg-slate-900 p-6 text-white shadow-xl shadow-slate-300/30">
      <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-blue-900/60 text-blue-200">{icon}</div>
      <h3 className="font-extrabold text-white">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-blue-200">{text}</p>
    </div>
  )
}

function QuickMetric({ label, value, icon }) {
  return <div className="flex items-center justify-between gap-4 px-4 py-4 first:pl-0 last:pr-0"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-900/60 text-blue-200">{icon}</div><span className="text-sm font-medium text-blue-200">{label}</span></div><span className="text-2xl font-extrabold text-white">{value}</span></div>
}

function Stat({ label, value, icon }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-blue-900/40 bg-slate-900 p-5 text-white shadow-xl shadow-slate-300/30">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-900/60 text-blue-200">{icon}</div>
      <div>
        <div className="text-2xl font-extrabold text-white">{value}</div>
        <div className="text-xs font-medium uppercase tracking-wide text-blue-200">{label}</div>
      </div>
    </div>
  )
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click: (event) => onClick([event.latlng.lat, event.latlng.lng]) })
  return null
}

function RouteMap({ route, editable = false, coordinates = [], onAddPoint }) {
  const points = coordinates.length ? coordinates : route?.coordinates || fallbackCoordinates(0)
  const center = points[0] || [22.5726, 88.3639]
  return <MapContainer center={center} zoom={13} scrollWheelZoom className="h-72 w-full rounded-2xl sm:h-80">
    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {editable && <MapClickHandler onClick={onAddPoint} />}
    {points.length > 1 && <Polyline positions={points} pathOptions={{ color: '#4f46e5', weight: 5 }} />}
    {points.map((point, index) => <Marker key={`${point[0]}-${point[1]}-${index}`} position={point} icon={stopIcon} />)}
  </MapContainer>
}

function RoutesView({ navigate, routes }) {
  const [selectedCode, setSelectedCode] = useState(routes[0]?.code || '')
  const selectedRoute = routes.find((route) => route.code === selectedCode) || routes[0]
  return (
    <div>
      <PageHeading eyebrow="Find your way" title="College bus routes" text="Reliable connections between the places you live, learn, and belong." />
      {selectedRoute && <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl shadow-black/10 sm:p-6"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-500">Live route map</p><h2 className="mt-1 text-xl font-black text-zinc-100">{selectedRoute.name}</h2></div><select value={selectedRoute.code} onChange={(event) => setSelectedCode(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-bold text-zinc-200"><option value="">Select route</option>{routes.map((route) => <option key={route.code} value={route.code}>{route.name}</option>)}</select></div><RouteMap route={selectedRoute} /></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        {routes.map((route) => (
          <div key={route.code} className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-emerald-500/30">
            <div className={`h-1 ${route.color}`} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{route.code}</p>
                  <h2 className="mt-1 text-xl font-black text-zinc-100">{route.name}</h2>
                </div>
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{route.bus}</span>
              </div>
              <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <Info icon={<Clock3 size={17} />} label="Service timing" value={route.timing} />
                <Info icon={<IdCard size={17} />} label="Pass fee" value={route.fee} />
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-500">
                  <MapPin size={15} /> Intermediate stops
                </div>
                <div className="flex flex-wrap gap-2">
                  {route.stops.map((stop) => (
                    <span key={stop} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700">{stop}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => navigate('apply')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white transition hover:bg-indigo-600">
                Apply on this route <ChevronRight size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Info({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-indigo-600">{icon}</span>
      <div>
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="mt-1 font-bold text-slate-700">{value}</p>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block text-left">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">
        {label} {required && <span className="text-indigo-600">*</span>}
      </span>
      {children}
    </label>
  )
}

function ApplyView({ form, setForm, submitApplication, routes }) {
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const inputClass = "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-100 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
  const [reviewing, setReviewing] = useState(false)
  const submitOrReview = (event) => { if (!reviewing) { event.preventDefault(); setReviewing(true) } }
  
  return (
    <div className="w-full">
      <PageHeading eyebrow="Get moving" title="Apply for a bus pass" text="Complete the form below. Your application will be sent to the transport office for review." />
      <form onSubmit={reviewing ? submitApplication : submitOrReview} className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl shadow-black/10 sm:p-9">
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <FileCheck2 className="shrink-0" size={20} />Applications are usually reviewed within 1–2 working days.
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <input required value={form.fullName} onChange={update('fullName')} placeholder="e.g. Ananya Sharma" className={inputClass} />
          </Field>
          <Field label="College Roll / ID" required>
            <input required value={form.rollId} onChange={update('rollId')} placeholder="e.g. CS2024-042" className={inputClass} />
          </Field>
          <Field label="User category" required>
            <select required value={form.category} onChange={update('category')} className={inputClass}>
              <option>Student</option>
              <option>Staff</option>
              <option>Faculty</option>
            </select>
          </Field>
          <Field label="Preferred route" required>
            <select required value={form.routeCode} onChange={update('routeCode')} className={inputClass}>
              <option value="">Select an active route</option>
              {routes.map((route) => <option key={route.code} value={route.code}>{route.name} · {route.bus}</option>)}
            </select>
          </Field>
          <Field label="Department" required><input required value={form.department} onChange={update('department')} placeholder="e.g. Computer Science" className={inputClass} /></Field>
          <Field label="Boarding point" required><input required value={form.boardingPoint} onChange={update('boardingPoint')} placeholder="e.g. North Gate" className={inputClass} /></Field>
          <Field label="Pass duration" required><select required value={form.duration} onChange={update('duration')} className={inputClass}><option>1 Month</option><option>6 Months</option><option>1 Year</option></select></Field>
          <Field label="Contact number" required><input required type="tel" value={form.phone} onChange={update('phone')} placeholder="10-digit mobile number" className={inputClass} /></Field>
          <Field label="Home address" required><textarea required value={form.address} onChange={update('address')} placeholder="Enter your residential address" className={`${inputClass} min-h-24`} /></Field>
        </div>
        {reviewing && <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900"><p className="font-black">Review your application</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><p><b>Name:</b> {form.fullName}</p><p><b>College ID:</b> {form.rollId}</p><p><b>Route:</b> {routes.find((route) => route.code === form.routeCode)?.name}</p><p><b>Boarding:</b> {form.boardingPoint}</p><p><b>Duration:</b> {form.duration}</p><p><b>Contact:</b> {form.phone}</p><p className="sm:col-span-2"><b>Address:</b> {form.address}</p></div></div>}
<label className="mt-6 flex items-start gap-3 text-sm font-semibold text-slate-700"><input required type="checkbox" checked={form.confirmed} onChange={(event) => setForm((current) => ({ ...current, confirmed: event.target.checked }))} className="mt-1 h-4 w-4 accent-indigo-600" />I declare the details provided are accurate.</label>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button type="submit" disabled={!routes.length} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{reviewing ? 'Confirm & submit application' : 'Review application'} <ArrowRight size={18} /></button>{reviewing && <button type="button" onClick={() => setReviewing(false)} className="rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-extrabold text-slate-700">Edit details</button>}</div>
      </form>
    </div>
  )
}

function PassDetail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}

function formatApplicationDate(value) {
  if (!value) return 'Date unavailable'
  const raw = String(value).trim()
  const slashMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  const parsed = slashMatch ? new Date(Number(slashMatch[3]), Number(slashMatch[1]) - 1, Number(slashMatch[2])) : new Date(raw)
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleDateString()
}

function getExpiryDate(application) {
  const issueDate = new Date(application.submittedAt)
  if (Number.isNaN(issueDate.getTime())) return 'Pending approval'
  const months = application.duration === '1 Year' ? 12 : application.duration === '6 Months' ? 6 : 1
  issueDate.setMonth(issueDate.getMonth() + months)
  return issueDate.toLocaleDateString()
}

function PassView({ application: initialApplication, approvedPass, userPasses, navigate, onRequestRenewal, onApplyAgain }) {
  const [selectedPassId, setSelectedPassId] = useState(null)
  const passCardRef = useRef(null)
  if (!initialApplication && !userPasses.length) return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-400"><IdCard size={30} /></div>
      <h1 className="mt-5 text-3xl font-black text-zinc-100">No application yet</h1>
      <p className="mt-3 text-zinc-400">Apply for a route to see your application status and digital pass here.</p>
      <button onClick={() => navigate('apply')} className="mt-7 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500">Start an application</button>
    </div>
  )
  const defaultPass = approvedPass || userPasses[0]
  const application = userPasses.find((pass) => pass.id === selectedPassId) || defaultPass
  const isApproved = application.status === 'Approved';
  const isRejected = application.status === 'Rejected';
  const qrText = `PASS: ${application.passId || application.id}\nNAME: ${application.fullName}\nROLL: ${application.rollId}\nROUTE: ${application.routeName}\nSTATUS: ${application.status}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}&color=000000&bgcolor=ffffff`
  const viewDigitalPass = (passId) => {
    setSelectedPassId(passId)
    requestAnimationFrame(() => passCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const showLatestApprovedPass = () => {
    setSelectedPassId(null)
    requestAnimationFrame(() => passCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="w-full">
      <PageHeading eyebrow="Your travel wallet" title="My bus pass" text="Keep track of your application and access your pass whenever you need it." />
      <div ref={passCardRef} className="scroll-mt-24" />
      {isApproved && selectedPassId && <div className="mb-4 flex justify-end"><button onClick={showLatestApprovedPass} className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-extrabold text-blue-700 hover:bg-blue-50">Show Latest Approved Pass</button></div>}
      <div className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold ${isApproved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : isRejected ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
        <span className="mt-0.5">{isApproved ? <CheckCircle2 size={20} /> : isRejected ? <XCircle size={20} /> : <Clock3 size={20} />}</span><div><p>{isApproved ? 'Approved digital pass' : isRejected ? 'Application rejected' : 'Pending Verification'} <StatusBadge status={application.status} /></p>{!isApproved && <p className="mt-2 font-medium">Latest request: {application.fullName} · {application.routeName} · {application.id}</p>}</div>
      </div>
      {isApproved ? (
        <div className="overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-xl sm:p-7">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><Bus size={21} /></span>
              <div>
                <p className="font-black text-white">CTRPS</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Digital bus pass</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">ACTIVE</span>
          </div>
          <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Pass holder</p>
              <h2 className="mt-2 text-3xl font-black text-white">{application.fullName}</h2>
              <div className="mt-8 grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <PassDetail label="Pass number" value={application.passId} />
                <PassDetail label="College ID" value={application.rollId} />
                <PassDetail label="Category" value={application.category} />
                <PassDetail label="Department" value={application.department || 'General'} />
                <PassDetail label="Bus number" value={application.busNumber || 'Assigned by office'} />
                <PassDetail label="Route name" value={application.routeName} />
                <PassDetail label="Boarding point" value={application.boardingPoint || 'Central Stop'} />
                <PassDetail label="Issue date" value={formatApplicationDate(application.submittedAt)} />
                <PassDetail label="Expiry date" value={getExpiryDate(application)} />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <img src={qrUrl} alt="QR Pass" className="h-48 w-48 rounded-xl bg-white p-2" />
              <p className="mt-3 text-xs font-bold text-slate-600">Scan to verify this pass</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-blue-900/40 pt-5 sm:flex-row sm:justify-between"><span className="text-sm font-bold text-blue-200">Status: <StatusBadge status={application.status} /></span><div className="flex flex-wrap gap-3"><button onClick={() => window.print()} className="rounded-xl border border-blue-800 px-4 py-2.5 text-sm font-bold text-blue-100 hover:bg-blue-900/50">Print / Save PDF</button><button onClick={onRequestRenewal} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500">Request renewal / update route</button></div></div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/20 text-amber-400"><Clock3 /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{isRejected ? 'Application needs attention' : application.status === 'Expired' ? 'Pass expired' : application.status === 'Renewal Requested' ? 'Renewal request submitted' : 'Application under review'}</h2>
              <p className="mt-2 leading-7 text-slate-600">{isRejected ? 'This application was rejected by the transport office.' : application.status === 'Expired' ? 'Your pass has expired. Request a renewal or update your route to continue using campus transport.' : application.status === 'Renewal Requested' ? 'The transport office will review your renewal or route update request.' : 'Your request is safely in the queue. The transport office will update your status after verification.'}</p>
              {isRejected && application.remarks && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/20 p-3 text-sm font-semibold text-red-400"><b>Admin remarks:</b> {application.remarks}</div>}
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <PassDetail label="Applicant" value={application.fullName} />
                <PassDetail label="Route" value={application.routeName} />
                <PassDetail label="Submitted" value={formatApplicationDate(application.submittedAt)} />
                <PassDetail label="Application ID" value={application.id} />
              </div>
              {['Submitted', 'Under Review', 'Expired', 'Renewal Requested'].includes(application.status) && <button onClick={onRequestRenewal} className="mt-6 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500">Request pass renewal / update route</button>}
            </div>
          </div>
        </div>
      )}
      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">Activity timeline</p><h2 className="mt-1 text-2xl font-black text-zinc-100">Pass history</h2></div><button onClick={onApplyAgain} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500">Request Renewal / Apply Again</button></div>
        <div className="relative space-y-4 before:absolute before:bottom-5 before:left-4 before:top-5 before:w-px before:bg-slate-300">{userPasses.map((pass) => <div key={pass.id} className="relative pl-10"><span className={`absolute left-1.5 top-5 h-5 w-5 rounded-full border-4 border-slate-100 ${pass.status === 'Approved' ? 'bg-emerald-500' : pass.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} /><div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-white shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Application ID</p><p className="mt-1 font-black text-white">{pass.id}</p></div><StatusBadge status={pass.status} /></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><PassDetail label="Route" value={pass.routeName} /><PassDetail label="Date" value={formatApplicationDate(pass.submittedAt)} /><PassDetail label="Boarding point" value={pass.boardingPoint || 'Central Stop'} /></div>{pass.status === 'Rejected' && pass.remarks && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/20 p-3 text-sm font-semibold text-red-200"><b>Admin remarks:</b> {pass.remarks}</p>}{pass.status === 'Approved' && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => viewDigitalPass(pass.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-500">View Digital Pass</button><button onClick={() => onRequestRenewal(pass.id)} className="rounded-lg border border-blue-700 px-3 py-2 text-xs font-extrabold text-blue-200 hover:bg-blue-900/50">Request renewal / update route</button></div>}</div></div>)}</div>
      </section>
    </div>
  )
}

function AdminStat({ label, value, icon, color }) {
  const styles = { blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600' };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${styles[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-slate-950">{value}</p>
        <p className="text-xs font-bold text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = { Submitted: 'border border-slate-200 bg-slate-100 text-slate-700', Pending: 'border border-amber-200 bg-amber-50 text-amber-700', 'Under Review': 'border border-amber-200 bg-amber-50 text-amber-700', Approved: 'border border-emerald-200 bg-emerald-50 text-emerald-700', Rejected: 'border border-red-200 bg-red-50 text-red-700', Expired: 'border border-slate-200 bg-slate-100 text-slate-700', 'Renewal Requested': 'border border-sky-200 bg-sky-50 text-sky-700' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles[status]}`}>{status}</span>
}

function ManageRoutes({ routes, addRoute, deactivateRoute }) {
  const [form, setForm] = useState({ name: '', bus: '', timing: '', stops: '', fee: '', coordinates: [] })
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const addPoint = (point) => setForm((current) => ({ ...current, coordinates: [...current.coordinates, point] }))
  const removeLastPoint = () => setForm((current) => ({ ...current, coordinates: current.coordinates.slice(0, -1) }))
  const submit = async (event) => { event.preventDefault(); await addRoute(form); setForm({ name: '', bus: '', timing: '', stops: '', fee: '', coordinates: [] }) }
  return <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Fleet operations</p><h2 className="mt-2 text-2xl font-black text-slate-950">Manage Routes</h2><p className="mt-1 text-sm text-slate-500">Add active bus routes or deactivate routes that are no longer in service.</p></div>
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Field label="Route Name" required><input required value={form.name} onChange={update('name')} placeholder="North Campus Loop" /></Field><Field label="Bus No" required><input required value={form.bus} onChange={update('bus')} placeholder="BUS-12" /></Field><Field label="Timing" required><input required value={form.timing} onChange={update('timing')} placeholder="07:30 AM" /></Field><Field label="Stops" required><input required value={form.stops} onChange={update('stops')} placeholder="Gate, Library, College" /></Field><Field label="Fee" required><input required value={form.fee} onChange={update('fee')} placeholder="₹1,200 / semester" /></Field><div className="sm:col-span-2 lg:col-span-5"><div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-slate-700">Route waypoints</p><p className="text-xs text-slate-500">Click the map to place stops in order. {form.coordinates.length} point(s) selected.</p></div><button type="button" onClick={removeLastPoint} disabled={!form.coordinates.length} className="self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40">Undo last point</button></div><RouteMap coordinates={form.coordinates} editable onAddPoint={addPoint} /></div><button type="submit" disabled={!form.coordinates.length} className="sm:col-span-2 lg:col-span-5 mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Bus size={17} />Add route</button></form>
    <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-y border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">Route</th><th className="px-4 py-3">Bus</th><th className="px-4 py-3">Timing</th><th className="px-4 py-3">Stops</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{routes.map((route) => <tr key={route.code}><td className="px-4 py-3 font-extrabold text-slate-800">{route.name}</td><td className="px-4 py-3 text-slate-600">{route.bus}</td><td className="px-4 py-3 text-slate-600">{route.timing}</td><td className="max-w-xs px-4 py-3 text-slate-500">{route.stops.join(' · ')}</td><td className="px-4 py-3 text-right"><button onClick={() => deactivateRoute(route.code)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100">Deactivate</button></td></tr>)}</tbody></table>{routes.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No active routes found.</p>}</div>
  </section>
}

function AdminView({ applications, stats, search, setSearch, updateStatus, routes, addRoute, deactivateRoute }) {
  const [rejecting, setRejecting] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const visibleApplications = statusFilter === 'All' ? applications : applications.filter((app) => app.status === statusFilter)
  const openReject = (app) => { setRejecting(app); setRemarks('') }
  const confirmReject = async () => { if (!remarks.trim()) return; await updateStatus(rejecting.id, 'Rejected', remarks.trim()); setRejecting(null); setRemarks('') }
  return (
    <div>
      <PageHeading eyebrow="Operations center" title="Admin panel" text="Review applications and keep campus transport moving smoothly." />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat label="Total applications" value={stats.total} icon={<Users />} color="blue" />
        <AdminStat label="Pending review" value={stats.pending} icon={<Clock3 />} color="amber" />
        <AdminStat label="Approved passes" value={stats.approved} icon={<CheckCircle2 />} color="emerald" />
        <AdminStat label="Active routes" value={routes.length} icon={<RouteIcon />} color="indigo" />
      </div>
      <ManageRoutes routes={routes} addRoute={addRoute} deactivateRoute={deactivateRoute} />
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-black text-slate-950">Applications</h2>
            <p className="mt-1 text-xs text-slate-400">Approve or reject requests instantly.</p>
          </div>
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, ID, or route..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-3 text-sm sm:w-64" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700"><option>All</option><option>Submitted</option><option>Under Review</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Renewal Requested</option></select></div>
          </div>
        </div>
        {visibleApplications.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No applications match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Applicant</th>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-slate-900">{app.fullName}</p>
                      <p className="mt-1 text-xs text-slate-400">{app.rollId} · {app.id}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{app.routeName}</td>
                    <td className="px-5 py-4 text-slate-600">{app.category}</td>
                    <td className="px-5 py-4"><StatusBadge status={app.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {['Pending', 'Submitted', 'Under Review', 'Renewal Requested'].includes(app.status) ? (
                          <>
                            <button onClick={() => updateStatus(app.id, 'Approved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100"><Check size={14} />Approve</button>
                            <button onClick={() => openReject(app)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100"><X size={14} />Reject</button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Reviewed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {rejecting && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-rose-600">Application decision</p><h2 className="mt-2 text-xl font-black text-slate-950">Reject pass application</h2><p className="mt-1 text-sm text-slate-500">Add a reason so the applicant knows what to correct.</p></div><button onClick={() => setRejecting(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X /></button></div><label className="mt-6 block text-left"><span className="mb-2 block text-sm font-extrabold text-slate-700">Rejection remarks / reason <span className="text-rose-600">*</span></span><textarea autoFocus required value={remarks} onChange={(event) => setRemarks(event.target.value)} className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-rose-500 focus:outline-none" placeholder="Explain why this application was rejected..." /></label><div className="mt-5 flex justify-end gap-3"><button onClick={() => setRejecting(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button><button onClick={confirmReject} disabled={!remarks.trim()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Confirm rejection</button></div></div></div>}
    </div>
  )
}

function AuthModal({ mode, setMode, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', collegeId: '', email: '', phone: '', role: 'Student', department: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isRegister = mode === 'register'

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const endpoint = isRegister ? 'register' : 'login'
      const body = isRegister 
        ? { name: form.name, collegeId: form.collegeId, email: form.email, phone: form.phone, role: form.role, department: form.department, password: form.password }
        : { email: form.email, password: form.password }

      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error: Make sure Node backend (`node index.js`) is running on port 5000.");
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Unable to ${endpoint}.`)

      if (isRegister) {
        const profile = { id: data.userId, name: data.name || form.name, email: data.email || form.email, collegeId: data.collegeId || form.collegeId, category: form.role, role: form.role, department: form.department, phone: form.phone }
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        onSuccess(profile)
      } else {
        let savedProfile = null
        try { savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { savedProfile = null }
        const loggedInUser = data.user || {}
        onSuccess({
          ...savedProfile,
          ...loggedInUser,
          category: savedProfile?.email === loggedInUser.email ? savedProfile.category : loggedInUser.role,
          collegeId: savedProfile?.email === loggedInUser.email ? savedProfile.collegeId : loggedInUser.collegeId
        })
      }
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">CTRPS account</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p className="mt-1 text-sm text-slate-500">{isRegister ? 'Register to manage your college transport pass.' : 'Log in to access your routes and digital pass.'}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X /></button>
        </div>

        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button onClick={() => { setMode('login'); setError('') }} className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${!isRegister ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Log in</button>
          <button onClick={() => { setMode('register'); setError('') }} className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${isRegister ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Register</button>
        </div>

        {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {isRegister && (
            <>
              <Field label="Full Name" required><input required value={form.name} onChange={update('name')} placeholder="e.g. Ananya Sharma" className={inputClass} /></Field>
              <Field label="College ID" required><input required value={form.collegeId} onChange={update('collegeId')} placeholder="e.g. CS2024-042" className={inputClass} /></Field>
            </>
          )}
          <Field label="Email Address" required><input required type="email" value={form.email} onChange={update('email')} placeholder="you@college.edu" className={inputClass} /></Field>
          {isRegister && <Field label="Mobile Number" required><input required type="tel" value={form.phone} onChange={update('phone')} placeholder="10-digit mobile number" className={inputClass} /></Field>}
          {isRegister && (
            <Field label="Category" required>
              <select required value={form.role} onChange={update('role')} className={inputClass}>
                <option>Student</option>
                <option>Staff</option>
                <option>Faculty</option>
              </select>
            </Field>
          )}
          {isRegister && <Field label="Department" required><input required value={form.department} onChange={update('department')} placeholder="e.g. Computer Science" className={inputClass} /></Field>}
          <Field label="Password" required><input required minLength={6} type="password" value={form.password} onChange={update('password')} placeholder="Enter your password" className={inputClass} /></Field>
          
          <button disabled={submitting} type="submit" className="sm:col-span-2 mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
