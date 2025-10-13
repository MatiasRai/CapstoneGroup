const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 📋 Obtener todos los tipos de ruta
router.get('/', async (req, res) => {
  try {
    const [tipos] = await db.query('SELECT id_tipo_ruta, nombre_tipo_ruta FROM tipos_ruta');
    res.json(tipos);
  } catch (error) {
    console.error('❌ Error al obtener tipos de ruta:', error);
    res.status(500).json({ message: 'Error al obtener tipos de ruta' });
  }
});

module.exports = router;
