const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/usuarios', require('./routes/usuarios.routes'));
app.use('/empresas', require('./routes/empresas.routes'));
app.use('/adm_empresa', require('./routes/adm.routes'));
app.use('/discapacidades', require('./routes/discapacidades.routes'));
const loginRoutes = require('./routes/login.routes');
app.use('/login', loginRoutes);
// Servidor
app.listen(3000, () => console.log('🚀 Backend corriendo en http://localhost:3000'));
