const express = require('express');
const cors = require('cors');
const app = express();

// ✅ Middlewares globales
app.use(cors());
app.use(express.json());

// ✅ Prefijo para todas las rutas de la API
app.use('/api/v1/usuarios', require('./routes/usuarios.routes'));
app.use('/api/v1/empresas', require('./routes/empresas.routes'));
app.use('/api/v1/adm_empresa', require('./routes/adm.routes'));
app.use('/api/v1/discapacidades', require('./routes/discapacidades.routes'));
app.use('/api/v1/login', require('./routes/login.routes'));
app.use('/api/v1/rutas', require('./routes/rutas.routes'));
app.use('/api/v1/tipos_ruta', require('./routes/tiposRuta.routes')); // ✅ NUEVO: Tipos de ruta

// ✅ Ruta raíz de prueba
app.get('/', (req, res) => {
  res.send('🚀 API Accesibilidad funcionando correctamente');
});

// ✅ Servidor en puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 Servidor backend corriendo en: http://localhost:${PORT}`);
});
