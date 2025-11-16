const express = require('express');
const router = express.Router();
const { getDiscapacidades, getTiposDiscapacidades } = require('../controllers/discapacidades.controller');

// 👇 Ruta existente (tabla discapacidades)
router.get('/', getDiscapacidades);

// 👇 AGREGAR NUEVA RUTA (tabla tipos_discapacidad)
router.get('/tipos', getTiposDiscapacidades);

module.exports = router;