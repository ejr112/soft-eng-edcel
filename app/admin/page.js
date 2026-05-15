"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalBooks: 0, activeBorrows: 0, users: 0 });
  const [borrows, setBorrows] = useState([]);
  const [books, setBooks] = useState([]);
  const [activeSection, setActiveSection] = useState('add');
  const [statusMessage, setStatusMessage] = useState('');
  const [bookForm, setBookForm] = useState({ bookId: '', title: '', author: '', copies: 1 });
  const [bookDeleteId, setBookDeleteId] = useState('');
  const [issueForm, setIssueForm] = useState({ username: '', bookId: '' });
  const [finesData, setFinesData] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const router = useRouter();
  const localBooksKey = 'admin-local-books';

  const loadLocalBooks = () => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(localBooksKey) || '[]');
    } catch {
      return [];
    }
  };

  const saveLocalBooks = (booksList) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(localBooksKey, JSON.stringify(booksList));
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return router.push('/');
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') return router.push('/');
    setAdminUser(parsed);
    fetchAdminData();
    fetchBooks();
  }, [router]);

  const fetchAdminData = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (res.ok) {
      setStats(data.stats || {});
      setBorrows(Array.isArray(data.borrows) ? data.borrows : []);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
          saveLocalBooks(data);
          return;
        }
      }
    } catch (err) {
      // ignore and fallback to local storage
    }

    const fallbackBooks = loadLocalBooks();
    setBooks(fallbackBooks);
  };

  const loadFines = async () => {
    const res = await fetch('/api/admin/fines');
    const data = await res.json();
    if (res.ok) {
      setFinesData(data);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/add-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookForm),
    });
    const data = await res.json();
    setStatusMessage(data.message || data.error || 'Action completed');

    if (res.ok) {
      const newBook = {
        id: bookForm.bookId,
        title: bookForm.title,
        author: bookForm.author,
        available_copies: Number(bookForm.copies),
      };
      const currentBooks = loadLocalBooks();
      const updatedBooks = [newBook, ...currentBooks.filter((book) => String(book.id) !== String(newBook.id))];
      saveLocalBooks(updatedBooks);
    }

    fetchBooks();
  };

  const handleDeleteBook = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/delete-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: bookDeleteId }),
    });
    const data = await res.json();
    setStatusMessage(data.message || data.error || 'Action completed');

    if (res.ok) {
      const currentBooks = loadLocalBooks();
      const updatedBooks = currentBooks.filter((book) => String(book.id) !== String(bookDeleteId));
      saveLocalBooks(updatedBooks);
    }

    fetchBooks();
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueForm),
    });
    const data = await res.json();
    setStatusMessage(data.message || data.error || 'Action completed');
    fetchAdminData();
  };

  const handleReturnBorrow = async (borrowId, bookId) => {
    const res = await fetch('/api/admin/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrowId, bookId }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusMessage(data.message);
      fetchAdminData();
    } else {
      setStatusMessage(data.error);
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <div className="brand-title">LibraryPortal</div>
          <p className="brand-subtitle">Digital Library System</p>
        </div>
        <div className="topbar-actions">
          <div className="admin-user-badge">
            <span>{adminUser?.name?.slice(0, 1) || 'A'}</span>
            <div>
              <strong>{adminUser?.name || 'Admin User'}</strong>
              <span>Admin</span>
            </div>
          </div>
          <button className="logout-button" onClick={() => { localStorage.clear(); router.push('/'); }}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-cover">
        <div className="cover-heading">
          <h1>Admin Home</h1>
          <p>Central command for library operations and tracking</p>
        </div>
        <div className="stats-row">
          <div className="stat-card"><span>Total Titles</span><strong>{stats.totalBooks}</strong></div>
          <div className="stat-card"><span>Available Copies</span><strong>{stats.availableCopies ?? stats.available_copies ?? 0}</strong></div>
          <div className="stat-card"><span>Users</span><strong>{stats.users}</strong></div>
          <div className="stat-card"><span>Currently Borrowed</span><strong>{stats.activeBorrows}</strong></div>
          <div className="stat-card"><span>Overdue Books</span><strong>{stats.overdue ?? 0}</strong></div>
        </div>

        <div className="action-grid">
          {[
            { key: 'add', label: 'Add Book' },
            { key: 'delete', label: 'Delete Book' },
            { key: 'list', label: 'Books List' },
            { key: 'issue', label: 'Issue Book' },
            { key: 'return', label: 'Return Book' },
            { key: 'fines', label: 'Fines' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`action-card ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(item.key);
                if (item.key === 'fines') loadFines();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="admin-action-panel">
          {statusMessage && <div className="status-message">{statusMessage}</div>}

          {activeSection === 'add' && (
            <form className="admin-form" onSubmit={handleAddBook}>
              <h2>Add New Book to Catalog</h2>
              <div className="form-grid">
                <input
                  placeholder="Book ID (e.g. BK-999)"
                  value={bookForm.bookId}
                  onChange={(e) => setBookForm({ ...bookForm, bookId: e.target.value })}
                />
                <input
                  placeholder="Book Title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                />
                <input
                  placeholder="Author Name"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Copies"
                  value={bookForm.copies}
                  onChange={(e) => setBookForm({ ...bookForm, copies: Number(e.target.value) })}
                />
              </div>
              <button type="submit" className="primary-btn">
                Create Book
              </button>
            </form>
          )}

          {activeSection === 'delete' && (
            <form className="admin-form" onSubmit={handleDeleteBook}>
              <h2>Remove a Book from the Catalog</h2>
              <input
                placeholder="Book ID to remove"
                value={bookDeleteId}
                onChange={(e) => setBookDeleteId(e.target.value)}
              />
              <button type="submit" className="secondary-btn">
                Delete Book
              </button>
            </form>
          )}

          {activeSection === 'issue' && (
            <form className="admin-form" onSubmit={handleIssueBook}>
              <h2>Manually Issue Book to User</h2>
              <div className="form-grid">
                <input
                  placeholder="Username (without @)"
                  value={issueForm.username}
                  onChange={(e) => setIssueForm({ ...issueForm, username: e.target.value })}
                />
                <input
                  placeholder="Book ID (e.g. BK-001)"
                  value={issueForm.bookId}
                  onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                />
              </div>
              <button type="submit" className="primary-btn">
                Issue Book Now
              </button>
            </form>
          )}

          {activeSection === 'list' && (
            <div className="books-list-panel">
              <h2>Books List</h2>
              <div className="books-grid">
                {books.slice(0, 8).map((book) => (
                  <div key={book.id} className="book-summary-card">
                    <strong>{book.title}</strong>
                    <span>{book.author}</span>
                    <span>{book.available_copies} copies available</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'return' && (
            <div className="admin-form">
              <h2>Return Book</h2>
              <p>Use the return button in the active borrows table below to mark a book as returned.</p>
            </div>
          )}

          {activeSection === 'fines' && (
            <div className="admin-form">
              <h2>Fines Report</h2>
              {finesData ? (
                <div>
                  <p>Excellent! {finesData.overdueCount} overdue borrowers.</p>
                </div>
              ) : (
                <p>Refresh to load the latest fines report.</p>
              )}
            </div>
          )}
        </section>

        <section className="table-panel admin-table-panel">
          <div className="table-header">
            <h2>All Active Borrows</h2>
            <button className="secondary-btn" type="button" onClick={fetchAdminData}>
              Refresh
            </button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>USER</th>
                <th>BOOK</th>
                <th>DUE DATE</th>
                <th>FINE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{record.user_email.split('@')[0]}</strong>
                    <div className="subtext">{record.user_email}</div>
                  </td>
                  <td>
                    <strong>{record.book_id}</strong>
                  </td>
                  <td>{new Date(record.due_date).toLocaleDateString()}</td>
                  <td>—</td>
                  <td>
                    <span className="badge-status badge-active">BORROWED</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleReturnBorrow(record.id, record.book_id)}
                    >
                      Return
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
