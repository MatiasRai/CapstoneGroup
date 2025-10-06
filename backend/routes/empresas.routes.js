const express = require('express');
const router = express.Router();
const {
  getEmpresas,
  createEmpresa,
  updateEstadoEmpresa,
  getEmpresaByAdm,
  updateServicio,
  updateEmpresa,
  deleteServicio,
  getServiciosByEmpresa
} = require('../controllers/empresas.controller');

// 🔹 Obtener todas las empresas
router.get('/', getEmpresas);

// 🔹 Crear nueva empresa
router.post('/', createEmpresa);

// 🔹 Actualizar estado de una empresa
router.put('/:id/estado', updateEstadoEmpresa);

// 🔹 Obtener empresa por ID del administrador logeado
router.get('/admin/:id_adm_empresa', getEmpresaByAdm);

// 🔹 Obtener servicios de una empresa según su administrador
router.get('/admin/:id_adm_empresa/servicios', getServiciosByEmpresa);

// ✏️ Editar servicio
router.put('/servicios/:id', updateServicio);

// 🗑️ Eliminar servicio
router.delete('/servicios/:id', deleteServicio);

// ✏️ Editar empresa (⚠️ ESTA DEBE IR AL FINAL)
router.put('/:id', updateEmpresa);

module.exports = router;
