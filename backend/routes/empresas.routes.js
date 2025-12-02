const express = require('express');
const router = express.Router();

const empresaController = require('../controllers/empresas.controller');



router.get('/paginadas', empresaController.getEmpresasPaginadas);





router.get('/', empresaController.getEmpresas);


router.post('/', empresaController.createEmpresa);


router.put('/:id/estado', empresaController.updateEstadoEmpresa);


router.get('/admin/:id_adm_empresa', empresaController.getEmpresaByAdm);


router.get('/admin/:id_adm_empresa/servicios', empresaController.getServiciosByEmpresa);


router.put('/servicios/:id', empresaController.updateServicio);


router.delete('/servicios/:id', empresaController.deleteServicio);


router.put('/:id', empresaController.updateEmpresa);


router.delete('/:id', empresaController.deleteEmpresa);

module.exports = router;
