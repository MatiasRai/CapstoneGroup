const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[aby]\$/.test(str);
}

const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
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
            db.query('UPDATE adm_empresa SET contrasena=? WHERE id_adm_Empresa=?',
              [newHash, admEmpresa.id_adm_Empresa]);
          }
        }

        if (match) {
          return res.json({
            role: 'adm_empresa',
            id: admEmpresa.id_adm_Empresa,
            correo: admEmpresa.correo,
            font_size: 16,
            high_contrast: 0,
            message: 'Login correcto'
          });
        }
      }

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
              db.query('UPDATE usuario SET contrasena=? WHERE id_usuario=?',
                [newHash, usuario.id_usuario]);
            }
          }

          if (match) {
            // Obtener información de discapacidad
            const queryDiscapacidad = `
              SELECT d.id_discapacidad, d.tipo_discapacidad 
              FROM discapacidades d 
              WHERE d.id_discapacidad = ?
            `;
            
            db.query(queryDiscapacidad, [usuario.Discapacidades_id_discapacidad], (errDisc, discRows) => {
              let discapacidadInfo = null;
              if (!errDisc && discRows && discRows.length > 0) {
                discapacidadInfo = {
                  id_discapacidad: discRows[0].id_discapacidad,
                  tipo_discapacidad: discRows[0].tipo_discapacidad
                };
              }
              
              return res.json({
                role: 'usuario',
                id: usuario.id_usuario,
                correo: usuario.correo,
                font_size: usuario.font_size,
                high_contrast: usuario.high_contrast,
                discapacidad: discapacidadInfo,
                message: 'Login correcto'
              });
            });
            return; // Salir para evitar continuar
          }
        }

        db.query('SELECT * FROM adm WHERE Correo = ?', [correo], async (err3, rows3) => {
          if (err3) return res.status(500).json({ error: err3.message });

          if (rows3.length > 0) {
            const adm = rows3[0];
            let match = false;

            if (isBcryptHash(adm.Contrasena)) {
              match = await bcrypt.compare(contrasena, adm.Contrasena);
            } else {
              const md5 = crypto.createHash('md5').update(contrasena).digest('hex');
              if (md5 === adm.Contrasena || contrasena === adm.Contrasena) {
                match = true;
                const newHash = await bcrypt.hash(contrasena, 10);
                db.query('UPDATE adm SET Contrasena=? WHERE id_admin=?',
                  [newHash, adm.id_admin]);
              }
            }

            if (match) {
              return res.json({
                role: 'adm',
                id: adm.id_admin,
                correo: adm.Correo,
                font_size: 16,
                high_contrast: 0,
                message: 'Login correcto'
              });
            }
          }

          return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = { login };
