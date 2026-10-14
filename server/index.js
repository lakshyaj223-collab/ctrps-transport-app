const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// -------------------------------------------------------------
// 1. ROUTES APIs
// -------------------------------------------------------------

// Get All Active Routes
app.get('/api/routes', (req, res) => {
  db.all("SELECT * FROM routes WHERE status = 'active'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add New Route (Admin Only)
app.post('/api/routes', (req, res) => {
  const { route_name, source, destination, stops, bus_no, time, fee } = req.body;
  const query = `INSERT INTO routes (route_name, source, destination, stops, bus_no, time, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`;
  
  db.run(query, [route_name, source, destination, stops, bus_no, time, fee], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ route_id: this.lastID, route_name, source, destination, stops, bus_no, time, fee, status: 'active' });
  });
});

// Delete / Deactivate Route (Admin Only)
app.delete('/api/routes/:id', (req, res) => {
  const { id } = req.params;
  db.run("UPDATE routes SET status = 'inactive' WHERE route_id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, route_id: id });
  });
});


// -------------------------------------------------------------
// 2. PASS APPLICATIONS APIs (SRS 3.1.5 - 3.1.7 Compliant)
// -------------------------------------------------------------

// Submit Pass Application
app.post('/api/passes', (req, res) => {
  const { name, collegeId, category, department, route, boardingPoint, duration, phone, address } = req.body;
  const reqId = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
  const appliedOn = new Date().toLocaleDateString();

  const query = `INSERT INTO passes (req_id, name, college_id, category, route, status, applied_on) VALUES (?, ?, ?, ?, ?, 'Under Review', ?)`;
  
  db.run(query, [reqId, name, collegeId, category, route, appliedOn], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      id: reqId,
      name,
      collegeId,
      category,
      department: department || 'General',
      route,
      boardingPoint: boardingPoint || 'Central Stop',
      duration: duration || '1 Month',
      phone,
      address,
      status: 'Under Review',
      appliedOn
    });
  });
});

// Get All Applications (For Admin & Student)
app.get('/api/passes', (req, res) => {
  db.all("SELECT * FROM passes ORDER BY pass_id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => ({
      id: r.req_id,
      name: r.name,
      collegeId: r.college_id,
      category: r.category,
      route: r.route,
      status: r.status,
      appliedOn: r.applied_on
    }));
    res.json(formatted);
  });
});

// Update Application Status (Approve / Reject with Remarks)
app.patch('/api/passes/:reqId', (req, res) => {
  const { reqId } = req.params;
  const { status, remarks } = req.body;

  db.run("UPDATE passes SET status = ? WHERE req_id = ?", [status, reqId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, reqId, status, remarks: remarks || '' });
  });
});


// -------------------------------------------------------------
// 3. AUTHENTICATION APIs
// -------------------------------------------------------------

// User Registration API
app.post('/api/register', (req, res) => {
  const { name, email, phone, role, department, password, collegeId } = req.body;
  const query = `INSERT INTO users (name, email, phone, role, department, password) VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [name, email, phone, role, department, password], function(err) {
    if (err) return res.status(400).json({ error: 'User/Email already exists' });
    res.json({ success: true, userId: this.lastID, name, email, role, collegeId, department });
  });
});

// User Login API
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  // Admin Bypass
  if (email === 'admin@college.edu' && password === 'admin123') {
    return res.json({ success: true, user: { name: 'Transport Admin', role: 'admin', email } });
  }

  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department
      }
    });
  });
});


// -------------------------------------------------------------
// 4. LISTEN SERVER (ALWAYS AT THE VERY END)
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});