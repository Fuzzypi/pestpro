import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Phone, MapPin, User, Plus } from 'lucide-react';

import { API_URL } from '../lib/api';

const PRESET_KEY = 'pestpro_job_description_presets';

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // sensible starters
  return [
    'General pest treatment',
    'Rodent inspection',
    'Bed bug treatment',
    'Termite inspection',
    'Follow-up service',
  ];
}
function savePresets(list) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(list.slice(0, 50)));
}

function fmtTimeLabel(hhmm) {
  if (!hhmm) return '';
  const [H, M] = hhmm.split(':').map((v) => parseInt(v, 10));
  const d = new Date();
  d.setHours(H, M || 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function addHours(hhmm, hours) {
  if (!hhmm) return '';
  const [H, M] = hhmm.split(':').map((v) => parseInt(v, 10));
  const d = new Date();
  d.setHours(H, M || 0, 0, 0);
  d.setHours(d.getHours() + Number(hours || 0));
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function NewJob() {
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const navigate = useNavigate();

  // Data
  const [customers, setCustomers] = useState([]);
  const [techs, setTechs] = useState([]);

  // Selected/loaded customer (for big contact card)
  const [customerId, setCustomerId] = useState(preselectedCustomerId);
  const [customer, setCustomer] = useState(null);

  // Form
  const [form, setForm] = useState({
    technician_id: '',
    description: '',
    job_date: '',
    job_time: '',
    notes: '',
    status: 'Scheduled',
  });

  // Description presets
  const [presets, setPresets] = useState(loadPresets());

  // Time window (1–4 hours)
  const [windowHours, setWindowHours] = useState(2);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Derived window preview
  const windowPreview = useMemo(() => {
    if (!form.job_time) return '—';
    const end = addHours(form.job_time, windowHours);
    return `${fmtTimeLabel(form.job_time)} – ${fmtTimeLabel(end)} (${windowHours}h)`;
  }, [form.job_time, windowHours]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Load technicians + customers; then hydrate customer if preselected
  useEffect(() => {
    (async () => {
      try {
        const [t, c] = await Promise.all([
          axios.get(`${API_URL}/api/technicians`),
          axios.get(`${API_URL}/api/customers`),
        ]);
        setTechs(t.data || []);
        setCustomers(c.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // When customerId changes, load that customer's detail for the contact card
  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/customers/${customerId}`);
        setCustomer(res.data || null);
      } catch (e) {
        console.error(e);
        setCustomer(null);
      }
    })();
  }, [customerId]);

  // Keep form.customer_id in sync with current selection
  useEffect(() => {
    // ensure the numeric id is set for submit
    update('customer_id', customerId ? Number(customerId) : '');
  }, [customerId]);

  const addPreset = () => {
    const val = (form.description || '').trim();
    if (!val) return;
    if (presets.includes(val)) return;
    const next = [val, ...presets].slice(0, 50);
    setPresets(next);
    savePresets(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!customerId) return setError('Customer is required.');
    if (!form.description.trim()) return setError('Description is required.');
    if (!form.job_date) return setError('Date is required.');

    // Compose notes with window preview (if time provided)
    let notes = form.notes || '';
    if (form.job_time) {
      const windowNote = `Window: ${windowPreview}`;
      notes = notes ? `${notes}\n${windowNote}` : windowNote;
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: Number(customerId),
        technician_id: form.technician_id ? Number(form.technician_id) : undefined,
        description: form.description.trim(),
        job_date: form.job_date,            // YYYY-MM-DD
        job_time: form.job_time || undefined, // HH:MM (optional)
        notes: notes || undefined,
        status: form.status || 'Scheduled',
      };
      await axios.post(`${API_URL}/api/jobs`, payload);
      navigate(`/customers/${customerId}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to create job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Job</h1>
          {customer && (
            <p className="text-sm text-gray-600 mt-1">
              For customer: <span className="font-medium">{customer.name}</span>
            </p>
          )}
        </div>
        <Link to={customerId ? `/customers/${customerId}` : '/jobs'} className="btn-secondary">
          Cancel
        </Link>
      </div>

      {/* Big two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: form fields */}
        <div className="lg:col-span-2">
          <div className="card">
            <form onSubmit={submit} className="space-y-5 p-1">
              {/* Customer & Technician */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <select
                    className="input mt-1"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Select a customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.address ? `• ${c.address}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Technician (optional)</label>
                  <select
                    className="input mt-1"
                    value={form.technician_id}
                    onChange={(e) => update('technician_id', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {techs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time + Window */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    className="input mt-1"
                    value={form.job_date}
                    onChange={(e) => update('job_date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time (optional)</label>
                  <input
                    type="time"
                    className="input mt-1"
                    value={form.job_time}
                    onChange={(e) => update('job_time', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Window</label>
                  <select
                    className="input mt-1"
                    value={windowHours}
                    onChange={(e) => setWindowHours(Number(e.target.value))}
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                    <option value={4}>4 hours</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {form.job_time ? `Window: ${windowPreview}` : 'Pick a start time to see the window'}
                  </div>
                </div>
              </div>

              {/* Description (editable dropdown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <div className="flex gap-2">
                  <input
                    list="job-description-presets"
                    className="input mt-1 flex-1"
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="e.g., Rodent inspection"
                    required
                  />
                  <button
                    type="button"
                    className="btn-secondary mt-1 whitespace-nowrap"
                    onClick={addPreset}
                    disabled={!form.description.trim()}
                    title="Save current description to presets"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Save preset
                  </button>
                </div>
                <datalist id="job-description-presets">
                  {presets.map((p, i) => (
                    <option key={i} value={p} />
                  ))}
                </datalist>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  rows={3}
                  className="input mt-1"
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Any special instructions…"
                />
              </div>

              {error && <div className="p-2 rounded bg-red-100 text-red-700 text-sm">{error}</div>}

              <div className="pt-2">
                <button className="btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Customer contact card */}
        <div className="space-y-4">
          <div className="card">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Customer Contact</h2>

              {customer ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="text-2xl font-bold text-gray-900 leading-tight">
                      {customer.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700 text-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    {customer.email ? (
                      <a className="text-indigo-700 hover:underline" href={`mailto:${customer.email}`}>
                        {customer.email}
                      </a>
                    ) : (
                      <span className="text-gray-500">No email</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-gray-700 text-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    {customer.phone ? (
                      <a className="text-indigo-700 hover:underline" href={`tel:${customer.phone}`}>
                        {customer.phone}
                      </a>
                    ) : (
                      <span className="text-gray-500">No phone</span>
                    )}
                  </div>

                  <div className="flex items-start gap-3 text-gray-700 text-lg">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    {customer.address ? (
                      <a
                        className="text-indigo-700 hover:underline"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {customer.address}
                      </a>
                    ) : (
                      <span className="text-gray-500">No address</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select a customer to see contact details.</div>
              )}
            </div>
          </div>

          {/* Live window preview card */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Scheduled Window</h3>
              <div className="text-xl font-semibold text-gray-900">
                {form.job_time ? windowPreview : '—'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                The selected window will be appended to the job’s notes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
