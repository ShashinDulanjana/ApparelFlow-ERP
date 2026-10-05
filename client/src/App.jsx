import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // New Order Form State
  const [newOrder, setNewOrder] = useState({
    orderNo: '',
    recipeId: '',
    targetQty: '',
    fabricRollId: '',
    actualFabricYds: ''
  });

  // Verification Form State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verificationCounts, setVerificationCounts] = useState({});
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    if (token) {
      fetchRecipes();
      fetchOrders();
    }
  }, [token]);

  const handleLogin = async (e, demoEmail) => {
    if (e) e.preventDefault();
    const email = demoEmail || loginEmail;
    const password = demoEmail ? 'password123' : loginPassword;

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.clear();
  };

  const fetchRecipes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/recipes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipes(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/orders`, newOrder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order created successfully!');
      setNewOrder({ orderNo: '', recipeId: '', targetQty: '', fabricRollId: '', actualFabricYds: '' });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create order');
    }
  };

  const handleVerifySubmit = async (orderId) => {
    try {
      const componentCounts = Object.keys(verificationCounts).map(compId => ({
        componentId: compId,
        actualQty: verificationCounts[compId]
      }));

      const res = await axios.post(`${API_BASE}/orders/${orderId}/verify`, {
        componentCounts,
        rejectionNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(res.data.message);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Verification failed');
    }
  };

  const handleHandover = async (orderId) => {
    try {
      const res = await axios.post(`${API_BASE}/orders/${orderId}/handover`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'HARD STOP BLOCK: Order Rejected!');
    }
  };

  // ---------------- LOGIN SCREEN ----------------
  if (!token) {
    return (
      <div className="app-container" style={{ maxWidth: '450px', marginTop: '80px' }}>
        <div className="card">
          <h2>ApparelFlow ERP Login</h2>
          <p style={{ color: 'var(--text-muted)' }}>Select Quick Role Login or enter credentials:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <button className="btn" onClick={() => handleLogin(null, 'supervisor@apparelflow.com')}>Login as Cutting Supervisor</button>
            <button className="btn" style={{ background: '#0284c7' }} onClick={() => handleLogin(null, 'verifier@apparelflow.com')}>Login as Cutting Verifier</button>
            <button className="btn" style={{ background: '#7c3aed' }} onClick={() => handleLogin(null, 'sewing@apparelflow.com')}>Login as Sewing Supervisor</button>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />

          <form onSubmit={handleLogin}>
            <input className="input-field" type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            <input className="input-field" type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            <button className="btn" style={{ width: '100%' }} type="submit">Login Custom User</button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- MAIN ERP TERMINAL ----------------
  return (
    <div className="app-container">
      {/* HEADER */}
      <div className="header-nav">
        <div>
          <h2 style={{ margin: 0 }}>ApparelFlow ERP - Gatekeeper Terminal</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Logged as: <b>{user.fullName}</b> ({user.role})</span>
        </div>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      {/* 1. CUTTING SUPERVISOR VIEW */}
      {user.role === 'cutting_supervisor' && (
        <div className="card">
          <h3>Create Cutting Order</h3>
          <form onSubmit={handleCreateOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input className="input-field" placeholder="Order No (e.g. ORD-1001)" value={newOrder.orderNo} onChange={e => setNewOrder({...newOrder, orderNo: e.target.value})} required />
            <select className="input-field" value={newOrder.recipeId} onChange={e => setNewOrder({...newOrder, recipeId: e.target.value})} required>
              <option value="">Select Recipe / Garment</option>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.recipeCode})</option>)}
            </select>
            <input className="input-field" type="number" placeholder="Target Quantity (Pcs)" value={newOrder.targetQty} onChange={e => setNewOrder({...newOrder, targetQty: e.target.value})} required />
            <input className="input-field" placeholder="Fabric Roll ID" value={newOrder.fabricRollId} onChange={e => setNewOrder({...newOrder, fabricRollId: e.target.value})} required />
            <input className="input-field" type="number" step="0.1" placeholder="Actual Fabric Used (Yards)" value={newOrder.actualFabricYds} onChange={e => setNewOrder({...newOrder, actualFabricYds: e.target.value})} required />
            <button className="btn" type="submit" style={{ gridColumn: 'span 2' }}>Submit Order for Verification</button>
          </form>
        </div>
      )}

      {/* 2. CUTTING VERIFIER VIEW (TRAFFIC LIGHT ENGINE) */}
      {user.role === 'cutting_verifier' && selectedOrder && (
        <div className="card" style={{ borderColor: 'var(--primary-blue)' }}>
          <h3>Verification Terminal - {selectedOrder.orderNo}</h3>
          <p>Garment: <b>{selectedOrder.recipe.name}</b> | Target Qty: <b>{selectedOrder.targetQty} Pcs</b></p>
          
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Required Pcs/Garment</th>
                <th>Expected Total Pcs</th>
                <th>Actual Measured Pcs</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.recipe.components.map(comp => {
                const expected = selectedOrder.targetQty * comp.piecesPerGarment;
                return (
                  <tr key={comp.id}>
                    <td>{comp.componentName}</td>
                    <td>{comp.piecesPerGarment}</td>
                    <td><b>{expected}</b></td>
                    <td>
                      <input 
                        className="input-field" 
                        type="number" 
                        style={{ margin: 0, width: '120px' }}
                        placeholder={`Exp: ${expected}`}
                        onChange={e => setVerificationCounts({ ...verificationCounts, [comp.id]: e.target.value })} 
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '15px' }}>
            <input className="input-field" placeholder="Rejection / Discrepancy Note (Required if rejected)" value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-success" onClick={() => handleVerifySubmit(selectedOrder.id)}>Run Gatekeeper Check & Save</button>
              <button className="btn btn-danger" onClick={() => setSelectedOrder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ORDERS TABLE VIEW */}
      <div className="card">
        <h3>Cutting Orders Status & Gatekeeper Control</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Order No</th>
              <th>Recipe</th>
              <th>Target Qty</th>
              <th>Status</th>
              <th>Action / Hard Stop Check</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><b>{o.orderNo}</b></td>
                <td>{o.recipe.name}</td>
                <td>{o.targetQty}</td>
                <td>
                  <span className={`badge badge-${o.status === 'VERIFIED' ? 'GREEN' : o.status === 'REJECTED' ? 'RED' : 'YELLOW'}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  {user.role === 'cutting_verifier' && o.status === 'PENDING_VERIFICATION' && (
                    <button className="btn" onClick={() => setSelectedOrder(o)}>Verify Components</button>
                  )}
                  {user.role === 'sewing_supervisor' && (
                    <button className={`btn ${o.status === 'VERIFIED' ? 'btn-success' : 'btn-danger'}`} onClick={() => handleHandover(o.id)}>
                      {o.status === 'VERIFIED' ? 'Accept into Sewing' : 'Handover Blocked (Hard Stop)'}
                    </button>
                  )}
                  {user.role === 'cutting_supervisor' && <span>--</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}