# Directorio protegido STU

Este Worker entrega el directorio interno únicamente después de validar un PIN.
Los contactos, el PIN y la clave de firma se guardan como secretos de Cloudflare
y no deben incorporarse al repositorio.

## Secretos requeridos

- `ACCESS_PIN`: PIN operativo de al menos 6 dígitos.
- `AUTH_SECRET`: cadena aleatoria larga usada para firmar accesos temporales.
- `CONTACTS_JSON`: objeto JSON con la propiedad `grupos`.

Para revocar inmediatamente todos los accesos guardados, cambia `AUTH_SECRET`.
Para rotar solamente el PIN, cambia `ACCESS_PIN`.
