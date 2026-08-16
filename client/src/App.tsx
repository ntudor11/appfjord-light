import { useEffect, useMemo, useState } from 'react'
import type { EnrichedExpense, Summary } from '../../types.ts'
import './App.css'

type SampleDataResponse = {
  expenses: string
  vendors: string
}

type ApiResponse = {
  enriched: EnrichedExpense[]
  summary: Summary
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

const API_BASE = '/api'

const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const toCsv = (rows: EnrichedExpense[]) => {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]) as (keyof EnrichedExpense)[]
  const body = rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  return [headers.join(','), ...body].join('\n')
}

function App() {
  const [expensesFile, setExpensesFile] = useState<File | null>(null)
  const [vendorsFile, setVendorsFile] = useState<File | null>(null)
  const [expensesPreview, setExpensesPreview] = useState<string>('No sample loaded yet.')
  const [vendorsPreview, setVendorsPreview] = useState<string>('No sample loaded yet.')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [showOnlyNeedsReview, setShowOnlyNeedsReview] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/sample-data`)
        if (!response.ok) return
        const data = (await response.json()) as SampleDataResponse
        setExpensesPreview(data.expenses.slice(0, 220))
        setVendorsPreview(data.vendors.slice(0, 220))
      } catch {
        // Demo can still proceed with manual file selection.
      }
    })()
  }, [])

  const visibleRows = useMemo(
    () => result?.enriched.filter((row) => (showOnlyNeedsReview ? row.needs_review : true)) ?? [],
    [result, showOnlyNeedsReview],
  )

  const onLoadSample = async () => {
    setStatus('loading')
    setError('')
    try {
      const response = await fetch(`${API_BASE}/sample-data`)
      if (!response.ok) throw new Error('Unable to load sample data.')
      const data = (await response.json()) as SampleDataResponse
      setExpensesPreview(data.expenses.slice(0, 220))
      setVendorsPreview(data.vendors.slice(0, 220))
      setExpensesFile(new File([data.expenses], 'expenses.csv', { type: 'text/csv' }))
      setVendorsFile(new File([data.vendors], 'vendors.csv', { type: 'text/csv' }))
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to load sample data.')
    }
  }

  const onRun = async () => {
    setStatus('loading')
    setError('')
    try {
      if (!expensesFile || !vendorsFile) {
        throw new Error('Choose both CSV files or load the sample data.')
      }
      const formData = new FormData()
      formData.append('expensesFile', expensesFile)
      formData.append('vendorsFile', vendorsFile)

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json()) as ApiResponse & { message?: string }
      if (!response.ok) throw new Error(payload.message ?? 'Analysis failed.')

      setResult(payload)
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Analysis failed.')
    }
  }

  const onDownload = () => {
    if (!result) return
    const blob = new Blob([toCsv(result.enriched)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'expenses_enriched.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const summaryCards = [
    ['Total expenses', result?.summary.total_expenses ?? 0],
    ['Needs review', result?.summary.expenses_needing_review ?? 0],
    ['Missing tax code %', result?.summary.missing_tax_code_pct ?? 0],
    ['Missing VAT %', result?.summary.missing_vat_amount_pct ?? 0],
  ]

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Tax / VAT / 1099 triage</p>
        <h1>Find the rows finance has to review first.</h1>
        <p className="lede">
          Upload `expenses.csv` and `vendors.csv`, run the rule engine in-memory, and inspect
          a Controller-ready summary plus an enriched export.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={onLoadSample} disabled={status === 'loading'}>
            Use sample data
          </button>
          <button type="button" className="secondary" onClick={onRun} disabled={status === 'loading'}>
            Run tax agent
          </button>
        </div>
        <p className="status-line">
          {status === 'loading' ? 'Working...' : error || 'In-memory only. No files are stored on the server.'}
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Inputs</h2>
          <label className="file-field">
            <span>Expenses CSV</span>
            <input type="file" accept=".csv,text/csv" onChange={(event) => setExpensesFile(event.target.files?.[0] ?? null)} />
          </label>
          <label className="file-field">
            <span>Vendors CSV</span>
            <input type="file" accept=".csv,text/csv" onChange={(event) => setVendorsFile(event.target.files?.[0] ?? null)} />
          </label>
          <div className="preview">
            <strong>Sample expenses</strong>
            <pre>{expensesPreview}</pre>
          </div>
          <div className="preview">
            <strong>Sample vendors</strong>
            <pre>{vendorsPreview}</pre>
          </div>
        </article>

        <article className="panel">
          <h2>Summary</h2>
          <div className="cards">
            {summaryCards.map(([label, value]) => (
              <div className="card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="breakdown">
            <div>
              <h3>By country</h3>
              <ul>
                {Object.entries(result?.summary.by_country ?? {}).map(([country, data]) => (
                  <li key={country}>
                    <span>{country}</span>
                    <span>
                      {data.needs_review}/{data.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>By category</h3>
              <ul>
                {Object.entries(result?.summary.by_category ?? {}).map(([category, data]) => (
                  <li key={category}>
                    <span>{category}</span>
                    <span>
                      {data.needs_review}/{data.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section className="panel results-panel">
        <div className="results-toolbar">
          <div>
            <h2>Results</h2>
            <p>{visibleRows.length} rows shown</p>
          </div>
          <div className="toolbar-actions">
            <label className="toggle">
              <input
                type="checkbox"
                checked={showOnlyNeedsReview}
                onChange={(event) => setShowOnlyNeedsReview(event.target.checked)}
              />
              Needs review only
            </label>
            <button type="button" className="secondary" onClick={onDownload} disabled={!result}>
              Download enriched CSV
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Entity</th>
                <th>Country</th>
                <th>Category</th>
                <th>Needs review</th>
                <th>Reason</th>
                <th>Suggested VAT</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.expense_id}>
                  <td>{row.expense_id}</td>
                  <td>{row.entity}</td>
                  <td>{row.country}</td>
                  <td>{row.category}</td>
                  <td>{row.needs_review ? 'Yes' : 'No'}</td>
                  <td>{row.reason}</td>
                  <td>{row.suggested_vat_treatment}</td>
                  <td>
                    <span className={`pill pill-${row.confidence}`}>{row.confidence}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default App
