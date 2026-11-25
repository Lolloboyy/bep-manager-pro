import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight,
  BookOpen, BriefcaseBusiness, Calculator, CheckCircle2, ChevronDown,
  CircleHelp, Database, Download, FileChartColumn, FileSpreadsheet,
  Gauge, History, LayoutDashboard, Lightbulb, Menu, Plus, RefreshCw, Save,
  ShieldCheck, SlidersHorizontal, Sparkles, Target, Trash2, TrendingUp,
  Wallet, X, Package,
} from 'lucide-react'
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import './App.css'

type Product = { id: string; name: string; price: number; variableCost: number; plannedUnits: number }
type AnalysisRequest = { fixedCosts: number; targetProfit: number; products: Product[] }
type ProductResult = { id: string; name: string; plannedUnits: number; unitContribution: number; salesMixPercent: number; revenue: number; variableCosts: number; contribution: number; bepAllocatedUnits: number | null }
type Analysis = {
  fixedCosts: number; targetProfit: number; totalPlannedUnits: number; totalRevenue: number;
  totalVariableCosts: number; totalContribution: number; weightedContributionPerUnit: number;
  contributionMarginRatio: number; averagePrice: number; averageVariableCost: number;
  bepUnitsExact: number | null; bepUnitsRounded: number | null; bepRevenue: number | null;
  profit: number; marginOfSafetyUnits: number | null; marginOfSafetyPercent: number | null;
  targetProfitUnitsExact: number | null; targetProfitUnitsRounded: number | null;
  isFeasible: boolean; productBreakdown: ProductResult[];
}
type SavedScenario = { id: number | string; name: string; createdAt: string; request: AnalysisRequest; result: Analysis }
type Page = 'overview' | 'simulator' | 'products' | 'history' | 'method'
type ScenarioControls = { price: number; variable: number; fixed: number; volume: number }

const API = 'http://localhost:8080/api'
const DRAFT_KEY = 'bep-manager-pro-draft-v1'
const HISTORY_KEY = 'bep-manager-pro-history-v1'
const initialRequest: AnalysisRequest = {
  fixedCosts: 4800,
  targetProfit: 2500,
  products: [
    { id: 'p1', name: 'Prodotto A', price: 25, variableCost: 10, plannedUnits: 150 },
    { id: 'p2', name: 'Prodotto B', price: 40, variableCost: 18, plannedUnits: 80 },
    { id: 'p3', name: 'Servizio C', price: 80, variableCost: 30, plannedUnits: 30 },
  ],
}
const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const eur2 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 })
const pct = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : `${number.format(value)}%`
const money = (value: number | null, exact = false) => value === null || !Number.isFinite(value) ? '—' : (exact ? eur2 : eur).format(value)
const clampNumber = (value: number, min = 0) => Number.isFinite(value) ? Math.max(min, value) : min

function calculate(request: AnalysisRequest): Analysis {
  const fixedCosts = clampNumber(request.fixedCosts)
  const targetProfit = clampNumber(request.targetProfit)
  const products = request.products.map((p) => ({
    ...p,
    price: clampNumber(p.price),
    variableCost: clampNumber(p.variableCost),
    plannedUnits: clampNumber(p.plannedUnits),
  }))
  const totalPlannedUnits = products.reduce((sum, p) => sum + p.plannedUnits, 0)
  const totalRevenue = products.reduce((sum, p) => sum + p.price * p.plannedUnits, 0)
  const totalVariableCosts = products.reduce((sum, p) => sum + p.variableCost * p.plannedUnits, 0)
  const totalContribution = totalRevenue - totalVariableCosts
  const weightedContributionPerUnit = totalPlannedUnits > 0 ? totalContribution / totalPlannedUnits : 0
  const contributionMarginRatio = totalRevenue > 0 ? totalContribution / totalRevenue : 0
  const averagePrice = totalPlannedUnits > 0 ? totalRevenue / totalPlannedUnits : 0
  const averageVariableCost = totalPlannedUnits > 0 ? totalVariableCosts / totalPlannedUnits : 0
  const isFeasible = weightedContributionPerUnit > 0 && contributionMarginRatio > 0 && totalPlannedUnits > 0
  const bepUnitsExact = isFeasible ? fixedCosts / weightedContributionPerUnit : null
  const bepUnitsRounded = bepUnitsExact === null ? null : Math.ceil(bepUnitsExact)
  const bepRevenue = isFeasible ? fixedCosts / contributionMarginRatio : null
  const profit = totalContribution - fixedCosts
  const marginOfSafetyUnits = bepUnitsExact === null ? null : totalPlannedUnits - bepUnitsExact
  const marginOfSafetyPercent = marginOfSafetyUnits === null || totalPlannedUnits <= 0 ? null : marginOfSafetyUnits / totalPlannedUnits * 100
  const targetProfitUnitsExact = isFeasible ? (fixedCosts + targetProfit) / weightedContributionPerUnit : null
  const targetProfitUnitsRounded = targetProfitUnitsExact === null ? null : Math.ceil(targetProfitUnitsExact)
  const productBreakdown = products.map((p): ProductResult => {
    const contribution = (p.price - p.variableCost) * p.plannedUnits
    const mix = totalPlannedUnits > 0 ? p.plannedUnits / totalPlannedUnits : 0
    return {
      id: p.id, name: p.name, plannedUnits: p.plannedUnits,
      unitContribution: p.price - p.variableCost,
      salesMixPercent: mix * 100,
      revenue: p.price * p.plannedUnits,
      variableCosts: p.variableCost * p.plannedUnits,
      contribution,
      bepAllocatedUnits: bepUnitsExact === null ? null : bepUnitsExact * mix,
    }
  })
  return {
    fixedCosts, targetProfit, totalPlannedUnits, totalRevenue, totalVariableCosts, totalContribution,
    weightedContributionPerUnit, contributionMarginRatio, averagePrice, averageVariableCost,
    bepUnitsExact, bepUnitsRounded, bepRevenue, profit, marginOfSafetyUnits,
    marginOfSafetyPercent, targetProfitUnitsExact, targetProfitUnitsRounded, isFeasible, productBreakdown,
  }
}

