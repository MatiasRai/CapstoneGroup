const express = require('express');
const router = express.Router();
const {
  getEmpresas,
  createEmpresa,
  updateEstadoEmpresa,
  getEmpresaByAdm
} = require('../controllers/empresas.controller');

// 🔹 Obtener todas las empresas
router.get('/', getEmpresas);

// 🔹 Crear nueva empresa
router.post('/', createEmpresa);

// 🔹 Actualizar estado de una empresa
router.put('/:id/estado', updateEstadoEmpresa);

// 🔹 Obtener empresa por ID del administrador logeado
router.get('/admin/:id_adm_empresa', getEmpresaByAdm);

module.exports = router;
    