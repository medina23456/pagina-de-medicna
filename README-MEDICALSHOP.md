# Medicalshop Jaén

Tienda en español con catálogo, búsqueda, filtros por categoría, precio y disponibilidad, portadas por categoría y consultas por WhatsApp al **+51 932 122 822**.

## Abrir

La vista previa local usa `http://localhost:5173/`. El panel está en `http://localhost:5173/admin`.

El usuario es **admin**. La contraseña inicial está en `outputs/acceso-administrador.txt`, excluido del repositorio. Debe cambiarse en el primer acceso. No necesita correo.

Para iniciar desde esta carpeta:

```powershell
node scripts/run-framework.mjs dev
```

Mantén abierta la terminal mientras usas la página. Los datos locales se guardan en `.wrangler/state`; no borres esa carpeta si quieres conservar tus cambios. Los cambios en una vista previa local no se transfieren automáticamente a una futura base de producción.

## Administrar

- **Productos:** crear, editar, eliminar, ocultar, destacar, definir precio, disponibilidad, tallas, colores y fotografía.
- **Categorías:** crear, editar, ordenar y eliminar categorías vacías. Cada una tiene su título, descripción e imagen de portada.
- **Página web:** editar logotipo, color, portada, textos, fotografías, dirección, WhatsApp y pie de página.
- **Seguridad:** cambiar la contraseña. El cambio cierra todas las sesiones.
- Los cambios se guardan en la base de datos. El panel detecta versiones concurrentes y evita sobrescribir cambios de otra sesión.
- Las imágenes admiten JPG, PNG y WebP de hasta 8 MB y se guardan en almacenamiento de objetos.

Los artículos iniciales son una selección basada en las referencias proporcionadas. Las fotos son referenciales y los precios quedan como «A consultar» hasta que el administrador introduzca los valores reales. Las tallas y colores deben confirmarse con la tienda.

## Publicación

La aplicación está preparada para Cloudflare Workers mediante Sites, con base D1 (`DB`) y almacenamiento R2 (`BUCKET`). El sitio registrado en `.openai/hosting.json` no fue accesible al intentar publicarlo: Sites respondió `project_not_found`. **No hay una publicación en Internet verificada.** Se preservó el identificador original para recuperar el sitio sin crear duplicados.

Para reanudar la publicación es necesario restaurar el acceso al sitio original con la cuenta/espacio correspondiente. Después se deben configurar `ADMIN_INITIAL_HASH` y `ADMIN_INITIAL_SALT` como secretos de ejecución, aplicar las migraciones mediante Sites y publicar el código compilado. No publiques `.env.local`, `.dev.vars`, `outputs/`, ni `.wrangler/`.

## Desarrollo y comprobaciones

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
node scripts/run-framework.mjs build
```

La compilación produce `dist/server/index.js`, `dist/client` y `dist/.openai`.

La base local se preparó con `drizzle/0000_ordinary_spyke.sql`. No vuelvas a aplicar esa migración sobre la misma base. Para un entorno nuevo, compila y aplica:

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_ordinary_spyke.sql
```

`scripts/verify-local.mjs` ejecuta comprobaciones de integración sobre una instancia de desarrollo sin usuarios activos: modifica temporalmente contraseña y catálogo, verifica persistencia y restaura el contenido original. Usa solo un entorno local de prueba. La evidencia de esta ejecución está en `outputs/verification.json`.

## Imágenes

Las referencias suministradas están en `public/assets/`. El hero `public/assets/hero.png` se creó con la herramienta integrada de generación de imágenes: «Dos profesionales latinoamericanos de salud con uniformes azul navy y celeste, fotografía editorial de estudio, fondo celeste claro, luz suave, composición horizontal, sin textos ni logos». Los recortes del material de referencia se presentan mediante CSS, conservando los archivos originales.

## Seguridad implementada

Contraseñas con PBKDF2 SHA-256 y salt aleatorio, sesiones opacas almacenadas mediante hash, cookies HttpOnly y SameSite, caducidad de sesión, verificación de origen, límite de intentos de acceso y validación de datos y formatos de imagen en el servidor. La contraseña inicial solo se utiliza al crear el registro del administrador; cambiarla actualiza el registro persistente.
