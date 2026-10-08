# STIK3S LAB para Netlify

Esta versión conserva la misma página, base de datos, pedidos, cuentas, catálogo e imágenes del servidor actual. Netlify sirve la aplicación mediante una función segura: los visitantes no necesitan una cuenta de ChatGPT. Las cuentas de STIK3S LAB y la contraseña del administrador siguen funcionando.

## Publicar

1. Descomprimí el ZIP. Subí el contenido de STIK3S_LAB_NETLIFY a la raíz de tu repositorio GitHub.
2. En Netlify elegí Add new project → Import an existing project y seleccioná ese repositorio.
3. Dejá el comando de compilación vacío y la carpeta de publicación en `public`. `netlify.toml` configura las funciones y Node automáticamente.
4. Agregá el secreto `STIK3S_BACKEND_TOKEN` en Environment variables, con alcance Functions, usando el token de servicio del servidor actual. Guardalo solo en Netlify, nunca en GitHub ni dentro del ZIP.
5. Desplegá o volvé a desplegar después de guardar la variable.

No alcanza con arrastrar el ZIP a Netlify Drop: este proyecto necesita una función de servidor, que se despliega al importar el repositorio o mediante Netlify CLI.

## Administración

El catálogo está en `/`; el ingreso propio, en `/login`; el panel, en `/admin`. Si el administrador todavía usa la contraseña inicial `admin`, debe cambiarla desde su página privada original: el servidor rechaza esa contraseña desde accesos externos. El ZIP no contiene contraseñas ni datos personales de pedidos.

## Misma base de datos

No se crea ni copia una base. Las modificaciones hechas en cualquiera de las dos páginas afectan los mismos registros. La página original debe permanecer activa y el token debe ser válido. Esta es una conexión al servidor existente, no una copia independiente de su infraestructura. El servidor original conserva su privacidad.

La función solo admite rutas de la aplicación y verifica el origen antes de reenviar escrituras. No transmite identidades de ChatGPT proporcionadas por visitantes. El servidor valida sesiones, permisos y contraseñas. El límite de subida en Netlify es de 4 MB en esta versión.

La recuperación y confirmación por correo siguen pendientes de configurar en el servidor. Al activarlas, `SITE_ORIGIN` debe coincidir con el dominio definitivo de Netlify para que los enlaces vuelvan a esta página.

## Comprobaciones

`npm test` verifica origen, sesiones, permisos de rutas, protección del token, redirects, errores y transmisión de respuestas. La conexión real al servidor se comprobó leyendo catálogo y página, sin crear ni eliminar pedidos. La publicación efectiva requiere configurar la variable secreta en Netlify.
