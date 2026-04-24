const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, document_type, related_to, related_id, description, file_name, file_size, uploaded_by, expiry_date, status } = req.body;
    const result = await pool.query(
      `INSERT INTO documents (title, document_type, related_to, related_id, description, file_name, file_size, uploaded_by, expiry_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, document_type, related_to, related_id, description, file_name, file_size, uploaded_by, expiry_date, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, document_type, related_to, related_id, description, file_name, file_size, uploaded_by, expiry_date, status } = req.body;
    const result = await pool.query(
      `UPDATE documents SET title=$1, document_type=$2, related_to=$3, related_id=$4, description=$5,
       file_name=$6, file_size=$7, uploaded_by=$8, expiry_date=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, document_type, related_to, related_id, description, file_name, file_size, uploaded_by, expiry_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json({ message: 'Document deleted', document: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
