// backend/db.js
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prueba1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection()
  .then(() => {
    console.log('✅ Conectado a MySQL');
  })
  .catch(err => {
    console.error('❌ Error en MySQL:', err.message);
    process.exit(1);
  });

module.exports = db;
