const express = require('express');
const router = express.Router();
const { getDiscapacidades, getTiposDiscapacidades } = require('../controllers/discapacidades.controller');


router.get('/', getDiscapacidades);


router.get('/tipos', getTiposDiscapacidades);

module.exports = router;