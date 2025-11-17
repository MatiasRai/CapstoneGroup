const express = require('express');
const cors = require('cors');
const app = express();

/* ============================================
   🌐 MIDDLEWARES GENERALES
============================================ */
app.use(cors({
  origin: "*",  // puedes restringir si quieres
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));
app.use(express.json());

console.log("🔧 Iniciando servidor...");


/* ============================================
   📌 RUTAS PRINCIPALES (API v1)
============================================ */
app.use('/api/v1/usuarios', require('./routes/usuarios.routes'));
app.use('/api/v1/empresas', require('./routes/empresas.routes'));
app.use('/api/v1/adm_empresa', require('./routes/adm.routes'));
app.use('/api/v1/discapacidades', require('./routes/discapacidades.routes'));
app.use('/api/v1/login', require('./routes/login.routes'));
app.use('/api/v1/servicios', require('./routes/servicios.routes'));
app.use((req, res, next) => {
  res.status(404).json({
    error: "❌ Ruta no encontrada",
    ruta: req.originalUrl
  });
});



app.use((err, req, res, next) => {
  console.error("🔥 Error en el servidor:", err);

  res.status(500).json({
    error: "❌ Error interno en el servidor"
  });
});



const PORT = 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend corriendo en http://192.168.1.88:${PORT}`);
  console.log(`📡 API lista en http://192.168.1.88:${PORT}/api/v1`);
});

module.exports = app;
app.use('/api/v1/rutas', require('./routes/rutas.routes'));
app.use('/api/v1/resenas', require('./routes/resenas.routes')); // 👈 ✅ NUEVA RUTA AGREGADA

app.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Backend corriendo en http://192.168.1.88:3000');
});
