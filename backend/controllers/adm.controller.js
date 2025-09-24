const db = require('../config/db');
const bcrypt = require('bcrypt');

const createAdministrador = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    db.query(
      'INSERT INTO adm_empresa (correo, contrasena) VALUES (?, ?)',
      [correo, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          id_adm_empresa: result.insertId,
          correo,
          message: '✅ Administrador registrado correctamente'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '❌ Error al registrar administrador' });
  }
};

module.exports = { createAdministrador };
