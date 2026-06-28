import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminPanel() {
  const [confessions, setConfessions] = useState([]);
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    api.get('/confessions').then(({ data }) => setConfessions(data));
    api.get('/quiz/analytics').then(({ data }) => setAnalytics(data));
  }, []);

  const toggleApproval = async (id, approved) => {
    await api.patch(`/confessions/${id}/approve`);
    setConfessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, approved: !approved } : c))
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Quiz Analytics</h2>
        <p>Total attempts: {analytics.total}</p>
        <p>Average score: {analytics.avgScore?.toFixed(1)}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Confessions</h2>
        <ul className="space-y-2">
          {confessions.map((c) => (
            <li key={c.id} className="border p-2 rounded">
              <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              <button
                onClick={() => toggleApproval(c.id, c.approved)}
                className="mt-1 text-xs bg-info text-white px-2 py-1 rounded"
              >
                {c.approved ? 'Un-approve' : 'Approve'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
