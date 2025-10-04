const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // para MD5

// 🔑 Función para detectar si es hash bcrypt
function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[aby]\$/.test(str);
}

const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // 👉 Buscar en adm_empresa
    db.query('SELECT * FROM adm_empresa WHERE correo = ?', [correo], async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      if (rows.length > 0) {
        const admEmpresa = rows[0];
        let match = false;

        if (isBcryptHash(admEmpresa.contrasena)) {
          match = await bcrypt.compare(contrasena, admEmpresa.contrasena);
        } else {
          const md5 = crypto.createHash('md5').update(contrasena).digest('hex');
          if (md5 === admEmpresa.contrasena || contrasena === admEmpresa.contrasena) {
            match = true;
            const newHash = await bcrypt.hash(contrasena, 10);
            db.query(
              'UPDATE adm_empresa SET contrasena=? WHERE id_adm_Empresa=?',
              [newHash, admEmpresa.id_adm_Empresa]
            );
          }
        }

        if (match) {
          console.log('✅ Login correcto (adm_empresa), ID:', admEmpresa.id_adm_Empresa);
          return res.json({
            role: 'adm_empresa',
            id: admEmpresa.id_adm_Empresa, // 👈 corregido
            correo: admEmpresa.correo,
            message: '✅ Login correcto (Administrador de Empresa, migrado si era MD5)'
          });
        }
      }

      // 👉 Buscar en usuario
      db.query('SELECT * FROM usuario WHERE correo = ?', [correo], async (err2, rows2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        if (rows2.length > 0) {
          const usuario = rows2[0];
          let match = false;

          if (isBcryptHash(usuario.contrasena)) {
            match = await bcrypt.compare(contrasena, usuario.contrasena);
          } else {
            const md5 = crypto.createHash('md5').update(contrasena).digest('hex');
            if (md5 === usuario.contrasena || contrasena === usuario.contrasena) {
              match = true;
              const newHash = await bcrypt.hash(contrasena, 10);
              db.query('UPDATE usuario SET contrasena=? WHERE id_usuario=?', [newHash, usuario.id_usuario]);
            }
          }

          if (match) {
            console.log('✅ Login correcto (usuario), ID:', usuario.id_usuario);
            return res.json({
              role: 'usuario',
              id: usuario.id_usuario,
              correo: usuario.correo,
              message: '✅ Login correcto (Usuario, migrado si era MD5)'
            });
          }
        }

        // 👉 Buscar en adm (administrador del sistema)
        db.query('SELECT * FROM adm WHERE correo = ?', [correo], async (err3, rows3) => {
          if (err3) return res.status(500).json({ error: err3.message });

          if (rows3.length > 0) {
            const adm = rows3[0];
            let match = false;

            if (isBcryptHash(adm.contrasena)) {
              match = await bcrypt.compare(contrasena, adm.contrasena);
            } else {
              const md5 = crypto.createHash('md5').update(contrasena).digest('hex');
              if (md5 === adm.contrasena || contrasena === adm.contrasena) {
                match = true;
                const newHash = await bcrypt.hash(contrasena, 10);
                db.query('UPDATE adm SET contrasena=? WHERE id_adm=?', [newHash, adm.id_adm]);
              }
            }

            if (match) {
              console.log('✅ Login correcto (adm), ID:', adm.id_adm);
              return res.json({
                role: 'adm',
                id: adm.id_adm,
                correo: adm.correo,
                message: '✅ Login correcto (Administrador del Sistema, migrado si era MD5)'
              });
            }
          }

          // ❌ Si no encontró en ninguna tabla
          return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        });
      });
    });
  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    res.status(500).json({ error: '❌ Error en el servidor' });
  }
};

module.exports = { login };
