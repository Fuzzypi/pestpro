// frontend/src/pages/CustomerDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Plus,
  X,
  Building2,
  Pencil,
} from "lucide-react";
import { API_URL } from "../lib/api";

const fmtPhone = (v) => v || "No phone";
const fmtEmail = (v) => v || "No email";

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

export default function CustomerDetail() {
  const { customerId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Create Job modal state
  const [showJobModal, setShowJobModal] = useState(false);
  const [form, setForm] = useState({
    property_id: null,
    contact_id: null,
    technician_id: null,
    date: "",
    time: "",
    window_hours: 2,
    description: "",
    notes: "",
  });

  // Add Property modal
  const [showPropModal, setShowPropModal] = useState(false);
  const [propForm, setPropForm] = useState({
    label: "",
    address: "",
    notes: "",
    is_primary: false,
  });
  const [savingProp, setSavingProp] = useState(false);

  // Add Contact modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    title: "",
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Edit Customer modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // fetch customer detail (+jobs, +properties, +contacts)
  const loadDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const [custRes, techRes] = await Promise.all([
        axios.get(`${API_URL}/api/customers/${customerId}`),
        axios.get(`${API_URL}/api/technicians`),
      ]);

      const c = custRes.data;
      setCustomer({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
      });
      setJobs(c.jobs || []);
      setProperties(c.properties || []);
      setContacts(c.contacts || []);
      setTechnicians(techRes.data || []);

      // Only set defaults on first load (don't override user's choice later)
      const primaryProp =
        (c.properties || []).find((p) => p.is_primary) ||
        (c.properties || [])[0] ||
        null;
      const primaryContact =
        (c.contacts || []).find((p) => p.is_primary) ||
        (c.contacts || [])[0] ||
        null;

      setForm((prev) => ({
        ...prev,
        property_id:
          prev.property_id == null
            ? primaryProp
              ? primaryProp.id
              : null
            : prev.property_id,
        contact_id:
          prev.contact_id == null
            ? primaryContact
              ? primaryContact.id
              : null
            : prev.contact_id,
      }));
    } catch (e) {
      setError("Could not fetch customer details.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === form.property_id) || null,
    [properties, form.property_id]
  );
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === form.contact_id) || null,
    [contacts, form.contact_id]
  );

  // --- Create Job ---
  const openCreateJob = () => setShowJobModal(true);
  const closeCreateJob = () => setShowJobModal(false);

  const submitJob = async () => {
    if (!customer) return;
    if (!form.description.trim()) {
      alert("Please enter a job description.");
      return;
    }
    if (!form.date) {
      alert("Please choose a job date.");
      return;
    }

    const payload = {
      customer_id: customer.id,
      property_id: form.property_id || null,
      contact_id: form.contact_id || null,
      technician_id: form.technician_id || null,
      description: form.description.trim(),
      notes: form.notes || null,
      job_date: form.date, // YYYY-MM-DD
      job_time: form.time || null, // HH:MM
      status: "Scheduled",
    };

    try {
      await axios.post(`${API_URL}/api/jobs`, payload);
      closeCreateJob();
      await loadDetail();
    } catch (e) {
      console.error(e);
      alert(
        e?.response?.data?.error ||
          "Failed to create job. Please check the form and try again."
      );
    }
  };

  // --- Add Property ---
  const openAddProperty = () => {
    setPropForm({ label: "", address: "", notes: "", is_primary: false });
    setShowPropModal(true);
  };
  const closeAddProperty = () => setShowPropModal(false);

  const submitProperty = async () => {
    if (!propForm.address.trim()) {
      alert("Property address is required.");
      return;
    }
    setSavingProp(true);
    try {
      const { data: created } = await axios.post(
        `${API_URL}/api/customers/${customerId}/properties`,
        {
          label: propForm.label || null,
          address: propForm.address,
          notes: propForm.notes || null,
          is_primary: !!propForm.is_primary,
        }
      );
      closeAddProperty();
      await loadDetail();
      setForm((prev) => ({ ...prev, property_id: created.id }));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to add property.");
    } finally {
      setSavingProp(false);
    }
  };

  // --- Add Contact ---
  const openAddContact = () => {
    setContactForm({
      name: "",
      phone: "",
      email: "",
      title: "",
      is_primary: false,
    });
    setShowContactModal(true);
  };
  const closeAddContact = () => setShowContactModal(false);

  const submitContact = async () => {
    if (!contactForm.name.trim()) {
      alert("Contact name is required.");
      return;
    }
    setSavingContact(true);
    try {
      const { data: created } = await axios.post(
        `${API_URL}/api/customers/${customerId}/contacts`,
        {
          name: contactForm.name,
          phone: contactForm.phone || null,
          email: contactForm.email || null,
          title: contactForm.title || null,
          is_primary: !!contactForm.is_primary,
        }
      );
      closeAddContact();
      await loadDetail();
      setForm((prev) => ({ ...prev, contact_id: created.id }));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to add contact.");
    } finally {
      setSavingContact(false);
    }
  };

  // --- Edit Customer ---
  const openEditCustomer = () => {
    if (!customer) return;
    setEditForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setShowEditModal(true);
  };
  const closeEditCustomer = () => setShowEditModal(false);

  const submitCustomer = async () => {
    if (!editForm.name.trim()) {
      alert("Customer name is required.");
      return;
    }
    setSavingCustomer(true);
    try {
      await axios.put(`${API_URL}/api/customers/${customerId}`, {
        name: editForm.name.trim(),
        email: editForm.email || null,
        phone: editForm.phone || null,
        address: editForm.address || null,
      });
      closeEditCustomer();
      await loadDetail();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to update customer.");
    } finally {
      setSavingCustomer(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700">{error}</div>;
  if (!customer) return <div className="p-8 text-center">Customer not found.</div>;

  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = jobs.filter((j) => j.job_date >= todayISO);
  const past = jobs.filter((j) => j.job_date < todayISO);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <div className="flex gap-2">
              <button onClick={openEditCustomer} className="btn-secondary inline-flex items-center">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={openCreateJob}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
            <div className="flex items-center">
              <Mail size={16} className="mr-2 opacity-60" />
              <span>{fmtEmail(customer.email)}</span>
            </div>
            <div className="flex items-center">
              <Phone size={16} className="mr-2 opacity-60" />
              <span>{fmtPhone(customer.phone)}</span>
            </div>
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 opacity-60" />
              {customer.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    customer.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {customer.address}
                </a>
              ) : (
                <span>No address</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="card">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Properties
            </h2>
            <button onClick={openAddProperty} className="btn-secondary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="table-th">Label</th>
                  <th className="table-th">Address</th>
                  <th className="px-6 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {properties.length ? (
                  properties.map((p) => (
                    <tr key={p.id}>
                      <td className="table-td">
                        {p.label || (p.is_primary ? "Primary" : "—")}
                        {p.is_primary && (
                          <span className="ml-2 pill">Primary</span>
                        )}
                      </td>
                      <td className="table-td">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            p.address || ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {p.address}
                        </a>
                      </td>
                      <td className="px-6 py-3 text-right text-sm opacity-70">
                        {/* edit/delete can be added later */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-3 text-sm opacity-70" colSpan={3}>
                      No properties yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="card">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              Contacts
            </h2>
            <button onClick={openAddContact} className="btn-secondary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="px-6 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {contacts.length ? (
                  contacts.map((c) => (
                    <tr key={c.id}>
                      <td className="table-td">
                        {c.name}
                        {c.is_primary && <span className="ml-2 pill">Primary</span>}
                      </td>
                      <td className="table-td">{fmtEmail(c.email)}</td>
                      <td className="table-td">{fmtPhone(c.phone)}</td>
                      <td className="px-6 py-3 text-right text-sm opacity-70">
                        {/* edit/delete can be added later */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-3 text-sm opacity-70" colSpan={4}>
                      No contacts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Upcoming Jobs
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Window</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Technician</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {upcoming.length ? (
                  upcoming.map((job) => (
                    <tr key={job.id}>
                      <td className="table-td">{job.job_date}</td>
                      <td className="table-td">{job.job_time ? `${job.job_time} —` : "—"}</td>
                      <td className="table-td">{job.description}</td>
                      <td className="table-td">{job.technician_name}</td>
                      <td className="table-td">
                        <span
                          className={`pill ${
                            job.status === "Completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-3 text-center text-sm opacity-70" colSpan={5}>
                      No upcoming jobs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Past Jobs */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Past Jobs
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Window</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Technician</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {past.length ? (
                  past.map((job) => (
                    <tr key={job.id}>
                      <td className="table-td">{job.job_date}</td>
                      <td className="table-td">{job.job_time ? `${job.job_time} —` : "—"}</td>
                      <td className="table-td">{job.description}</td>
                      <td className="table-td">{job.technician_name}</td>
                      <td className="table-td">
                        <span
                          className={`pill ${
                            job.status === "Completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-3 text-center text-sm opacity-70" colSpan={5}>
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-lg font-semibold">Create Job</h3>
              <button onClick={closeCreateJob} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              {/* Property */}
              <div>
                <label className="block text-sm font-medium mb-1">Property</label>
                <select
                  className="input"
                  value={form.property_id || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, property_id: e.target.value ? Number(e.target.value) : null }))
                  }
                >
                  {properties.length === 0 && <option value="">No properties</option>}
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label ? `${p.label} – ` : ""}{p.address}
                      {p.is_primary ? " (Primary)" : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs opacity-70">
                  {selectedProperty ? selectedProperty.address : "—"}
                </p>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium mb-1">Contact</label>
                <select
                  className="input"
                  value={form.contact_id || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact_id: e.target.value ? Number(e.target.value) : null }))
                  }
                >
                  {contacts.length === 0 && <option value="">No contacts</option>}
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.is_primary ? " (Primary)" : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs opacity-70">
                  {selectedContact
                    ? `${fmtPhone(selectedContact.phone)} • ${fmtEmail(selectedContact.email)}`
                    : "—"}
                </p>
              </div>

              {/* Technician */}
              <div>
                <label className="block text-sm font-medium mb-1">Technician (optional)</label>
                <select
                  className="input"
                  value={form.technician_id || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      technician_id: e.target.value ? Number(e.target.value) : null,
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

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium mb-1">Start Time (optional)</label>
                <input
                  type="time"
                  className="input"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>

              {/* Window */}
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
                <p className="mt-2 text-xs opacity-70">
                  {timeWindowLabel(form.time, form.window_hours)}
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Rodent inspection"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
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

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 p-4">
              <button onClick={closeCreateJob} className="btn-secondary">
                Cancel
              </button>
              <button onClick={submitJob} className="btn-primary">
                Create Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showPropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-lg font-semibold">Add Property</h3>
              <button onClick={closeAddProperty} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium mb-1">Label (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Home, Rental, Office"
                  value={propForm.label}
                  onChange={(e) => setPropForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123 Main St, City, ST"
                  value={propForm.address}
                  onChange={(e) => setPropForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Gate code, access notes…"
                  value={propForm.notes}
                  onChange={(e) => setPropForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={propForm.is_primary}
                  onChange={(e) =>
                    setPropForm((f) => ({ ...f, is_primary: e.target.checked }))
                  }
                />
                Make this the primary address for the customer
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 p-4">
              <button onClick={closeAddProperty} className="btn-secondary">
                Cancel
              </button>
              <button onClick={submitProperty} disabled={savingProp} className="btn-primary">
                {savingProp ? "Saving…" : "Save Property"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-lg font-semibold">Add Contact</h3>
              <button onClick={closeAddContact} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Full name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="(555) 123-4567"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (optional)</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="name@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role/Title (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Owner, Manager, etc."
                  value={contactForm.title}
                  onChange={(e) => setContactForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={contactForm.is_primary}
                  onChange={(e) =>
                    setContactForm((f) => ({ ...f, is_primary: e.target.checked }))
                  }
                />
                Make this the primary contact for the customer
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 p-4">
              <button onClick={closeAddContact} className="btn-secondary">
                Cancel
              </button>
              <button onClick={submitContact} disabled={savingContact} className="btn-primary">
                {savingContact ? "Saving…" : "Save Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-lg font-semibold">Edit Customer</h3>
              <button onClick={closeEditCustomer} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 p-4">
              <button onClick={closeEditCustomer} className="btn-secondary">
                Cancel
              </button>
              <button onClick={submitCustomer} disabled={savingCustomer} className="btn-primary">
                {savingCustomer ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
