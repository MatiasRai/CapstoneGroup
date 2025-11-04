const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas con prefijo de /api/v1
app.use('/api/v1/usuarios', require('./routes/usuarios.routes'));
app.use('/api/v1/empresas', require('./routes/empresas.routes'));
app.use('/api/v1/adm_empresa', require('./routes/adm.routes'));
app.use('/api/v1/discapacidades', require('./routes/discapacidades.routes'));
app.use('/api/v1/login', require('./routes/login.routes'));
app.use('/api/v1/servicios', require('./routes/servicios.routes'));
app.use('/api/v1/rutas', require('./routes/rutas.routes')); // 👈 AGREGAR ESTA LÍNEA

app.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Backend corriendo en http://192.168.1.88:3000');
});
