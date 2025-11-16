const express = require('express');
const router = express.Router();
const {
  createServicio,
  getServiciosByEmpresa,
  getAllServicios,  // 🆕 Nueva importación
  updateServicio,
  deleteServicio
} = require('../controllers/servicios.controller');

/* ======================================================
   🆕 Obtener TODOS los servicios disponibles (empresas aprobadas)
   IMPORTANTE: Esta ruta debe ir ANTES de /:id_empresa
====================================================== */
router.get('/todos/disponibles', getAllServicios);

/* ======================================================
   🟢 Registrar nuevo servicio
====================================================== */
router.post('/', createServicio);

/* ======================================================
   🔹 Obtener todos los servicios de una empresa específica
====================================================== */
router.get('/:id_empresa', getServiciosByEmpresa);

/* ======================================================
   ✏️ Actualizar servicio por ID
====================================================== */
router.put('/:id_servicio', updateServicio);

/* ======================================================
   🗑️ Eliminar servicio por ID
====================================================== */
router.delete('/:id_servicio', deleteServicio);

module.exports = router;