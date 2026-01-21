# Configuración de EmailJS para el Formulario de Contacto

## Pasos para configurar EmailJS:

### 1. Crear una cuenta en EmailJS
- Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
- Regístrate gratis (incluye 200 emails/mes)

### 2. Crear un servicio de email
1. Ve a **Email Services**
2. Click en **Add New Service**
3. Selecciona tu proveedor (Gmail, Outlook, etc.)
4. Sigue las instrucciones de conexión
5. Copia el **Service ID**

### 3. Crear una plantilla de email
1. Ve a **Email Templates**
2. Click en **Create New Template**
3. Usa estas variables en tu plantilla:
   - `{{from_name}}` - Nombre del remitente
   - `{{from_email}}` - Email del remitente
   - `{{message}}` - Mensaje
   - `{{to_name}}` - Tu nombre (destinatario)

**Ejemplo de plantilla:**
```
Asunto: Nuevo mensaje de {{from_name}}

Hola {{to_name}},

Has recibido un nuevo mensaje desde tu portafolio:

Nombre: {{from_name}}
Email: {{from_email}}

Mensaje:
{{message}}

---
Mensaje enviado desde tu portafolio web
```

4. Guarda y copia el **Template ID**

### 4. Obtener la Public Key
1. Ve a **Account** (esquina superior derecha)
2. En la sección **API Keys**
3. Copia tu **Public Key**

### 5. Configurar en tu proyecto

**Opción recomendada: Variables de entorno**

1. En la raíz del proyecto, crea un archivo `.env` (si no existe)
2. Agrega tus credenciales:

```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=user_123456789
```

3. **Importante:** Asegúrate de que `.env` esté en tu `.gitignore` para no subir tus credenciales a Git

4. Reinicia el servidor de desarrollo para que las variables se carguen:
```bash
npm run dev
```

**Nota:** Las variables deben comenzar con `VITE_` para ser accesibles en Vite.

## Ejemplo de archivo .env:
```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=user_123456789
```

## Seguridad
- Las credenciales están en el código frontend (esto es normal con EmailJS)
- EmailJS protege tu email real
- Puedes configurar límites de envío en el dashboard

## Testing
1. Completa el formulario en tu aplicación
2. Verifica que aparezca "Enviando..."
3. Debe aparecer "✓ Enviado" al completarse
4. Revisa tu email configurado en EmailJS
5. Verifica el panel de EmailJS para ver el historial de envíos

## Límites gratuitos
- 200 emails/mes
- Necesitas registrarte para más

¡Listo! Tu formulario de contacto ahora enviará emails reales.
