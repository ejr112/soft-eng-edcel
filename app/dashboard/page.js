"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [borrowId, setBorrowId] = useState('');
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return router.push('/');
    const parsed = JSON.parse(stored);
    setUser(parsed);
    fetchBooks();
    fetchBorrows(parsed.email);
  }, [router]);

  const fetchBooks = async () => {
    setLoading(true);
    const res = await fetch('/api/books');
    const data = await res.json();
    setBooks(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const fetchBorrows = async (email) => {
    const res = await fetch(`/api/books/my-borrows?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setActiveBorrows(Array.isArray(data) ? data : []);
  };

  const handleBorrow = async (bookIdValue) => {
    if (!bookIdValue) return;

    const res = await fetch('/api/books/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: bookIdValue, userEmail: user.email }),
    });
    const result = await res.json();

    if (res.ok) {
      alert('Request successful! You can pick up your book at the counter.');
      setBorrowId('');
      fetchBooks();
      fetchBorrows(user.email);
    } else {
      alert(result.error || 'Unable to borrow book.');
    }
  };

  const filteredBooks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return books;
    return books.filter((book) =>
      [book.title, book.author, String(book.id)]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [books, search]);

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Welcome back, {user.name}</h1>
          <p className="page-copy">What would you like to read today?</p>
        </div>

        <div className="search-banner">
          <input
            type="search"
            placeholder="Search by title, author, or Book ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="borrow-column">
          <section className="borrow-card">
            <div className="section-heading-panel">
              <p className="eyebrow">Borrow a Book</p>
              <h2>Borrow a Book</h2>
            </div>
            <p className="small-copy">Enter the Book ID number to borrow. You can find the ID in the Books catalog (e.g., BK-001).</p>
            <form
              className="borrow-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleBorrow(borrowId.trim());
              }}
            >
              <input
                value={borrowId}
                onChange={(e) => setBorrowId(e.target.value.toUpperCase())}
                placeholder="e.g. BK-001, BK-005..."
              />
              <button type="submit" className="primary-btn" disabled={!borrowId.trim()}>
                Borrow This Book
              </button>
            </form>
            <div className="borrow-notice">
              <p>Rules: Books are due in 14 days. You can borrow up to 3 books at a time.</p>
            </div>
          </section>

          <section className="borrow-status-card">
            <div className="status-header">
              <div>
                <p className="eyebrow">Borrowed Books</p>
                <h2>Borrowed Books</h2>
              </div>
              <span className="badge-summary">{activeBorrows.length} active</span>
            </div>

            {activeBorrows.length === 0 ? (
              <div className="empty-state">No active borrows. Go grab a book!</div>
            ) : (
              <ul className="borrow-list">
                {activeBorrows.slice(0, 4).map((borrow) => (
                  <li key={borrow.id}>
                    <div>
                      <strong>{borrow.book_id}</strong>
                      <span>Due: {new Date(borrow.due_date).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="catalog-column">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Popular Books</p>
              <h2>Most borrowed this month</h2>
            </div>
            <div className="book-count">Showing {filteredBooks.length} books</div>
          </div>

          <div className="popular-grid">
            {loading ? (
              <div className="loading-state">Loading books...</div>
            ) : filteredBooks.length === 0 ? (
              <div className="empty-state">No books matched your search.</div>
            ) : (
              filteredBooks.slice(0, 10).map((book) => (
                <div className="book-card" key={book.id}>
                  <div className="book-artifact" />
                  <div className="book-card-copy">
                    <span className="book-card-title">{book.title}</span>
                    <span className="book-card-author">by {book.author}</span>
                  </div>
                  <div className="book-card-footer">
                    <span className={`pill ${book.available_copies > 0 ? 'pill-available' : 'pill-unavailable'}`}>
                      {book.available_copies > 0 ? `${book.available_copies} AVAILABLE` : 'UNAVAILABLE'}
                    </span>
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={book.available_copies <= 0}
                      onClick={() => handleBorrow(book.id)}
                    >
                      Borrow
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
