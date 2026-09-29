# Servicios operativos STU

Este Worker entrega el directorio telefónico y los desvíos activos a la guía
oficial de STU. El directorio y la consulta de desvíos son públicos dentro de la
aplicación. La publicación y el cierre de desvíos requieren un PIN administrativo.

## Secretos requeridos

- `CONTACTS_JSON`: objeto JSON con la propiedad `grupos`.
- `DESVIOS_ADMIN_PIN`: PIN exclusivo para Despacho y Operaciones.

## Almacenamiento requerido

- KV con binding `DESVIOS_KV`, utilizado para sincronizar los desvíos entre todos
  los dispositivos.

El PIN debe configurarse mediante `wrangler secret put DESVIOS_ADMIN_PIN`; nunca
debe escribirse en el repositorio ni en el frontend.

Las solicitudes se aceptan únicamente desde el origen configurado en
`ALLOWED_ORIGIN`.
