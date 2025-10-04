const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas con prefijo /api/v1
app.use('/api/v1/usuarios', require('./routes/usuarios.routes'));
app.use('/api/v1/empresas', require('./routes/empresas.routes'));
app.use('/api/v1/adm_empresa', require('./routes/adm.routes'));
app.use('/api/v1/discapacidades', require('./routes/discapacidades.routes'));
app.use('/api/v1/login', require('./routes/login.routes'));

app.listen(3000, () => console.log('🚀 Backend corriendo en http://localhost:3000'));
