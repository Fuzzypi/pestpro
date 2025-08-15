// frontend/src/pages/Jobs.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../lib/api";
import { Mail, Phone, MapPin, Calendar, Clock, Save } from "lucide-react";

const PRESET_KEY = "job_description_presets";

function timeWindowLabel(timeValue, hours) {
  if (!timeValue) return `— ${hours} hour${hours > 1 ? "s" : ""} —`;
  const [hh, mm] = timeValue.split(":").map((n) => parseInt(n, 10));
  const start = new Date();
  start.setHours(hh, mm || 0, 0, 0);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  const toHM = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
      2,
      "0"
    )}`;
  return `${toHM(start)} – ${toHM(end)} (${hours}h)`;
}

export default function Jobs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lists
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Selected customer + detail
  const [customerId, setCustomerId] = useState("");
  const [customerDetail, setCustomerDetail] = useState(null);

  // Form
  const [form, setForm] = useState({
    property_id: null,
    contact_id: null,
    technician_id: "",
    date: "",
    time: "",
    window_hours: 2,
    description: "",
    notes: "",
  });

  // Presets
  const [presets, setPresets] = useState(() => {
    try {
      const raw = localStorage.getItem(PRESET_KEY);
      return raw
        ? JSON.parse(raw)
        : ["Rodent inspection", "Ant treatment", "Follow-up service"];
    } catch {
      return ["Rodent inspection", "Ant treatment", "Follow-up service"];
    }
  });

  // Load base lists
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [custRes, techRes] = await Promise.all([
          axios.get(`${API_URL}/api/customers`),
          axios.get(`${API_URL}/api/technicians`),
        ]);
        setCustomers(custRes.data || []);
        setTechnicians(techRes.data || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load lists. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load selected customer detail (properties + contacts)
  useEffect(() => {
    if (!customerId) {
      setCustomerDetail(null);
      setForm((f) => ({ ...f, property_id: null, contact_id: null }));
      return;
    }
    const loadDetail = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/customers/${customerId}`);
        setCustomerDetail(data);

        const firstProp =
          (data.properties || []).find((p) => p.is_primary) ||
          (data.properties || [])[0] ||
          null;
        const firstContact =
          (data.contacts || []).find((c) => c.is_primary) ||
          (data.contacts || [])[0] ||
          null;

        setForm((f) => ({
          ...f,
          property_id: firstProp ? firstProp.id : null,
          contact_id: firstContact ? firstContact.id : null,
        }));
      } catch (e) {
        console.error(e);
        setError("Failed to load customer details.");
      }
    };
    loadDetail();
  }, [customerId]);

  const selectedProperty = useMemo(
    () =>
      (customerDetail?.properties || []).find((p) => p.id === form.property_id) ||
      null,
    [customerDetail, form.property_id]
  );

  const selectedContact = useMemo(
    () =>
      (customerDetail?.contacts || []).find((c) => c.id === form.contact_id) ||
      null,
    [customerDetail, form.contact_id]
  );

  const addPreset = () => {
    const label = (form.description || "").trim();
    if (!label) {
      alert("Enter a description first, then click Save preset.");
      return;
    }
    if (presets.includes(label)) {
      alert("Preset already exists.");
      return;
    }
    const next = [...presets, label];
    setPresets(next);
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    if (!customerId) return alert("Choose a customer.");
    if (!form.description.trim()) return alert("Enter a description.");
    if (!form.date) return alert("Choose a date.");

    try {
      await axios.post(`${API_URL}/api/jobs`, {
        customer_id: Number(customerId),
        property_id: form.property_id || null,
        contact_id: form.contact_id || null,
        technician_id: form.technician_id || null,
        description: form.description.trim(),
        notes: form.notes || null,
        job_date: form.date,
        job_time: form.time || null,
        status: "Scheduled",
      });
      alert("Job created.");
      setForm((f) => ({ ...f, description: "", notes: "" }));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to create job.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error) return <div className="card p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Job</h1>
      </div>

      {/* Customer selection */}
      <div className="card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              className="input"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Technician (optional)
            </label>
            <select
              className="input"
              value={form.technician_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  technician_id: e.target.value ? Number(e.target.value) : "",
                }))
              }
            >
              <option value="">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer banner */}
        {customerDetail && (
          <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="text-lg font-medium mb-2">{customerDetail.name}</div>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="flex items-center">
                <Mail size={16} className="mr-2 opacity-60" />
                <span className="truncate">
                  {customerDetail.email || "No email"}
                </span>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-2 opacity-60" />
                <span>{customerDetail.phone || "No phone"}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 opacity-60" />
                {customerDetail.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      customerDetail.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {customerDetail.address}
                  </a>
                ) : (
                  <span>No address</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property & Contact */}
      <div className="card p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Property</label>
            <select
              className="input"
              value={form.property_id || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  property_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
              disabled={
                !customerDetail || (customerDetail.properties || []).length === 0
              }
            >
              {!customerDetail && (
                <option value="">Select a customer first</option>
              )}
              {customerDetail &&
                (customerDetail.properties || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label ? `${p.label} – ` : ""}
                    {p.address}
                    {p.is_primary ? " (Primary)" : ""}
                  </option>
                ))}
            </select>
            <p className="mt-2 text-xs opacity-70">
              {selectedProperty ? selectedProperty.address : "—"}
            </p>
            {customerDetail &&
              (customerDetail.properties || []).length === 0 && (
                <p className="mt-2 text-xs">
                  No properties. Add one on the{" "}
                  <Link to={`/customers/${customerDetail.id}`} className="underline">
                    customer page
                  </Link>
                  .
                </p>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact</label>
            <select
              className="input"
              value={form.contact_id || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  contact_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
              disabled={
                !customerDetail || (customerDetail.contacts || []).length === 0
              }
            >
              {!customerDetail && (
                <option value="">Select a customer first</option>
              )}
              {customerDetail &&
                (customerDetail.contacts || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.is_primary ? " (Primary)" : ""}
                  </option>
                ))}
            </select>
            <p className="mt-2 text-xs opacity-70">
              {selectedContact
                ? `${selectedContact.phone || "No phone"} • ${
                    selectedContact.email || "No email"
                  }`
                : "—"}
            </p>
            {customerDetail &&
              (customerDetail.contacts || []).length === 0 && (
                <p className="mt-2 text-xs">
                  No contacts. Add one on the{" "}
                  <Link to={`/customers/${customerDetail.id}`} className="underline">
                    customer page
                  </Link>
                  .
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Scheduling & details */}
      <div className="card p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Start Time (optional)
            </label>
            <input
              type="time"
              className="input"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
            <p className="mt-2 text-xs opacity-70">
              {timeWindowLabel(form.time, form.window_hours)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Window</label>
            <select
              className="input"
              value={form.window_hours}
              onChange={(e) =>
                setForm((f) => ({ ...f, window_hours: Number(e.target.value) }))
              }
            >
              {[1, 2, 3, 4].map((h) => (
                <option key={h} value={h}>
                  {h} hour{h > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>{/* spacer */}</div>

          {/* Description + presets */}
          <div className="md:col-span-2 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Rodent inspection"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <div className="mt-2">
                <label className="block text-xs mb-1 opacity-70">Quick pick</label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="btn-secondary !px-3 !py-1"
                      onClick={() => setForm((f) => ({ ...f, description: p }))}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button type="button" onClick={addPreset} className="btn-secondary">
                <Save size={16} className="mr-2" />
                Save preset
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Any special instructions…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setForm((f) => ({ ...f, description: "", notes: "" }))}
          >
            Clear
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            Create Job
          </button>
        </div>
      </div>

      {/* Helpful legend */}
      <div className="text-xs opacity-70 flex items-center gap-4">
        <span className="inline-flex items-center gap-1">
          <Calendar size={14} /> Date
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={14} /> Start time & window
        </span>
      </div>
    </div>
  );
}
