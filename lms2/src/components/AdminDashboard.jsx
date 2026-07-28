import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Users, DollarSign, LogOut, Search, PlusCircle, X } from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', inventoryCount: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, usersRes] = await Promise.all([
        api.get('/books'),
        api.get('/users')
      ]);
      setInventory(booksRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const handleClearDues = async (userId) => {
    try {
      await api.post(`/users/${userId}/clear-dues`);
      fetchData();
    } catch (error) {
      console.error('Error clearing dues', error);
      alert('Failed to clear dues');
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books', newBook);
      setShowAddModal(false);
      setNewBook({ title: '', author: '', isbn: '', inventoryCount: 1 });
      fetchData();
    } catch (error) {
      console.error('Error adding book', error);
      alert('Failed to add book');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const totalBooks = inventory.reduce((acc, book) => acc + (book.inventoryCount || 1), 0);
  const activeUsers = users.length;
  const totalFeesDue = users.reduce((acc, user) => acc + (user.feeDueStatus || 0), 0);

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <header className="dashboard-header">
        <div className="dashboard-title">
          <Book style={{ color: 'var(--primary-color)' }} />
          <span>Library Admin Panel</span>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="stats-grid">
          <div className="stat-card glass" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer', border: activeTab === 'inventory' ? '1px solid var(--primary-color)' : '' }}>
            <div className="stat-icon">
              <Book size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Books</h3>
              <p>{totalBooks}</p>
            </div>
          </div>
          <div className="stat-card glass" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer', border: activeTab === 'users' ? '1px solid var(--primary-color)' : '' }}>
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>Active Users</h3>
              <p>{activeUsers}</p>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Fees Due</h3>
              <p>${totalFeesDue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {activeTab === 'inventory' && (
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Book Inventory</h2>
              <div className="flex gap-2">
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search books..." 
                    style={{ paddingLeft: '2.5rem', width: '250px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  <PlusCircle size={16} /> Add Book
                </button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Status</th>
                    <th>Issued To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase())).map(book => {
                    const issuedToUsers = users.filter(u => u.borrowedBooks.some(bb => bb.bookId && bb.bookId._id === book._id));
                    return (
                    <tr key={book._id}>
                      <td style={{ fontWeight: 500 }}>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.isbn}</td>
                      <td>
                        <span className={`badge ${book.isAvailable ? 'badge-success' : 'badge-warning'}`}>
                          {book.isAvailable ? 'Available' : 'Issued/Out'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {issuedToUsers.length > 0 ? (
                          issuedToUsers.map(u => <div key={u._id}>{u.name}</div>)
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>None</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>User Management</h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Issued Books</th>
                    <th>Fee Due Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 500 }}>{user.name}</td>
                      <td>{user.email}</td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {user.borrowedBooks && user.borrowedBooks.length > 0 ? (
                          user.borrowedBooks.map(bb => (
                            <div key={bb._id || bb.bookId?._id}>
                              {bb.bookId?.title || 'Unknown Book'}
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>None</span>
                        )}
                      </td>
                      <td>
                        {user.feeDueStatus > 0 ? (
                          <span className="badge badge-danger">${user.feeDueStatus.toFixed(2)} Due</span>
                        ) : (
                          <span className="badge badge-success">Clear</span>
                        )}
                      </td>
                      <td>
                        {user.feeDueStatus > 0 && (
                          <button className="btn btn-outline" onClick={() => handleClearDues(user._id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            Clear Dues
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', width: '400px', position: 'relative', backgroundColor: 'var(--bg-color)' }}>
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Add New Book</h2>
            <form onSubmit={handleAddBook}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" required value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Author</label>
                <input type="text" className="form-input" required value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input type="text" className="form-input" required value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Inventory Count</label>
                <input type="number" className="form-input" required min="1" value={newBook.inventoryCount} onChange={e => setNewBook({...newBook, inventoryCount: parseInt(e.target.value)})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Book</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
