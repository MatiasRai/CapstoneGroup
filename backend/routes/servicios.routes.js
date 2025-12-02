const express = require('express');
const router = express.Router();
const {
  createServicio,
  getServiciosByEmpresa,
  getAllServicios,  
  updateServicio,
  deleteServicio
} = require('../controllers/servicios.controller');


router.get('/todos/disponibles', getAllServicios);


router.post('/', createServicio);


router.get('/:id_empresa', getServiciosByEmpresa);


router.put('/:id_servicio', updateServicio);


router.delete('/:id_servicio', deleteServicio);

module.exports = router;