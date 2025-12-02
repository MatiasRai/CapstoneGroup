const db = require('../config/db');


const getDiscapacidades = (req, res) => {
  db.query('SELECT * FROM discapacidades', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};


const getTiposDiscapacidades = (req, res) => {
  db.query('SELECT * FROM tipos_discapacidad ORDER BY nombre_discapacidad ASC', (err, rows) => {
    console.log('✅ Tipos discapacidad encontrados:', rows.length);
    if (err) return res.status(500).json({ error: err.message });
    console.log('✅ Tipos discapacidad encontrados:', rows.length);

    res.json(rows);
  });
};

module.exports = { 
  getDiscapacidades,
  getTiposDiscapacidades  
};