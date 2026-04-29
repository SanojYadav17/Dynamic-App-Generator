'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { GeneratedRun } from '@/lib/storage';

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [run, setRun] = useState<GeneratedRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const fetchRun = async () => {
    try {
      const response = await fetch(`/api/runs/${id}`);
      if (!response.ok) throw new Error('Run not found');
      const data = await response.json();
      setRun(data.run);
      setNewTitle(data.run.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateTitle = async () => {
    if (!newTitle.trim()) return;
    try {
      const response = await fetch(`/api/runs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (!response.ok) throw new Error('Failed to update');
      const data = await response.json();
      setRun(data.run);
      setEditing(false);
      // Refresh after update to ensure fresh state
      await fetchRun();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleToggleStatus = async () => {
    if (!run) return;
    const newStatus = run.status === 'draft' ? 'live' : 'draft';
    try {
      const response = await fetch(`/api/runs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update');
      const data = await response.json();
      setRun(data.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this run?')) return;
    try {
      const response = await fetch(`/api/runs/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading run details...</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-600">{error || 'Run not found'}</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          ← Back to Dashboard
        </Link>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-3xl border border-black/10 bg-white shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-black/10 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              {editing ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateTitle}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">{run.title}</h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  run.status === 'live'
                    ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                    : 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300'
                }`}
              >
                {run.status ? run.status.toUpperCase() : 'DRAFT'}
              </div>
              <button
                onClick={handleToggleStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition"
              >
                Toggle Status
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Run ID</p>
                <p className="mt-1 text-gray-900 font-mono text-sm">{run.id.substring(0, 12)}...</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">App Slug</p>
                <p className="mt-1 text-gray-900">{run.slug}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Owner</p>
                <p className="mt-1 text-gray-900">{run.ownerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Created</p>
                <p className="mt-1 text-gray-900 text-sm">{new Date(run.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t border-black/10 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-sm text-gray-600">Forms</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    {Array.isArray(run.config?.forms) ? run.config.forms.length : 0}
                  </p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-sm text-gray-600">Tables</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {Array.isArray(run.config?.tables) ? run.config.tables.length : 0}
                  </p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-purple-50 border border-purple-100">
                  <p className="text-sm text-gray-600">Metrics</p>
                  <p className="mt-1 text-2xl font-bold text-purple-600">
                    {Array.isArray(run.config?.metrics) ? run.config.metrics.length : 0}
                  </p>
                </div>
              </div>
            </div>

            {/* JSON Config */}
            <div className="border-t border-black/10 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(run.config, null, 2)}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-black/10 pt-8 flex gap-3">
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition"
              >
                Delete Run
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
