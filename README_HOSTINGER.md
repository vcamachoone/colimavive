# 🚀 Guía de Despliegue en Hostinger · Colima Vivo 1.0

Esta guía te explica cómo subir **Colima Vivo 1.0** a tu hosting en **Hostinger** para que cualquier jugador pueda jugar en línea desde su computadora o celular y registrar sus récords en el **Top Global**.

---

## 📋 ¿Qué incluye la preparación para Hostinger?
1. **Frontend Completo**: `index.html` optimizado con diseño responsivo, controles de teclado, táctiles y mandos.
2. **Backend de Récords Globales**: `api/leaderboard.php` listo para funcionar en cualquier plan de Hostinger (cero configuración: crea automáticamente la base de datos `data/leaderboard.db` con SQLite y respaldo JSON).
3. **Seguridad y Rendimiento**: `.htaccess` preconfigurado con compresión GZIP, caché para assets y protección de datos.
4. **Modo Offline / Local**: Si juegas sin conexión a internet, el juego guarda automáticamente tus récords en `localStorage` y se sincroniza cuando vuelves a estar en línea.

---

## 🛠️ Pasos para Subir el Juego a Hostinger

### Opción A: Mediante el Administrador de Archivos de Hostinger (Recomendado - 3 minutos)

1. **Inicia sesión** en tu cuenta de Hostinger (hPanel).
2. Ve a la sección **Sitios Web** y selecciona tu dominio o subdominio.
3. Haz clic en **Administrador de Archivos** (File Manager).
4. Entra a la carpeta **`public_html`**.
5. Sube todos los archivos del juego a `public_html`:
   - `index.html` (debe quedar directamente en `public_html/index.html`)
   - Carpeta `api/` (con `api/leaderboard.php`)
   - Carpeta `data/` (se creará automáticamente si no la subes)
   - Archivo `.htaccess`
6. ¡Listo! Abre tu dominio en tu navegador (ej. `https://tudominio.com`) y el juego estará funcionando en vivo para todo el mundo.

---

### Opción B: Mediante FTP (FileZilla)

1. En tu panel de Hostinger, copia los datos de acceso FTP (Host, Usuario, Contraseña, Puerto 21).
2. Conéctate con **FileZilla** o tu cliente FTP favorito.
3. Navega al directorio `/public_html`.
4. Arrastra y suelta todos los archivos de este proyecto en `/public_html`.

---

## 🏆 ¿Cómo funciona el Top de Récords Global?
- Cada vez que un jugador pierde todas sus vidas (**Game Over**) o completa la campaña turística, el juego le muestra una ventana para ingresar su nombre o apodo (ej. *ColimotePro*).
- El juego envía el puntaje, las monedas, el nivel alcanzado y si conquistó el **Mundo del Revés** a `api/leaderboard.php`.
- El ranking global se actualiza al instante en la base de datos centralizada.
- Cualquier jugador desde cualquier parte del mundo puede hacer clic en el botón **🏆 Récords** para ver el Top 10 y Top 50 global.
- Incluye protección contra spam e inyecciones, con sanitización automática de caracteres.

---

## ⚙️ Requisitos en Hostinger
- Cualquier plan de Hostinger (Single, Premium, Business o Cloud).
- Versión de PHP recomendada: **PHP 8.1 o 8.2** (habilitada por defecto en Hostinger).
- La extensión `pdo_sqlite` viene activada de fábrica en Hostinger, por lo que no necesitas crear bases de datos MySQL manualmente.
