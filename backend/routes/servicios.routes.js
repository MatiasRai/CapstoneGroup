const express = require('express');
const router = express.Router();
const { createServicio, getServiciosByEmpresa } = require('../controllers/servicios.controller');

// Registrar servicio
router.post('/', createServicio);

// Obtener servicios por empresa
router.get('/:id_empresa', getServiciosByEmpresa);

module.exports = router;
