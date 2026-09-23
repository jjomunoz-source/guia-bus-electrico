# Directorio operativo STU

Este Worker entrega el directorio operativo a la guía oficial de STU sin solicitar
un PIN. Los contactos se guardan como un secreto de Cloudflare y no deben
incorporarse al repositorio.

## Secretos requeridos

- `CONTACTS_JSON`: objeto JSON con la propiedad `grupos`.

Las solicitudes se aceptan únicamente desde el origen configurado en
`ALLOWED_ORIGIN`.
