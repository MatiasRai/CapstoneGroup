const express = require('express');
const router = express.Router();

const empresaController = require('../controllers/empresas.controller');


// ======================================================
// 📌 NUEVA RUTA → Empresas paginadas
// ======================================================
router.get('/paginadas', empresaController.getEmpresasPaginadas);


// ======================================================
// 📌 Rutas existentes (ordenadas y mantenidas)
// ======================================================

// Obtener todas las empresas
router.get('/', empresaController.getEmpresas);

// Crear nueva empresa
router.post('/', empresaController.createEmpresa);

// Actualizar estado de una empresa
router.put('/:id/estado', empresaController.updateEstadoEmpresa);

// Obtener empresa por ID del administrador logeado
router.get('/admin/:id_adm_empresa', empresaController.getEmpresaByAdm);

// Obtener servicios de una empresa según su administrador
router.get('/admin/:id_adm_empresa/servicios', empresaController.getServiciosByEmpresa);

// Editar servicio
router.put('/servicios/:id', empresaController.updateServicio);

// Eliminar servicio
router.delete('/servicios/:id', empresaController.deleteServicio);

// Editar empresa
router.put('/:id', empresaController.updateEmpresa);

// Eliminar empresa
router.delete('/:id', empresaController.deleteEmpresa);

module.exports = router;
