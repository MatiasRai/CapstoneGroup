# IC-Map: Plataforma Inclusiva de Rutas Accesibles en Chile

Accesibilidad • Inclusión • Geolocalización • Servicios Adaptados

# Descripción General

IC-Map (Inclusive Chile Map) es una plataforma web y móvil orientada a personas con discapacidad que buscan rutas accesibles, servicios adaptados y lugares seguros dentro del territorio chileno.
Permite a los usuarios:

* Registrar y descubrir rutas inclusivas.

* Consultar servicios adaptados por tipo de discapacidad.

* Visualizar mapas dinámicos con Leaflet.

* Recibir orientación geográfica precisa mediante GPS.

Al mismo tiempo, permite a empresas y organizaciones registrar sus servicios accesibles, ampliando su visibilidad y fomentando una cultura inclusiva.

# Características Principales
👤 Usuarios

Registro e inicio de sesión.

Visualización de rutas accesibles.

Creación de experiencias personales de accesibilidad.

🏢 Empresas

Registro de empresa.

Publicación de servicios accesibles.

Gestión de información y visibilidad dentro del mapa.

# Tecnologías Utilizadas
Frontend	Ionic + Angular

Backend	Node.js / Express

BD	MySQL

Mapas	Leaflet

Discord

TypeScript

JavaScript

Visual Studio Code

Github

# Objetivo General

Desarrollar una plataforma integral que permita registrar, visualizar y gestionar rutas, servicios y lugares inclusivos, facilitando el desplazamiento y la participación plena de personas con discapacidad en distintos entornos urbanos.

# Objetivos Específicos

Implementar un sistema de registro de empresas y servicios accesibles.

Incorporar georreferenciación para identificar puntos críticos y seguros.

Diseñar rutas accesibles basadas en experiencias reales de los usuarios.

Promover una cultura tecnológica inclusiva mediante accesibilidad digital.

# Planteamiento del Problema

En Chile existen barreras físicas, sociales e informacionales que dificultan la movilidad de personas con discapacidad.
No existe un sistema integrado que permita identificar rutas accesibles ni servicios adaptados, lo cual genera:

Desinformación.

Riesgos durante el desplazamiento.

Exclusión en actividades cotidianas.

# Propuesta de Solución

Una plataforma digital con:

Mapas interactivos.

Registro colaborativo de rutas accesibles.

Información centralizada de servicios y empresas inclusivas.

El modelo combina accesibilidad, inteligencia de localización y participación comunitaria.

# Resultados Obtenidos

Implementación completa del sistema de registro.

Integración dinámica del mapa Leaflet sin errores de contenedor.

Geolocalización precisa en la app móvil.

Validaciones accesibles para personas con discapacidad visual.

Flujo funcional de empresas → registro → servicios → publicación en mapa.

# Alcances y Limitaciones
**Alcances**

Sistema totalmente funcional para registro y publicación de servicios.

Mapa dinámico con GPS.

Validaciones de accesibilidad visual.

Base de datos escalable para rutas, coordenadas y servicios.

**Limitaciones**

Falta integración de transporte público accesible.

# Instalación y Ejecución

**1. Clonar repositorio**

```
git clone https://github.com/tu-repo/ic-map.git
cd ic-map
```

**2. Instalar dependencias**
```
npm install leaflet
npm install @types/leaflet --save-dev
npm install @capacitor/geolocation
npm install @capacitor/app-launcher
npm install mysql
npm install -D nodemon
npm install express mysql cors
npm install express mysql cors body-parser
npx cap sync
```

**3. Levantar el entorno**

```
ionic serve --external
```

**4. Configurar backend**
```
const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prueba1'
});
```

# Conclusión

IC-Map demuestra que la tecnología puede reducir barreras y abrir oportunidades de movilidad e inclusión.
El proyecto consolida herramientas técnicas avanzadas, aplicadas a una problemática real del país, y establece una base sólida para futuras mejoras como IA de accesibilidad, análisis geográfico avanzado y participación ciudadana ampliada.

# Bibliografía

Gobierno de Chile. (2024). Normas de Accesibilidad Universal.

Leaflet.js Documentation.

Ionic Framework Docs.

Angular Official Guides.

ONU. (2020). Convención sobre los Derechos de las Personas con Discapacidad.

# Autores

Miguel Conejeros – Desarrollo Backend + Geolocalización + BD

Matias Raipane – Desarrollo Frontend + UX + Documentación
