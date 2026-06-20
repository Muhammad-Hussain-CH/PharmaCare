import { useState } from 'react';
import {
  Building2, AlertTriangle, User, Sliders,
  Bell, Database, Download, Upload, RefreshCw, Trash2
} from 'lucide-react';
import { useData }  from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import type { PharmacySettings } from '../data/sampleData';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal         from '../components/Modal';
import { createWorker } from '../api/services';

export default function Settings() {
  const {
    settings, updateSettings,
    resetToSampleData, clearAllData,
    medicines, suppliers, orders, dispenses,
    showToast,
  } = useData();
  const { isDark, toggleTheme } = useTheme();

  const [form,             setForm]             = useState<PharmacySettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [clearInput,       setClearInput]       = useState('');
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [workerForm, setWorkerForm] = useState({ full_name: '', username: '', password: '' });
  const [workerMessage, setWorkerMessage] = useState('');
  const [workerError, setWorkerError] = useState('');
  const [workerLoading, setWorkerLoading] = useState(false);

  // ── Field helpers ─────────────────────────────────────────────────────────
  function update(key: keyof PharmacySettings, value: unknown) {
    setForm(f => ({ ...f, [key]: value }));
  }
  function updateNotif(key: keyof PharmacySettings['notifications'], value: boolean) {
    setForm(f => ({ ...f, notifications: { ...f.notifications, [key]: value } }));
  }

  // ── Style helpers ─────────────────────────────────────────────────────────
  function cardClass() {
    return 'bg-white dark:bg-[#1A1730] rounded-xl shadow-sm border border-transparent dark:border-[#2D2B45] p-6 mb-5';
  }
  function inputClass(full = false) {
    return `${full ? 'w-full' : ''} px-3 py-2 text-sm border border-gray-200 dark:border-[#2D2B45] rounded-lg bg-white dark:bg-[#252240] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]`;
  }

  function SaveBtn({ label, onSave }: { label: string; onSave: () => void }) {
    return (
      <button
        onClick={onSave}
        className="mt-4 px-5 py-2 text-sm font-medium text-white bg-[#7C3AED] hover:bg-[#5B21B6] rounded-lg shadow-sm transition-colors btn-press">
        {label}
      </button>
    );
  }

  function CardHeader({ icon: Icon, title, color = '#7C3AED' }: {
    icon: React.ElementType; title: string; color?: string;
  }) {
    return (
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
    );
  }

  function Toggle({ checked, onChange, label }: {
    checked: boolean; onChange: (v: boolean) => void; label: string;
  }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-[#2D2B45] last:border-0">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <button
          onClick={() => onChange(!checked)}
          className="relative w-11 h-6 rounded-full transition-colors"
          style={{ background: checked ? '#7C3AED' : '#D1D5DB' }}>
          <span
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
            style={{ left: checked ? '23px' : '2px' }}
          />
        </button>
      </div>
    );
  }

  // ── Export All Data as JSON ───────────────────────────────────────────────
  function handleExportJSON() {
    const exportData = {
      exported_at: new Date().toISOString(),
      project:     'PharmaCare — Hospital Pharmacy Management System',
      authors:     'Muhammad Hussain & Ali Ahmed Mansoor',
      medicines,
      suppliers,
      orders,
      dispenses,
      settings,
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    );
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `pharmacare_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully as JSON');
  }

  // ── Import Data from JSON file ────────────────────────────────────────────
  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.medicines && data.suppliers) {
          // Valid PharmaCare backup — restore and reload
          showToast('Data imported successfully — reloading...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          alert('Invalid backup file. Please use a PharmaCare JSON export file.');
        }
      } catch {
        alert('Failed to read file. Make sure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset so same file can be imported again
    e.target.value = '';
  }

  async function handleCreateWorker(e: React.FormEvent) {
    e.preventDefault();
    setWorkerError('');
    setWorkerMessage('');

    if (!workerForm.full_name || !workerForm.username || !workerForm.password) {
      setWorkerError('Full name, username, and password are required.');
      return;
    }

    if (workerForm.password.length < 8) {
      setWorkerError('Password must be at least 8 characters.');
      return;
    }

    setWorkerLoading(true);
    try {
      await createWorker(workerForm.full_name, workerForm.username, workerForm.password);
      setWorkerMessage('Worker account created successfully.');
      setWorkerForm({ full_name: '', username: '', password: '' });
    } catch (err: any) {
      setWorkerError(err.response?.data?.error || 'Failed to create worker account.');
    } finally {
      setWorkerLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-5 gap-6">

      {/* ── Left column ── */}
      <div className="col-span-3">

        {/* Pharmacy Profile */}
        <div className={cardClass()} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}>
          <CardHeader icon={Building2} title="Pharmacy Profile" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Pharmacy Name',  key: 'pharmacyName'  },
              { label: 'License Number', key: 'licenseNumber' },
              { label: 'Phone',          key: 'phone'         },
              { label: 'Email',          key: 'email'         },
              { label: 'Working Hours',  key: 'workingHours'  },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <input
                  type="text"
                  value={(form as unknown as Record<string, string>)[key]}
                  onChange={e => update(key as keyof PharmacySettings, e.target.value)}
                  className={inputClass(true)}
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => update('address', e.target.value)}
                className={inputClass(true)}
              />
            </div>
          </div>
          <SaveBtn label="Save Profile" onSave={() => updateSettings(form)} />
        </div>

        {/* Stock Alert Thresholds */}
        <div className={cardClass()} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}>
          <CardHeader icon={AlertTriangle} title="Stock Alert Thresholds" color="#D97706" />
          <div className="space-y-4">
            {[
              { label: 'Low Stock Threshold',      key: 'lowStockThreshold',      desc: 'Alert when stock falls below this value'         },
              { label: 'Critical Stock Threshold', key: 'criticalStockThreshold', desc: 'Mark as critical when stock falls below'          },
              { label: 'Expiry Alert Days',        key: 'expiryAlertDays',        desc: 'Alert when medicine expires within these days'    },
            ].map(({ label, key, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                </div>
                <input
                  type="number"
                  value={(form as unknown as Record<string, number>)[key]}
                  onChange={e => update(key as keyof PharmacySettings, Number(e.target.value))}
                  className="w-24 px-3 py-2 text-sm border border-gray-200 dark:border-[#2D2B45] rounded-lg bg-white dark:bg-[#252240] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-right"
                />
              </div>
            ))}
          </div>
          <SaveBtn label="Save Thresholds" onSave={() => updateSettings(form)} />
        </div>

        {/* User Account */}
        <div className={cardClass()} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}>
          <CardHeader icon={User} title="User Account" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'fullName'  },
              { label: 'Email',     key: 'userEmail' },
              { label: 'Phone',     key: 'userPhone' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <input
                  type="text"
                  value={(form as unknown as Record<string, string>)[key]}
                  onChange={e => update(key as keyof PharmacySettings, e.target.value)}
                  className={inputClass(true)}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => update('role', e.target.value)}
                className={inputClass(true)}>
                <option>Admin</option>
                <option>Pharmacist</option>
                <option>Manager</option>
              </select>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-[#2D2B45]">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Change Password</div>
            <div className="grid grid-cols-2 gap-4">
              {['Current Password', 'New Password', 'Confirm Password'].map(label => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                  <input type="password" placeholder="••••••••" className={inputClass(true)} />
                </div>
              ))}
            </div>
          </div>
          <SaveBtn label="Save Account" onSave={() => updateSettings(form)} />
        </div>

        {/* Worker Account Management */}
        <div className={cardClass()} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}>
          <CardHeader icon={User} title="Create Worker Account" color="#0EA5E9" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Create a worker account that can log in to the POS screen only.
          </p>

          <form onSubmit={handleCreateWorker} className="space-y-4">
            {workerError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {workerError}
              </div>
            )}
            {workerMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {workerMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={workerForm.full_name}
                onChange={(e) => setWorkerForm((prev) => ({ ...prev, full_name: e.target.value }))}
                className={inputClass(true)}
                placeholder="e.g. Ali Ahmed"
                disabled={workerLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={workerForm.username}
                onChange={(e) => setWorkerForm((prev) => ({ ...prev, username: e.target.value }))}
                className={inputClass(true)}
                placeholder="e.g. worker1"
                disabled={workerLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={workerForm.password}
                onChange={(e) => setWorkerForm((prev) => ({ ...prev, password: e.target.value }))}
                className={inputClass(true)}
                placeholder="Minimum 8 characters"
                disabled={workerLoading}
              />
            </div>

            <button
              type="submit"
              disabled={workerLoading}
              className="w-full px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {workerLoading ? 'Creating Worker...' : 'Create Worker'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="col-span-2">

        {/* System Preferences */}
        <div className={cardClass()} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}>
          <CardHeader icon={Sliders} title="System Preferences" />
          <div className="space-y-4">
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{isDark ? 'Dark Mode' : 'Light Mode'} active</div>
              </div>
              <button
                onClick={toggleTheme}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: isDark ? '#7C3AED' : '#D1D5DB' }}>
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: isDark ? '23px' : '2px' }}
                />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Language</label>
              <select
                value={form.language}
                onChange={e => update('language', e.target.value)}
                className={inputClass(true)}>
                <option>English</option>
                <option>Urdu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Date Format</label>
              <div className="space-y-1.5">
                {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(fmt => (
                  <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateFormat"
                      value={fmt}
                      checked={form.dateFormat === fmt}
                      onChange={() => update('dateFormat', fmt)}
                      className="accent-[#7C3AED]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{fmt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Currency</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={e => update('currency', e.target.value)}
                  className={inputClass(true)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Items per Page</label>
                <select
                  value={form.itemsPerPage}
                  onChange={e => update('itemsPerPage', Number(e.target.value))}
                  className={inputClass(true)}>
                  {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Timezone</label>
              <input
                type="text"
                value={form.timezone}
                onChange={e => update('timezone', e.target.value)}
                className={inputClass(true)}
              />
            </div>
          </div>
          <SaveBtn label="Save Preferences" onSave={() => updateSettings(form)} />
        </div>

        {/* Notifications */}
        <div className={cardClass()} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}>
          <CardHeader icon={Bell} title="Notifications" />
          <div>
            <Toggle checked={form.notifications.lowStockEmail} onChange={v => updateNotif('lowStockEmail', v)} label="Low stock email alerts" />
            <Toggle checked={form.notifications.expiryAlerts}  onChange={v => updateNotif('expiryAlerts', v)}  label="Expiry date alerts" />
            <Toggle checked={form.notifications.dailySummary}  onChange={v => updateNotif('dailySummary', v)}  label="Daily summary report" />
            <Toggle checked={form.notifications.newOrderNotif} onChange={v => updateNotif('newOrderNotif', v)} label="New order notifications" />
            <Toggle checked={form.notifications.smsNotif}      onChange={v => updateNotif('smsNotif', v)}      label="SMS notifications" />
            <Toggle checked={form.notifications.browserPush}   onChange={v => updateNotif('browserPush', v)}   label="Browser push notifications" />
          </div>
          <SaveBtn label="Save Notifications" onSave={() => updateSettings(form)} />
        </div>

        {/* Data Management */}
        <div className={cardClass()} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}>
          <CardHeader icon={Database} title="Data Management" />
          <div className="space-y-3">

            {/* ✅ Export JSON — wired up */}
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors btn-press">
              <Download size={16} /> Export All Data as JSON
            </button>

            {/* ✅ Import JSON — hidden file input + trigger button */}
            <input
              type="file"
              id="import-json-input"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportJSON}
            />
            <button
              onClick={() => document.getElementById('import-json-input')?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors btn-press">
              <Upload size={16} /> Import Data from JSON
            </button>

            {/* Reset to sample data */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors btn-press">
              <RefreshCw size={16} /> Reset to Sample Data
            </button>

            {/* Danger zone */}
            <div className="border-t border-gray-100 dark:border-[#2D2B45] pt-3">
              <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Danger Zone</div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors btn-press">
                <Trash2 size={16} /> Clear All Data
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">This action cannot be undone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reset confirm dialog */}
      {showResetConfirm && (
        <ConfirmDialog
          title="Reset to Sample Data"
          message="This will replace all current data with the original sample data. Are you sure?"
          onConfirm={() => { resetToSampleData(); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
          confirmLabel="Reset Data"
          danger={false}
        />
      )}

      {/* Clear all data modal */}
      {showDeleteModal && (
        <Modal
          title="Clear All Data"
          onClose={() => { setShowDeleteModal(false); setClearInput(''); }}
          width="max-w-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This will permanently delete all medicines, suppliers, orders, and dispense records.
            Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            type="text"
            value={clearInput}
            onChange={e => setClearInput(e.target.value)}
            placeholder="Type DELETE"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#2D2B45] rounded-lg bg-white dark:bg-[#252240] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setShowDeleteModal(false); setClearInput(''); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2D2B45] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252240] transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                if (clearInput === 'DELETE') {
                  clearAllData();
                  setShowDeleteModal(false);
                  setClearInput('');
                }
              }}
              disabled={clearInput !== 'DELETE'}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Clear All Data
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}