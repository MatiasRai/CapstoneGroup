const express = require('express');
const router = express.Router();
const {
  createServicio,
  getServiciosByEmpresa,
  updateServicio,
  deleteServicio
} = require('../controllers/servicios.controller');

/* ======================================================
   🟢 Registrar nuevo servicio
====================================================== */
router.post('/', createServicio);

/* ======================================================
   🔹 Obtener todos los servicios de una empresa
====================================================== */
router.get('/:id_empresa', getServiciosByEmpresa);

/* ======================================================
   ✏️ Actualizar servicio por ID
   (incluye actualizaciones de lugar y tipo de discapacidad)
====================================================== */
router.put('/:id_servicio', updateServicio);

/* ======================================================
   🗑️ Eliminar servicio por ID
====================================================== */
router.delete('/:id_servicio', deleteServicio);

module.exports = router;
