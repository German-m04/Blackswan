# Publicación del cierre de acceso administrador

Estos cambios locales no modifican por sí solos las reglas activas de Firebase ni el despliegue de Vercel.

1. Confirmar en Firebase Auth que las dos cuentas principales tengan el correo verificado. Si usan correo y contraseña y aún no está verificado, iniciar sesión con la nueva interfaz y solicitar el enlace de verificación.
2. Revisar manualmente los documentos existentes en `admins`. Esos documentos eran escribibles públicamente y **no deben migrarse automáticamente**. La nueva colección `adminAccess` debe comenzar vacía.
3. Publicar la versión web y las funciones de API de este cambio. Publicar `firestore.rules` en la base de datos Firestore **`ai-studio-blackswanautosus-75cfe87e-dcff-46bf-8aca-99dcfa14168b`** del proyecto `gen-lang-client-0808498562`. El repositorio no incluye configuración de despliegue de reglas; comprobar en Firebase Console que la regla activa corresponde a este archivo.
4. Con una cuenta principal verificada, volver a agregar **solo** a cada integrante aprobado desde Equipo. Esa acción escribe el perfil en `admins` y el permiso nuevo en `adminAccess`. Los administradores dinámicos antiguos no podrán entrar hasta que se los apruebe otra vez.
   La variable anterior `STORAGE_ADMIN_EMAILS` ya no concede acceso a las imágenes; cada integrante necesita su permiso activo en `adminAccess`.
5. Verificar en el simulador de reglas o emulador: anónimo y usuario común no pueden leer `customers`, `quotations`, `expenses`, `inquiries` ni `admins`, ni escribir `cars`, `brands`, `system` o `adminAccess`; ambos pueden leer catálogo y crear una consulta válida o reseña pendiente; las cuentas principales y un integrante reautorizado pueden operar el panel. Al quitar un integrante, repetir la prueba de acceso y de API de imágenes.

Hasta completar la publicación y estas pruebas, el acceso de producción no está verificado como seguro.
