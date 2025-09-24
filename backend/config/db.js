const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prueba1'
});

db.connect(err => {
  if (err) {
    console.error('❌ Error en MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a MySQL');
});

module.exports = db;
