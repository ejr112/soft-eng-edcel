"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateTicket } from '../../../lib/ticket';
import '../dashboard.css';

export default function BorrowHistory() {
  const [user, setUser] = useState(null);
  const [borrows, setBorrows] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return router.push('/');
    const parsed = JSON.parse(stored);
    setUser(parsed);
    fetchMyBorrows(parsed.email);
  }, [router]);

  const fetchMyBorrows = async (email) => {
    const res = await fetch(`/api/books/my-borrows?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setBorrows(Array.isArray(data) ? data : []);
  };

  const categorized = useMemo(() => {
    const all = borrows;
    const borrowed = all.filter((item) => item.status === 'on-hand');
    const overdue = all.filter((item) => new Date(item.due_date) < new Date());
    const returned = [];
    switch (activeTab) {
      case 'Borrowed':
        return borrowed;
      case 'Overdue':
        return overdue;
      case 'Returned':
        return returned;
      default:
        return all;
    }
  }, [activeTab, borrows]);

  const tabCounts = {
    All: borrows.length,
    Borrowed: borrows.filter((item) => item.status === 'on-hand').length,
    Overdue: borrows.filter((item) => new Date(item.due_date) < new Date()).length,
    Returned: 0,
  };

  if (!user) return null;

  return (
    <div className="history-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Track all your borrowed and returned books</p>
          <h1>My Borrow History</h1>
        </div>
      </div>

      <div className="tabs-row">
        {['All', 'Borrowed', 'Overdue', 'Returned'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} <span>{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      <section className="table-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {categorized.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state-row">
                  No entries found for this filter.
                </td>
              </tr>
            ) : (
              categorized.map((borrow) => (
                <tr key={borrow.id}>
                  <td style={{ fontWeight: 700 }}>{borrow.book_id}</td>
                  <td>{new Date(borrow.issue_date).toLocaleDateString()}</td>
                  <td>{new Date(borrow.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge-status ${new Date(borrow.due_date) < new Date() ? 'badge-overdue' : 'badge-active'}`}>
                      {new Date(borrow.due_date) < new Date() ? 'OVERDUE' : 'BORROWED'}
                    </span>
                  </td>
                  <td>
                    <button className="secondary-btn" type="button" onClick={() => generateTicket(borrow)}>
                      Download Ticket
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
