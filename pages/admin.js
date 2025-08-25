// pages/admin.tsx (or .jsx)
import { useEffect, useState } from 'react';

export default function Admin() {
  const [stage, setStage] = useState<'pin'|'list'>('pin');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const headerPin = () => localStorage.getItem('adminPin') || pin;

  async function loadMembers() {
    setLoading(true);
    try {
      const res = await fetch('/api/members', {
        headers: { 'x-admin-pin': headerPin()! }
      });
      const data = await res.json().catch(() => ({} as any));
      const list = Array.isArray(data?.members) ? data.members
                : (Array.isArray(data) ? data : []);
      setMembers(list);
      setStage('list');
    } catch (err) {
      console.error('load members failed', err);
      alert('Failed to load members (see console for details).');
    } finally {
      setLoading(false);
    }
  }

  async function enter() {
    localStorage.setItem('adminPin', pin.trim());
    await loadMembers();
  }

  async function addMember() {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': headerPin()!
        },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || 'Failed to add member');
        return;
      }
      setEmail('');
      setName('');
      await loadMembers();
    } catch (e) {
      console.error(e);
      alert('Add member failed');
    }
  }

  async function sendTestEmail() {
    try {
      const emails = (members || []).map((m: any) => m.email);
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': headerPin()!
        },
        body: JSON.stringify({
          subject: 'PicklePal: Test Email',
          html: '<p>This is a test email from PicklePal.</p>',
          memberEmails: emails
        })
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || 'Failed to send email');
        return;
      }
      alert(`Test email sent to ${emails.length} member(s).`);
    } catch (e) {
      console.error(e);
      alert('Send test email failed');
    }
  }

  if (stage === 'pin') {
    return (
      <div style={{ padding: 24 }}>
        <h2>Admin</h2>
        <input
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Enter admin PIN"
          style={{ padding: 8, width: 240, marginRight: 8 }}
        />
        <button onClick={enter} disabled={loading}>
          {loading ? 'Loading…' : 'Enter'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: 8, width: 260, marginRight: 8 }}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: 8, width: 320, marginRight: 8 }}
        />
        <button onClick={addMember} style={{ marginRight: 8 }}>
          Add member
        </button>
        <button onClick={sendTestEmail}>
          Send test email
        </button>
      </div>

      <ul style={{ lineHeight: 1.8 }}>
        {(members || []).map((m: any) => (
          <li key={m.id || m.email}>
            {m.email} {m.name ? `— ${m.name}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