function chartRows(result: Analysis) {
  const maxUnits = Math.max(result.totalPlannedUnits * 1.3, (result.bepUnitsExact ?? 0) * 1.35, 20)
  return Array.from({ length: 9 }, (_, i) => {
    const units = maxUnits * i / 8
    const revenue = units * result.averagePrice
    const costs = result.fixedCosts + units * result.averageVariableCost
    return { units: Math.round(units), revenue, costs, fixed: result.fixedCosts }
  })
}

function App() {
  const [page, setPage] = useState<Page>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [companyName, setCompanyName] = useState('Azienda Demo S.r.l.')
  const [request, setRequest] = useState<AnalysisRequest>(initialRequest)
  const [analysis, setAnalysis] = useState<Analysis>(() => calculate(initialRequest))
  const [history, setHistory] = useState<SavedScenario[]>([])
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [serverCalculation, setServerCalculation] = useState(false)
  const [scenarioName, setScenarioName] = useState('Scenario senza titolo')
  const [controls, setControls] = useState<ScenarioControls>({ price: 0, variable: 0, fixed: 0, volume: 0 })
  const [showCompanyEdit, setShowCompanyEdit] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { request?: AnalysisRequest; companyName?: string }
        if (parsed.request?.products?.length) {
          setRequest(parsed.request)
          setAnalysis(calculate(parsed.request))
        }
        if (parsed.companyName) setCompanyName(parsed.companyName)
      }
      const localHistory = localStorage.getItem(HISTORY_KEY)
      if (localHistory) setHistory(JSON.parse(localHistory) as SavedScenario[])
    } catch {
      setNotice('Non è stato possibile recuperare alcuni dati locali. Puoi continuare con i valori di esempio.')
    } finally {
      setDraftLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (draftLoaded) localStorage.setItem(DRAFT_KEY, JSON.stringify({ request, companyName }))
  }, [request, companyName, draftLoaded])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setServerCalculation(true)
      try {
        const response = await fetch(`${API}/analysis`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request), signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const result = await response.json() as Analysis
        if (active) {
          setAnalysis(result)
          setBackendStatus('online')
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === 'AbortError')) {
          setAnalysis(calculate(request))
          setBackendStatus('offline')
        }
      } finally {
        if (active) setServerCalculation(false)
      }
    }, 300)
    return () => { active = false; controller.abort(); window.clearTimeout(timeout) }
  }, [request])

  useEffect(() => {
    let active = true
    fetch(`${API}/scenarios`)
      .then((r) => { if (!r.ok) throw new Error('API non disponibile'); return r.json() as Promise<SavedScenario[]> })
      .then((items) => { if (active) {
      const localItems = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as SavedScenario[]
      const serverIds = new Set(items.map((item) => String(item.id)))
      const localOnly = localItems.filter((item) => typeof item.id === 'string' && !serverIds.has(String(item.id)))
      const merged = [...items, ...localOnly].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setHistory(merged); localStorage.setItem(HISTORY_KEY, JSON.stringify(merged))
    } })
      .catch(() => { if (active) setBackendStatus((s) => s === 'checking' ? 'offline' : s) })
    return () => { active = false }
  }, [])

  const scenarioRequest = useMemo<AnalysisRequest>(() => ({
    fixedCosts: request.fixedCosts * (1 + controls.fixed / 100),
    targetProfit: request.targetProfit,
    products: request.products.map((p) => ({
      ...p,
      price: p.price * (1 + controls.price / 100),
      variableCost: p.variableCost * (1 + controls.variable / 100),
      plannedUnits: p.plannedUnits * (1 + controls.volume / 100),
    })),
  }), [request, controls])
  const scenarioAnalysis = useMemo(() => calculate(scenarioRequest), [scenarioRequest])
  const chartData = useMemo(() => chartRows(analysis), [analysis])

  const updateRequest = (patch: Partial<AnalysisRequest>) => setRequest((current) => ({ ...current, ...patch }))
  const updateProduct = (id: string, patch: Partial<Product>) => setRequest((current) => ({
    ...current, products: current.products.map((p) => p.id === id ? { ...p, ...patch } : p),
  }))
  const addProduct = () => setRequest((current) => ({
    ...current,
    products: [...current.products, { id: `p-${Date.now()}`, name: `Nuovo prodotto ${current.products.length + 1}`, price: 30, variableCost: 12, plannedUnits: 50 }],
  }))
  const removeProduct = (id: string) => setRequest((current) => ({ ...current, products: current.products.filter((p) => p.id !== id) }))

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const saveScenario = async () => {
    const promptedName = window.prompt('Dai un nome a questa analisi:', scenarioName)
    if (promptedName === null) return
    const name = promptedName.trim() || `Analisi ${new Date().toLocaleDateString('it-IT')}`
    setScenarioName(name)
    const payload = { name, request }
    try {
      const response = await fetch(`${API}/scenarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Salvataggio server non riuscito')
      const saved = await response.json() as SavedScenario
      setHistory((current) => {
        const next = [saved, ...current.filter((item) => String(item.id) !== String(saved.id))]
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
        return next
      })
      showNotice('Analisi salvata nel database del progetto.')
    } catch {
      const local: SavedScenario = { id: `local-${Date.now()}`, name, createdAt: new Date().toISOString(), request, result: calculate(request) }
      setHistory((current) => {
        const next = [local, ...current]
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
        return next
      })
      showNotice('Backend non raggiungibile: analisi salvata in questo browser.')
    }
  }

  const loadScenario = (item: SavedScenario) => {
    setRequest(item.request)
    setScenarioName(item.name)
    setPage('overview')
    showNotice(`Caricata l'analisi: ${item.name}`)
  }

  const deleteScenario = async (id: number | string) => {
    if (!window.confirm('Vuoi eliminare questa analisi dallo storico?')) return
    if (typeof id === 'number') {
      try { await fetch(`${API}/scenarios/${id}`, { method: 'DELETE' }) } catch { /* fallback locale */ }
    }
    setHistory((current) => {
      const next = current.filter((item) => String(item.id) !== String(id))
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }

  const exportCsv = () => {
    const rows = [
      ['BEP Manager Pro - Report di analisi'], ['Azienda', companyName], ['Data', new Date().toLocaleString('it-IT')], [],
      ['Indicatore', 'Valore'],
      ['Costi fissi', analysis.fixedCosts], ['Ricavi previsti', analysis.totalRevenue],
      ['Costi variabili', analysis.totalVariableCosts], ['Margine di contribuzione', analysis.totalContribution],
      ['BEP (unità equivalenti)', analysis.bepUnitsExact ?? 'Non raggiungibile'],
      ['BEP (fatturato)', analysis.bepRevenue ?? 'Non raggiungibile'], ['Utile/Perdita prevista', analysis.profit],
      ['Margine di sicurezza (%)', analysis.marginOfSafetyPercent ?? '—'],
      ['Unità per utile obiettivo', analysis.targetProfitUnitsRounded ?? 'Non raggiungibile'], [],
      ['Prodotto/Servizio', 'Prezzo', 'Costo variabile', 'Unità previste', 'Margine unitario', 'Contributo totale'],
      ...request.products.map((p) => [p.name, p.price, p.variableCost, p.plannedUnits, p.price - p.variableCost, (p.price - p.variableCost) * p.plannedUnits]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `BEP-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click()
    URL.revokeObjectURL(url)
    showNotice('Report CSV esportato.')
  }

  const resetDemo = () => {
    if (!window.confirm('Ripristinare i dati dimostrativi? I dati dello storico non verranno eliminati.')) return
    setRequest(initialRequest)
    setControls({ price: 0, variable: 0, fixed: 0, volume: 0 })
    showNotice('Dati dimostrativi ripristinati.')
  }

  const navItems: { id: Page; label: string; icon: typeof LayoutDashboard; caption: string }[] = [
    { id: 'overview', label: 'Panoramica', icon: LayoutDashboard, caption: 'Indicatori principali' },
    { id: 'simulator', label: 'Laboratorio', icon: SlidersHorizontal, caption: 'Simula le decisioni' },
    { id: 'products', label: 'Prodotti e servizi', icon: Package, caption: 'Margini e mix di vendita' },
    { id: 'history', label: 'Storico analisi', icon: History, caption: 'Scenari salvati' },
    { id: 'method', label: 'Metodo e formule', icon: BookOpen, caption: 'Come vengono i calcoli' },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Activity size={22} strokeWidth={2.5} /></div>
          <div><div className="brand-name">BEP Manager</div><div className="brand-edition">PRO · BUSINESS ANALYTICS</div></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Chiudi menu"><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switch" onClick={() => setShowCompanyEdit(true)}>
          <span className="workspace-avatar">{companyName.slice(0, 1).toUpperCase()}</span>
          <span className="workspace-copy"><strong>{companyName}</strong><small>Account dimostrativo</small></span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">AREA DI LAVORO</div>
        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false) }}>
              <Icon size={18} /><span>{item.label}</span>{item.id === 'simulator' && <span className="nav-pill">LIVE</span>}
            </button>
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <div className="tip-icon"><Lightbulb size={17} /></div>
          <strong>Un dato, una decisione.</strong>
          <p>Usa il Laboratorio per verificare l'effetto economico delle tue ipotesi prima di applicarle.</p>
          <button onClick={() => setPage('simulator')}>Apri simulatore <ArrowRight size={14} /></button>
        </div>
        <div className="sidebar-footer"><ShieldCheck size={15} /><span>Spazio di lavoro locale protetto</span></div>
      </aside>
      {mobileNav && <button className="mobile-scrim" aria-label="Chiudi menu" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Apri menu"><Menu size={19} /></button>
            <div className="breadcrumb">BEP MANAGER <span>/</span> <strong>{navItems.find((item) => item.id === page)?.label.toUpperCase()}</strong></div>
          </div>
          <div className="topbar-actions">
            <span className={`connection ${backendStatus}`}><i />{backendStatus === 'online' ? 'Backend connesso' : backendStatus === 'checking' ? 'Connessione…' : 'Modalità locale'}</span>
            <button className="button button-quiet" onClick={exportCsv}><Download size={16} /> <span>CSV</span></button>
            <button className="button button-outline" onClick={() => window.print()}><FileChartColumn size={16} /> <span>Report PDF</span></button>
            <button className="button button-primary" onClick={saveScenario}><Save size={16} /> <span>Salva analisi</span></button>
          </div>
        </header>

        <div className="content-wrap">
          {notice && <div className="toast"><CheckCircle2 size={16} />{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
          {page === 'overview' && <OverviewPage analysis={analysis} request={request} chartData={chartData} serverCalculation={serverCalculation} onPage={setPage} onReset={resetDemo} />}
          {page === 'simulator' && <SimulatorPage controls={controls} setControls={setControls} base={analysis} scenario={scenarioAnalysis} request={request} />}
          {page === 'products' && <ProductsPage request={request} analysis={analysis} updateRequest={updateRequest} updateProduct={updateProduct} addProduct={addProduct} removeProduct={removeProduct} />}
          {page === 'history' && <HistoryPage history={history} loadScenario={loadScenario} deleteScenario={deleteScenario} />}
          {page === 'method' && <MethodPage analysis={analysis} request={request} />}
        </div>
        <footer className="app-footer"><span>BEPMANAGER PRO <b>·</b> VERSIONE DIMOSTRATIVA 1.0</span><span>Analisi gestionale · I risultati dipendono dalle ipotesi inserite</span></footer>
      </main>

      {showCompanyEdit && <div className="modal-backdrop" onClick={() => setShowCompanyEdit(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><div><span className="eyebrow">WORKSPACE</span><h2>Impostazioni azienda</h2></div><button className="icon-button" onClick={() => setShowCompanyEdit(false)}><X size={18} /></button></div>
        <label className="field-label">Nome azienda</label>
        <input className="text-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={60} />
        <p className="field-hint">Il nome viene utilizzato nelle schermate e nei report esportati.</p>
        <div className="modal-actions"><button className="button button-primary" onClick={() => setShowCompanyEdit(false)}>Conferma</button></div>
      </div></div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, right }: { eyebrow: string; title: string; description: string; right?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{right && <div className="heading-actions">{right}</div>}</div>
}

function MetricCard({ label, value, sub, icon: Icon, tone = 'blue', trend }: { label: string; value: string; sub: string; icon: typeof Gauge; tone?: string; trend?: 'up' | 'down' }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={18} /></span></div><div className="metric-value">{value}</div><div className="metric-foot">{trend && (trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}<span>{sub}</span></div></div>
}

function OverviewPage({ analysis, request, chartData, serverCalculation, onPage, onReset }: { analysis: Analysis; request: AnalysisRequest; chartData: ReturnType<typeof chartRows>; serverCalculation: boolean; onPage: (page: Page) => void; onReset: () => void }) {
  const status = !analysis.isFeasible ? 'Non raggiungibile' : analysis.profit >= 0 ? 'Sopra il pareggio' : 'Sotto il pareggio'
  const progress = analysis.bepUnitsExact && analysis.totalPlannedUnits > 0 ? Math.min(100, analysis.totalPlannedUnits / analysis.bepUnitsExact * 100) : 0
  return <>
    <PageHeading eyebrow="CONTROLLO DI GESTIONE · PANORAMICA" title="La tua azienda, in equilibrio." description="Una lettura immediata di redditività, punto di pareggio e margine di sicurezza." right={<><button className="button button-outline" onClick={onReset}><RefreshCw size={15} /> Ripristina demo</button><button className="button button-primary" onClick={() => onPage('simulator')}><SlidersHorizontal size={16} /> Simula una decisione</button></>} />
    <div className="context-strip"><div className="context-dot"><Activity size={15} /></div><div><strong>Analisi attiva</strong><span>{request.products.length} prodotti/servizi · {integer.format(analysis.totalPlannedUnits)} unità previste · costi fissi {money(analysis.fixedCosts)}</span></div><div className="context-right"><span className={`status-chip ${analysis.profit >= 0 && analysis.isFeasible ? 'positive' : 'warning'}`}><i />{status}</span><span className="live-caption">{serverCalculation ? 'Aggiornamento…' : 'Dati aggiornati'}</span></div></div>

    <div className="metric-grid">
      <MetricCard label="Punto di pareggio" value={analysis.bepUnitsRounded === null ? 'N/D' : `${integer.format(analysis.bepUnitsRounded)} unità`} sub={analysis.bepRevenue === null ? 'Margine unitario non positivo' : `Fatturato ${money(analysis.bepRevenue)}`} icon={Target} tone="violet" />
      <MetricCard label="Utile / perdita prevista" value={money(analysis.profit)} sub={`Contributo totale ${money(analysis.totalContribution)}`} icon={Wallet} tone={analysis.profit >= 0 ? 'green' : 'orange'} trend={analysis.profit >= 0 ? 'up' : 'down'} />
      <MetricCard label="Margine di contribuzione" value={pct(analysis.contributionMarginRatio * 100)} sub={`${money(analysis.weightedContributionPerUnit, true)} per unità equivalente`} icon={TrendingUp} tone="blue" />
      <MetricCard label="Margine di sicurezza" value={pct(analysis.marginOfSafetyPercent)} sub={analysis.marginOfSafetyUnits === null ? 'Non calcolabile' : `${number.format(analysis.marginOfSafetyUnits)} unità oltre il BEP`} icon={ShieldCheck} tone={analysis.marginOfSafetyPercent !== null && analysis.marginOfSafetyPercent >= 0 ? 'green' : 'orange'} />
    </div>

    <div className="main-grid">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><div className="eyebrow">ANALISI COSTI-VOLUMI-RISULTATI</div><h2>Quando l'attività diventa profittevole?</h2><p>Ricavi e costi totali al variare delle unità vendute.</p></div><span className="mini-tag"><Activity size={13} /> Grafico BEP</span></div>
        <div className="chart-legend-note"><span><i className="legend-line revenue" /> Ricavi</span><span><i className="legend-line costs" /> Costi totali</span><span><i className="legend-line fixed" /> Costi fissi</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 14, right: 18, left: 6, bottom: 4 }}>
          <CartesianGrid stroke="#edf1f6" strokeDasharray="4 5" vertical={false} />
          <XAxis dataKey="units" tick={{ fontSize: 11, fill: '#8491a4' }} tickLine={false} axisLine={false} tickFormatter={(v) => integer.format(v)} label={{ value: 'Unità equivalenti vendute', position: 'insideBottom', offset: -2, fill: '#8491a4', fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11, fill: '#8491a4' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={42} />
          <Tooltip formatter={(v) => money(Number(v), true)} labelFormatter={(v) => `${integer.format(Number(v))} unità equivalenti`} contentStyle={{ border: '1px solid #e6ebf2', borderRadius: 12, boxShadow: '0 8px 30px #15243a12', fontSize: 12 }} />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ display: 'none' }} />
          <Line type="monotone" dataKey="revenue" name="Ricavi" stroke="#168b83" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="costs" name="Costi totali" stroke="#536b91" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="fixed" name="Costi fissi" stroke="#d4a247" strokeWidth={1.8} strokeDasharray="5 5" dot={false} />
          {analysis.bepUnitsExact !== null && <ReferenceLine x={analysis.bepUnitsExact} stroke="#8a6bd6" strokeDasharray="4 4" label={{ value: 'BEP', fill: '#8065c2', fontSize: 11, position: 'insideTopRight' }} />}
        </LineChart></ResponsiveContainer></div>
        <div className="chart-foot"><span>Le linee si basano sul mix di vendita previsto e su prezzi/costi medi ponderati.</span><button className="text-button" onClick={() => onPage('method')}>Come leggere il grafico <ArrowRight size={14} /></button></div>
      </section>

      <section className="panel health-panel">
        <div className="panel-heading compact"><div><div className="eyebrow">INDICATORE DI EQUILIBRIO</div><h2>Indice di copertura del BEP</h2></div><CircleHelp size={17} className="muted-icon" /></div>
        <div className="gauge-wrap"><div className="gauge-circle" style={{ '--progress': `${progress}%` } as CSSProperties & { '--progress': string }}><div className="gauge-inner"><strong>{analysis.bepUnitsExact === null ? '—' : `${Math.round(progress)}%`}</strong><span>del BEP coperto</span></div></div></div>
        <div className="gauge-summary"><span>Volume previsto</span><strong>{integer.format(analysis.totalPlannedUnits)} unità</strong></div>
        <div className="gauge-summary"><span>Volume di pareggio</span><strong>{analysis.bepUnitsRounded === null ? 'Non disponibile' : `${integer.format(analysis.bepUnitsRounded)} unità`}</strong></div>
        <div className={`insight-box ${analysis.profit >= 0 ? 'insight-good' : 'insight-alert'}`}>
          {analysis.profit >= 0 ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          <div><strong>{analysis.profit >= 0 ? 'Equilibrio raggiunto' : 'Attenzione: sotto il BEP'}</strong><p>{analysis.profit >= 0 ? `Il volume previsto supera il punto di pareggio di ${number.format(analysis.marginOfSafetyUnits ?? 0)} unità equivalenti.` : 'Con il mix e i volumi inseriti, il margine di contribuzione non copre ancora i costi fissi.'}</p></div>
        </div>
      </section>
    </div>

    <div className="bottom-grid">
      <section className="panel product-panel"><div className="panel-heading"><div><div className="eyebrow">COMPOSIZIONE DEL RISULTATO</div><h2>Contributo per prodotto/servizio</h2></div><button className="text-button" onClick={() => onPage('products')}>Gestisci prodotti <ArrowRight size={14} /></button></div>
        <div className="table-wrap"><table><thead><tr><th>PRODOTTO / SERVIZIO</th><th>PREZZO</th><th>MARGINE UNITARIO</th><th>MIX VENDITE</th><th>CONTRIBUTO TOTALE</th></tr></thead><tbody>
          {analysis.productBreakdown.slice(0, 5).map((p) => <tr key={p.id}><td><span className="product-dot">{p.name.slice(0, 1).toUpperCase()}</span><strong>{p.name}</strong></td><td>{money(request.products.find((v) => v.id === p.id)?.price ?? 0, true)}</td><td>{money(p.unitContribution, true)}</td><td><span className="mix-cell"><i><b style={{ width: `${Math.min(100, p.salesMixPercent)}%` }} /></i>{pct(p.salesMixPercent)}</span></td><td className="numeric-strong">{money(p.contribution)}</td></tr>)}
        </tbody></table></div>
      </section>
      <section className="panel target-panel"><div className="panel-heading"><div><div className="eyebrow">OBIETTIVO ECONOMICO</div><h2>Il prossimo traguardo</h2></div><Target size={18} className="muted-icon" /></div>
        <div className="target-number">{money(analysis.targetProfit)}</div><div className="target-caption">Utile obiettivo impostato</div>
        <div className="target-divider" />
        <div className="target-row"><span>Unità equivalenti necessarie</span><strong>{analysis.targetProfitUnitsRounded === null ? 'Non raggiungibile' : integer.format(analysis.targetProfitUnitsRounded)}</strong></div>
        <div className="target-row"><span>Unità previste oggi</span><strong>{integer.format(analysis.totalPlannedUnits)}</strong></div>
        <button className="button button-outline full-button" onClick={() => onPage('products')}>Modifica dati economici <ArrowRight size={15} /></button>
      </section>
    </div>
    <AutomaticInsights analysis={analysis} />
  </>
}

function AutomaticInsights({ analysis }: { analysis: Analysis }) {
  const lowestMargin = analysis.productBreakdown.length > 0
    ? [...analysis.productBreakdown].sort((a, b) => a.unitContribution - b.unitContribution)[0]
    : null
  const items = [
    { icon: analysis.profit >= 0 ? CheckCircle2 : AlertTriangle, tone: analysis.profit >= 0 ? 'good' : 'alert', title: analysis.profit >= 0 ? 'Risultato operativo positivo' : 'Risultato operativo negativo', body: analysis.profit >= 0 ? `Il margine di contribuzione copre i costi fissi e genera ${money(analysis.profit)} di risultato nel periodo.` : `Mancano ${money(Math.abs(analysis.profit))} per raggiungere il pareggio con le ipotesi attuali.` },
    { icon: ShieldCheck, tone: analysis.marginOfSafetyPercent !== null && analysis.marginOfSafetyPercent >= 10 ? 'good' : 'alert', title: 'Robustezza del volume previsto', body: analysis.marginOfSafetyPercent === null ? 'Inserisci quantità previste positive per stimare il margine di sicurezza.' : analysis.marginOfSafetyPercent >= 10 ? `Il margine di sicurezza è ${pct(analysis.marginOfSafetyPercent)}: il volume previsto ha un cuscinetto rispetto al BEP.` : `Il margine di sicurezza è ${pct(analysis.marginOfSafetyPercent)}: una riduzione contenuta delle vendite potrebbe annullare l'utile.` },
    { icon: Package, tone: 'neutral', title: lowestMargin ? `Margine unitario più basso: ${lowestMargin.name}` : 'Analisi prodotti', body: lowestMargin ? `Questa voce contribuisce per ${money(lowestMargin.unitContribution, true)} a unità equivalente. Valuta prezzo, costo diretto e ruolo strategico nel mix.` : 'Aggiungi prodotti o servizi per confrontare i margini.' },
  ]
  return <section className="panel insights-panel"><div className="panel-heading"><div><div className="eyebrow">DECISION SUPPORT · REGOLE DI ANALISI</div><h2>Segnali da non trascurare</h2><p>Indicazioni automatiche generate dai valori inseriti, da verificare con il contesto aziendale.</p></div><span className="mini-tag"><Sparkles size={13} /> Insight automatici</span></div><div className="insights-grid">{items.map((item) => { const Icon = item.icon; return <div className={`insight-card ${item.tone}`} key={item.title}><div className="insight-card-icon"><Icon size={17} /></div><div><strong>{item.title}</strong><p>{item.body}</p></div></div> })}</div></section>
}

function SimulatorPage({ controls, setControls, base, scenario, request }: { controls: ScenarioControls; setControls: (value: ScenarioControls) => void; base: Analysis; scenario: Analysis; request: AnalysisRequest }) {
  const delta = scenario.profit - base.profit
  const fields: { key: keyof ScenarioControls; label: string; min: number; max: number; step: number; hint: string }[] = [
    { key: 'price', label: 'Prezzo di vendita', min: -30, max: 30, step: 1, hint: 'Modifica tutti i prezzi nella stessa percentuale.' },
    { key: 'variable', label: 'Costi variabili unitari', min: -30, max: 50, step: 1, hint: 'Simula rincari o risparmi sui costi diretti.' },
    { key: 'fixed', label: 'Costi fissi', min: -30, max: 50, step: 1, hint: 'Simula affitto, personale, utenze e altri costi fissi.' },
    { key: 'volume', label: 'Volume di vendita', min: -50, max: 100, step: 1, hint: 'Simula una variazione della domanda o della capacità.' },
  ]
  return <>
    <PageHeading eyebrow="STRATEGY LAB · SIMULAZIONE" title="E se cambiassimo qualcosa?" description="Modifica le ipotesi e osserva in tempo reale l'effetto sul risultato economico. I dati originali non vengono alterati." right={<span className="mini-tag"><Sparkles size={14} /> Simulazione non distruttiva</span>} />
    <div className="sim-intro"><div className="sim-intro-icon"><SlidersHorizontal size={21} /></div><div><strong>Laboratorio delle decisioni</strong><p>Questa simulazione applica variazioni percentuali ai dati correnti. Puoi combinare più leve contemporaneamente e confrontare il risultato con lo scenario di partenza.</p></div></div>
    <div className="sim-grid">
      <section className="panel sim-controls"><div className="panel-heading"><div><div className="eyebrow">LEVE DI SIMULAZIONE</div><h2>Modifica le variabili</h2></div><button className="text-button" onClick={() => setControls({ price: 0, variable: 0, fixed: 0, volume: 0 })}><RefreshCw size={14} /> Azzera</button></div>
        {fields.map((field) => <div className="slider-field" key={field.key}><div className="slider-heading"><div><strong>{field.label}</strong><small>{field.hint}</small></div><div className={`slider-value ${controls[field.key] > 0 ? 'value-up' : controls[field.key] < 0 ? 'value-down' : ''}`}>{controls[field.key] > 0 ? '+' : ''}{controls[field.key]}%</div></div><input type="range" min={field.min} max={field.max} step={field.step} value={controls[field.key]} onChange={(e) => setControls({ ...controls, [field.key]: Number(e.target.value) })} /><div className="slider-limits"><span>{field.min}%</span><span>0%</span><span>+{field.max}%</span></div></div>)}
        <div className="sim-caveat"><CircleHelp size={16} /><span>Il modello mantiene costante il mix di vendita. Per ipotesi diverse per singolo prodotto, modifica i dati nella sezione Prodotti e servizi.</span></div>
      </section>
      <section className="panel sim-results"><div className="panel-heading"><div><div className="eyebrow">RISULTATO DELLO SCENARIO</div><h2>Confronto economico</h2></div><span className="live-tag"><i /> LIVE</span></div>
        <div className="comparison-head"><div><span>Scenario attuale</span><strong>{money(base.profit)}</strong></div><ArrowRight size={20} /><div><span>Scenario simulato</span><strong className={scenario.profit >= 0 ? 'text-green' : 'text-red'}>{money(scenario.profit)}</strong></div></div>
        <div className={`delta-banner ${delta >= 0 ? 'delta-positive' : 'delta-negative'}`}>{delta >= 0 ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}<div><strong>{delta >= 0 ? '+' : ''}{money(delta)}</strong><span>{delta >= 0 ? 'Miglioramento' : 'Peggioramento'} del risultato rispetto allo scenario attuale</span></div></div>
        <div className="result-list"><div><span>Punto di pareggio</span><strong>{scenario.bepUnitsRounded === null ? 'Non raggiungibile' : `${integer.format(scenario.bepUnitsRounded)} unità`}</strong></div><div><span>Fatturato previsto</span><strong>{money(scenario.totalRevenue)}</strong></div><div><span>Margine di contribuzione</span><strong>{pct(scenario.contributionMarginRatio * 100)}</strong></div><div><span>Margine di sicurezza</span><strong>{pct(scenario.marginOfSafetyPercent)}</strong></div><div><span>Utile obiettivo</span><strong>{money(request.targetProfit)}</strong></div></div>
        <div className="scenario-verdict"><Lightbulb size={17} /><div><strong>Lettura della simulazione</strong><p>{scenario.profit >= base.profit ? 'Con queste ipotesi il risultato economico migliora.' : 'Con queste ipotesi il risultato economico peggiora.'} {scenario.isFeasible ? `Il margine medio ponderato resta positivo (${money(scenario.weightedContributionPerUnit, true)} per unità equivalente).` : 'Attenzione: il margine medio ponderato non consente di raggiungere il pareggio.'}</p></div></div>
      </section>
    </div>
  </>
}

function ProductsPage({ request, analysis, updateRequest, updateProduct, addProduct, removeProduct }: { request: AnalysisRequest; analysis: Analysis; updateRequest: (patch: Partial<AnalysisRequest>) => void; updateProduct: (id: string, patch: Partial<Product>) => void; addProduct: () => void; removeProduct: (id: string) => void }) {
  return <>
    <PageHeading eyebrow="MODELLO ECONOMICO · INPUT" title="Prodotti, servizi e costi." description="Definisci il mix di vendita previsto. Il BEP viene calcolato usando il margine medio ponderato dei prodotti." right={<button className="button button-primary" onClick={addProduct}><Plus size={16} /> Aggiungi prodotto</button>} />
    <section className="panel fixed-cost-panel"><div className="fixed-cost-icon"><BriefcaseBusiness size={20} /></div><div className="fixed-cost-copy"><strong>Costi fissi mensili</strong><span>Costi che non variano direttamente con il numero di unità vendute (es. affitto, assicurazioni, stipendi fissi).</span></div><div className="fixed-cost-input"><span>€</span><input type="number" min="0" step="50" value={request.fixedCosts} onChange={(e) => updateRequest({ fixedCosts: clampNumber(Number(e.target.value)) })} /></div></section>
    <section className="panel editable-products"><div className="panel-heading"><div><div className="eyebrow">CATALOGO ECONOMICO</div><h2>Dettaglio prodotti e servizi</h2><p>Inserisci prezzi, costi variabili unitari e quantità previste nel periodo.</p></div><span className="count-badge">{request.products.length} voci</span></div>
      <div className="table-wrap"><table className="edit-table"><thead><tr><th>PRODOTTO / SERVIZIO</th><th>PREZZO UNITARIO (€)</th><th>COSTO VARIABILE (€)</th><th>UNITÀ PREVISTE</th><th>MARGINE UNITARIO</th><th></th></tr></thead><tbody>
        {request.products.map((p) => <tr key={p.id}><td><input className="cell-input name-cell" value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} aria-label="Nome prodotto" /></td><td><input className="cell-input" type="number" min="0" step="0.5" value={p.price} onChange={(e) => updateProduct(p.id, { price: clampNumber(Number(e.target.value)) })} aria-label="Prezzo unitario" /></td><td><input className="cell-input" type="number" min="0" step="0.5" value={p.variableCost} onChange={(e) => updateProduct(p.id, { variableCost: clampNumber(Number(e.target.value)) })} aria-label="Costo variabile" /></td><td><input className="cell-input" type="number" min="0" step="1" value={p.plannedUnits} onChange={(e) => updateProduct(p.id, { plannedUnits: clampNumber(Number(e.target.value)) })} aria-label="Unità previste" /></td><td><span className={`margin-pill ${p.price - p.variableCost > 0 ? 'positive' : 'negative'}`}>{money(p.price - p.variableCost, true)}</span></td><td><button className="icon-button danger-icon" onClick={() => removeProduct(p.id)} title="Elimina prodotto" disabled={request.products.length <= 1}><Trash2 size={16} /></button></td></tr>)}
      </tbody></table></div>
      {request.products.length === 0 && <div className="empty-state"><Package size={25} /><strong>Nessun prodotto inserito</strong><p>Aggiungi almeno un prodotto o servizio per calcolare il BEP.</p><button className="button button-primary" onClick={addProduct}>Aggiungi la prima voce</button></div>}
      <div className="table-footnote"><CircleHelp size={14} /> Il costo variabile deve includere i costi direttamente legati alla vendita di una singola unità. Tutti gli importi sono al netto di IVA, salvo diversa configurazione contabile.</div>
    </section>
    <div className="product-summary-grid"><div className="summary-tile"><span>Fatturato previsto</span><strong>{money(analysis.totalRevenue)}</strong></div><div className="summary-tile"><span>Costi variabili totali</span><strong>{money(analysis.totalVariableCosts)}</strong></div><div className="summary-tile"><span>Margine di contribuzione totale</span><strong>{money(analysis.totalContribution)}</strong></div><div className="summary-tile accent-tile"><span>Margine medio ponderato</span><strong>{money(analysis.weightedContributionPerUnit, true)}</strong></div></div>
  </>
}

function HistoryPage({ history, loadScenario, deleteScenario }: { history: SavedScenario[]; loadScenario: (item: SavedScenario) => void; deleteScenario: (id: number | string) => void }) {
  return <>
    <PageHeading eyebrow="TRACCIABILITÀ · CONFRONTO" title="Storico delle analisi." description="Conserva le ipotesi, confronta le simulazioni e riprendi un'analisi precedente." right={<span className="mini-tag"><Database size={14} /> {history.length} analisi salvate</span>} />
    {history.length === 0 ? <div className="panel empty-history"><div className="empty-icon"><History size={25} /></div><h2>Lo storico è ancora vuoto</h2><p>Salva un'analisi dalla barra superiore per conservarla e poterla riaprire in seguito.</p></div> : <div className="history-list">{history.map((item) => <div className="panel history-card" key={item.id}><div className="history-icon"><FileChartColumn size={19} /></div><div className="history-main"><strong>{item.name}</strong><span>{new Date(item.createdAt).toLocaleString('it-IT')} · {item.request.products.length} prodotti/servizi · costi fissi {money(item.request.fixedCosts)}</span></div><div className="history-result"><small>UTILE / PERDITA</small><strong className={item.result.profit >= 0 ? 'text-green' : 'text-red'}>{money(item.result.profit)}</strong></div><div className="history-actions"><button className="button button-outline" onClick={() => loadScenario(item)}>Apri analisi <ArrowRight size={14} /></button><button className="icon-button danger-icon" title="Elimina" onClick={() => deleteScenario(item.id)}><Trash2 size={16} /></button></div></div>)}</div>}
    <div className="history-note"><ShieldCheck size={16} /><span>Le analisi vengono salvate nel database locale quando il backend è attivo. In modalità locale, vengono conservate nel browser utilizzato.</span></div>
  </>
}

function MethodPage({ analysis, request }: { analysis: Analysis; request: AnalysisRequest }) {
  const formula = [
    { n: '01', title: 'Margine di contribuzione unitario', formula: 'Prezzo di vendita − Costo variabile unitario', explanation: 'Indica quanto resta da ogni vendita per coprire i costi fissi e, successivamente, generare utile.' },
    { n: '02', title: 'Margine medio ponderato', formula: 'Contributo totale ÷ Unità totali previste', explanation: 'Con più prodotti, il margine unitario viene ponderato sul mix di vendita previsto: ogni prodotto contribuisce in base alle quantità stimate.' },
    { n: '03', title: 'Punto di pareggio in unità equivalenti', formula: 'Costi fissi ÷ Margine medio ponderato', explanation: 'È il volume teorico in cui il risultato economico è pari a zero. Le unità sono equivalenti perché i prodotti possono avere prezzi e margini diversi.' },
    { n: '04', title: 'Punto di pareggio in fatturato', formula: 'Costi fissi ÷ Indice del margine di contribuzione', explanation: 'Mostra il fatturato necessario a coprire tutti i costi, mantenendo costante il mix di vendita.' },
    { n: '05', title: 'Margine di sicurezza', formula: '(Vendite previste − BEP) ÷ Vendite previste × 100', explanation: 'Misura di quanto possono diminuire le vendite, in percentuale, prima di raggiungere il punto di pareggio.' },
    { n: '06', title: "Quantità per l'utile obiettivo", formula: '(Costi fissi + Utile desiderato) ÷ Margine medio ponderato', explanation: 'Stima quante unità equivalenti occorre vendere per coprire i costi e ottenere l’utile desiderato.' },
  ]
  return <>
    <PageHeading eyebrow="TRASPARENZA · DOCUMENTAZIONE" title="I numeri, spiegati." description="Formule esplicite, ipotesi dichiarate e risultati verificabili: il modello non è una scatola nera." right={<span className="mini-tag"><BookOpen size={14} /> Metodo CVR</span>} />
    <div className="method-callout"><div className="method-callout-icon"><Calculator size={21} /></div><div><strong>Analisi Costi-Volumi-Risultati (CVR)</strong><p>Il modello applica il metodo del Break Even Point assumendo, nell'intervallo analizzato, prezzi e costi variabili unitari costanti, costi fissi invariati e mix di vendita stabile.</p></div></div>
    <div className="formula-grid">{formula.map((f) => <div className="panel formula-card" key={f.n}><div className="formula-number">{f.n}</div><h3>{f.title}</h3><div className="formula-equation">{f.formula}</div><p>{f.explanation}</p></div>)}</div>
    <section className="panel assumptions-panel"><div className="panel-heading"><div><div className="eyebrow">DATI UTILIZZATI NELL'ANALISI CORRENTE</div><h2>Riepilogo delle ipotesi</h2></div><FileSpreadsheet size={18} className="muted-icon" /></div><div className="assumptions-grid"><div><span>Costi fissi</span><strong>{money(request.fixedCosts)}</strong></div><div><span>Prodotti/servizi</span><strong>{request.products.length}</strong></div><div><span>Unità previste</span><strong>{integer.format(analysis.totalPlannedUnits)}</strong></div><div><span>Mix di vendita</span><strong>Costante</strong></div><div><span>IVA</span><strong>Esclusa dai calcoli</strong></div><div><span>Periodo</span><strong>Mensile (demo)</strong></div></div></section>
    <div className="limitations-note"><AlertTriangle size={17} /><div><strong>Limiti del modello</strong><p>Il BEP è uno strumento di pianificazione, non una previsione garantita. Il modello base non considera imposte, IVA, scorte, capacità produttiva, variazioni di prezzo legate alla domanda, costi semi-variabili, ammortamenti o stagionalità. Per decisioni reali, occorre verificare le ipotesi con la contabilità aziendale.</p></div></div>
  </>
}

export default App
