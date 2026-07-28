import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Library, Search, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableBooks, setAvailableBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [feeDue, setFeeDue] = useState(0.00);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, userRes] = await Promise.all([
        api.get('/books'),
        api.get('/auth/me')
      ]);
      setAvailableBooks(booksRes.data.filter(b => b.isAvailable));
      setBorrowedBooks(userRes.data.borrowedBooks || []);
      setFeeDue(userRes.data.feeDueStatus || 0);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const handleIssueRequest = async (bookId) => {
    try {
      await api.post(`/books/${bookId}/issue`);
      alert('Book issued successfully!');
      fetchData();
    } catch (error) {
      console.error('Error issuing book', error);
      alert(error.response?.data?.message || 'Failed to issue book');
    }
  };

  const handleReturnRequest = async (bookId) => {
    try {
      await api.post(`/books/${bookId}/return`);
      alert('Book returned successfully!');
      fetchData();
    } catch (error) {
      console.error('Error returning book', error);
      alert(error.response?.data?.message || 'Failed to return book');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <header className="dashboard-header">
        <div className="dashboard-title">
          <Library style={{ color: 'var(--primary-color)' }} />
          <span>Student Portal</span>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="container" style={{ marginTop: '2rem' }}>

        {/* User Stats / Overview */}
        <div className="stats-grid">
          <div className="stat-card glass">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <Book size={24} />
            </div>
            <div className="stat-content">
              <h3>Currently Borrowed</h3>
              <p>{borrowedBooks.length}</p>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ backgroundColor: feeDue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: feeDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {feeDue > 0 ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
            </div>
            <div className="stat-content">
              <h3>Fee Due Status</h3>
              <p style={{ color: feeDue > 0 ? 'var(--danger)' : 'inherit' }}>
                ${feeDue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

          {/* Search & Issue Books */}
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Search Books</h2>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by title, author, or ISBN..."
                style={{ paddingLeft: '2.5rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Book Details</th>
                    {/* <th>Last Submission Date (If Issued Today)</th> */}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableBooks.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase())).map(book => {
                    const submissionDate = new Date();
                    submissionDate.setDate(submissionDate.getDate() + 10);
                    return (
                      <tr key={book._id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{book.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{book.author}</div>
                        </td>
                        {/* <td>
                        <span className="badge badge-warning">{submissionDate.toLocaleDateString()}</span>
                      </td> */}
                        <td>
                          <button className="btn btn-primary" onClick={() => handleIssueRequest(book._id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            Request Issue
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Borrowed Books / Returns */}
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>My Borrowed Books</h2>

            {borrowedBooks.length === 0 ? (
              <div className="text-center" style={{ color: 'var(--text-secondary)', padding: '2rem' }}>
                You have no books currently borrowed.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Last Submission Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowedBooks.map(borrowed => {
                      const book = borrowed.bookId;
                      if (!book) return null;
                      return (
                        <tr key={borrowed._id || book._id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{book.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{book.author}</div>
                          </td>
                          <td>
                            <span className="badge badge-warning">{new Date(borrowed.dueDate).toLocaleDateString()}</span>
                          </td>
                          <td>
                            <button className="btn btn-outline" onClick={() => handleReturnRequest(book._id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              Return Book
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserDashboard;
