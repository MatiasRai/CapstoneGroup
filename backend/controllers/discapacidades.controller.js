const db = require('../config/db');

const getDiscapacidades = (req, res) => {
  db.query('SELECT * FROM discapacidades', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

module.exports = { getDiscapacidades };
