# Operativo Pancita — lo que falta para que sea útil

**Estado:** contrato de producto pendiente  
**Fecha de corte:** 22 de julio de 2026  
**Usuarios principales:** Gastón, Paula y Rodrigo  
**Prioridad:** hacer útil la búsqueda real antes de agregar sofisticación

Este documento es la fuente de verdad para el próximo trabajo. Si contradice una
descripción optimista del README, prevalece este documento hasta que el flujo se
haya probado en producción.

## 1. Diagnóstico actual

La versión que hoy ve el usuario no es todavía una herramienta operativa:

- La página pública de Pancita funciona como cartel digital y formulario de aviso.
- El acceso privado existe, pero abre sobre un mapa vacío sin explicar qué hacer.
- La producción conserva el M1 anterior; el trabajo de carteles, tareas, zonas y
  administradores equivalentes permanece en una rama sin desplegar.
- Un usuario nuevo no distingue qué está vacío, qué está roto y qué debe cargar.
- Acciones críticas usan coordenadas o vocabulario interno y no lenguaje cotidiano.
- Frontend, reglas de Firestore y Functions todavía no fueron publicados y probados
  juntos como una sola versión.

La app no puede llamarse “operativa” mientras esta sea la experiencia disponible.

## 2. Resultado obligatorio

Al entrar desde el teléfono, cualquiera de los tres administradores debe poder,
sin instrucciones externas:

1. Entender en menos de diez segundos el estado actual de la búsqueda.
2. Ver el último avistaje confirmado, su antigüedad y la zona activa.
3. Revisar avisos pendientes y convertir uno en avistaje usando un punto del mapa.
4. Registrar dónde hay carteles y si alguien del lugar quedó avisado.
5. Tomar o crear una tarea y evitar que dos personas cubran lo mismo.
6. Informar al resto qué hizo y qué encontró, incluso si no vio a Pancita.

Ésta es la definición de utilidad. OCR, rutas automáticas y otras mejoras son
secundarias hasta que este circuito funcione de punta a punta.

## 3. P0 — imprescindible antes del próximo enlace de revisión

### 3.1 Publicar una versión coherente

Frontend y backend se liberan juntos.

- Habilitar Google Auth y los dominios autorizados en Firebase.
- Configurar en Functions, sin subirlos al repositorio, estos administradores:
  Paula, Rodrigo y Gastón.
- Los tres reciben el mismo rol administrador. El orden de ingreso no otorga poder.
- Desplegar Firestore Rules, Storage Rules y Cloud Functions de la misma revisión.
- Vercel debe compilar la rama y servir `/`, `/c/pancita`, `/bandeja` y `/plan`
  directamente, sin 404 al recargar.
- La URL de revisión debe abrir sin depender de una sesión privada del desarrollador.
- Ejecutar una prueba real en producción con una cuenta administradora y otra anónima.

**Aceptación:** una versión visible tiene exactamente las capacidades que declara su
README; no se describe como disponible nada que viva sólo en otra rama.

### 3.2 Inicio útil, nunca un lienzo vacío

`Mapa` es también el resumen operativo. Antes del mapa debe mostrar:

- **Último confirmado:** lugar, hora, hace cuánto y dirección.
- **Zona activa:** centro, radio y avistaje que la justifica.
- **Pendientes:** cantidad de reportes sin revisar.
- **Trabajo de hoy:** tareas abiertas, tomadas y terminadas.
- **Carteles activos:** total y cantidad de prioridad A/B.

Acciones grandes y visibles:

1. **Registrar avistaje**
2. **Pegar publicación**
3. **Registrar cartel**
4. **Planificar recorrido**

Si todavía no hay datos, reemplazar el vacío por una preparación guiada:

1. Cargar el último avistaje conocido.
2. Confirmar la zona de búsqueda.
3. Registrar el primer cartel.
4. Crear la primera tarea.
5. Compartir el enlace público.

Cada paso explica para qué sirve y queda marcado al completarse. El mapa debe
renderizar igualmente, centrado en Olivos, y mostrar un error comprensible si el
proveedor de mosaicos falla.

**Aceptación:** Gastón entra a una base vacía y sabe cuál es el siguiente paso sin
abrir el botón `+` ni leer documentación.

### 3.3 Ubicar sin coordenadas

Ningún flujo principal pide latitud o longitud.

Crear un único `LocationPicker` reutilizable con:

- usar mi ubicación;
- buscar dirección o esquina;
- tocar o mover un pin en el mapa;
- confirmar con una descripción legible;
- coordenadas disponibles sólo en “Detalles técnicos”.

Debe usarse para avistajes, carteles, zona y punto inicial de un recorrido.

**Aceptación:** Paula puede registrar “Maipú y San Ramón” sin conocer coordenadas.

### 3.4 Circuito aviso → avistaje → zona

1. Un aviso público o contenido pegado aparece inmediatamente en **Bandeja**.
2. La tarjeta distingue **sin revisar**, **necesita datos**, **probable** y
   **descartado** con texto, no sólo color.
3. **Revisar aviso** reemplaza el término interno “Promover”.
4. El coordinador confirma hora observada, ubicación, dirección y evidencia.
5. Sólo un avistaje explícitamente confirmado puede proponer mover la zona.
6. Mover la zona requiere una segunda confirmación y conserva la zona anterior.
7. El original nunca se pierde al rechazarlo o convertirlo.

**Aceptación:** un reporte falso no altera el mapa oficial; uno confirmado aparece
en los tres teléfonos con hora observada e informada por separado.

### 3.5 Carteles que organizan trabajo real

Registrar un cartel requiere:

- lugar sobre el mapa;
- prioridad A/B/C/D explicada con palabras;
- tipo de lugar;
- planificado, colocado, dañado, faltante o retirado;
- **¿Alguien del lugar quedó personalmente avisado?**;
- nota o foto opcional.

El mapa y Plan muestran qué zonas tienen buena cobertura y qué carteles necesitan
revisión. Las estaciones de servicio, policía, seguridad y comercios 24 h quedan
visualmente priorizados, sin afirmar que un lugar coopera si nadie habló con él.

### 3.6 Trabajo de campo compartido

Una tarea tiene acción concreta, límites, prioridad, responsable y estado.

- **La hago** la reserva para una persona.
- **Terminada** exige un resultado breve: recorrido, carteles, entrevistas,
  cámaras revisadas y observaciones.
- “No vimos nada” se registra como esfuerzo realizado, no como ausencia demostrada.
- El resumen diario permite un briefing antes de salir y un debrief al volver.
- No mostrar “Empezar recorrido” hasta que exista un recorrido real; mientras tanto
  usar **Planificar recorrido**.

**Aceptación:** Rodrigo toma un recorrido y Paula ve inmediatamente que ya tiene
responsable.

### 3.7 Página pública de emergencia

Debe seguir siendo mucho más simple que el panel privado:

- foto principal grande y fotos secundarias;
- nombre Pancita, manteniendo Panza y Pancite como alias encontrables;
- descripción visual corta;
- **LA ESTOY VIENDO** como acción dominante;
- **CREO QUE LA VI** como alternativa;
- ubicación de una sola vez, hora actual, dirección, teléfono/anónimo;
- foto y nota opcionales;
- llamada y WhatsApp visibles;
- instrucción: no perseguir, no rodear, observar dirección y fotografiar seguro.

**Aceptación:** una persona puede avisar en menos de 30 segundos y el equipo recibe
un pendiente prioritario sin exponer su teléfono públicamente.

## 4. Claridad y accesibilidad obligatorias

- Español cotidiano: “aviso”, “revisar”, “ubicación”; evitar “lead”, “promover” y
  jerga GIS.
- Objetivos táctiles de al menos 44 × 44 px.
- Estados comunicados con texto, forma y color.
- Foco visible, Escape para cerrar paneles, foco contenido y restaurado en diálogos.
- Mensajes de guardado/error anunciados con regiones `status` o `alert`.
- Todo formulario tiene etiqueta, ayuda y error asociado.
- El mapa posee una lista equivalente de avistajes, carteles y tareas cercanas.
- Funciona con zoom de navegador al 200 %, teclado y lector de pantalla.
- Sin desplazamiento horizontal a 360 px de ancho.
- Estados de carga, vacío, sin conexión, permiso denegado y error son recuperables.
- Las funciones importantes no dependen de descubrir el botón flotante `+`.

## 5. Método operativo y seguridad

La app organiza información; no inventa una predicción científica.

- Un único coordinador mantiene la verdad operativa durante cada salida.
- Registrar por separado hora observada y hora informada.
- Conservar evidencia y nivel de confianza.
- No perseguir ni rodear a una perra asustada.
- Evitar respuestas duplicadas: una persona coordina y asigna.
- Comida, cámaras o trampas requieren responsable y monitoreo.
- Las rutas evitan sólo áreas privadas dibujadas por el equipo con motivos objetivos;
  nunca etiquetan públicamente barrios o personas como “peligrosos”.
- Los datos de reportantes, ubicaciones del equipo y áreas evitadas son privados.

Referencias de criterio:

- [Missing Animal Response Network — lost dog behavior](https://www.missinganimalresponse.com/lost-dog-behavior/)
- [Humane World for Animals — finding a lost dog](https://www.humaneworld.org/en/resources/how-find-lost-dog)
- [FEMA — Incident Action Planning](https://emilms.fema.gov/is_822/groups/310.html)

## 6. P1 — después de probar P0 en la calle

### Cobertura por manzana

- Celdas H3 con nombres humanos, no números de resolución.
- Asignar, tomar, cubrir y marcar para revisión.
- Diferenciar caminar, manejar, entrevistar, colocar carteles y revisar cámaras.
- La cobertura envejece visualmente pero no desaparece.

### Salidas y ubicación temporal

- Plan de personas, duración, punto inicial y objetivos.
- Inicio/fin explícitos.
- GPS en primer plano con intervalo moderado y expiración automática.
- Botón de actualización única cuando no se comparte recorrido.
- Acciones de campo en cola cuando se pierde conexión.

### Ingreso rápido de publicaciones

- Web Share Target para compartir texto, URL o imagen hacia la PWA.
- OCR local y perezoso para capturas.
- Sugerencias de fecha, hora, teléfono y esquina que una persona debe confirmar.
- Alertas de duplicado por URL, texto o imagen; nunca borrado automático.
- Notificación opt-in para “la están viendo ahora”.

## 7. P2 — optimización, no prerrequisito

- Rutas sugeridas mediante adaptador de openrouteservice.
- Polígonos privados a evitar y ruta manual de respaldo.
- Orden manual de paradas y advertencia “revisar antes de salir”.
- Historial de zonas y línea temporal de avistajes.
- Exportación, cierre “Encontrada” y retención de datos.
- Asistente de instalación para que otros casos reutilicen el repositorio.

## 8. Límite de Facebook

El flujo soporta pegar o compartir publicaciones, enlaces y capturas. Puede ayudar a
organizar contenido público que una persona encontró. No debe automatizar el login,
recorrer feeds privados ni hacer scraping autónomo. Si se añade asistencia de
navegador, cada publicación conservada requiere una acción explícita del usuario.

## 9. Pruebas de aceptación P0

Antes de declarar la versión lista deben grabarse o documentarse estas pruebas:

1. **Primera entrada:** administrador nuevo ve preparación guiada, no un vacío.
2. **Aviso urgente:** anónimo reporta con GPS; aparece en Bandeja en tiempo real.
3. **Publicación pegada:** texto + URL + captura se guardan como un único aviso.
4. **Verificación:** se elige punto en mapa, se confirma y aparece en los tres mapas.
5. **Zona:** sólo el confirmado propone el nuevo radio y requiere aceptación.
6. **Cartel:** se registra con GPS, tier y aviso al personal; aparece en mapa.
7. **Tarea:** una persona la toma, otra ve el responsable y luego el resultado.
8. **Permisos:** anónimo no lee datos privados; cuenta ajena no entra.
9. **Recuperación:** ubicación denegada, subida fallida y modo offline no pierden datos.
10. **Accesibilidad:** recorrido crítico por teclado y lector de pantalla.
11. **Rutas web:** recargar cada URL principal devuelve la aplicación, no 404.
12. **Móvil real:** Chrome Android, ancho 360 px, sin controles ocultos ni desbordes.

## 10. Puertas de release

No publicar ni llamar “lista” a una revisión hasta cumplir todo:

- TypeScript, lint, unit tests, build web y build Functions en verde.
- Pruebas negativas de Firestore y Storage Rules en emuladores.
- Pruebas end-to-end de los circuitos público y administrador.
- Preview público y verificable antes de tocar producción.
- Firebase y Vercel apuntan al mismo commit/configuración.
- Ningún secreto, teléfono privado o identidad de reportante en GitHub.
- Capturas de las pantallas móvil: inicio vacío, inicio activo, Bandeja, revisión,
  mapa, Plan, cartel y reporte público.
- Plan de reversión al despliegue anterior.

## 11. Instrucción para Cursor u otro agente

> Leé primero `docs/LO_QUE_FALTA.md` y después
> `OPERATIVO_PANCITE_BUILD_BRIEF.md`. Inspeccioná el estado real del repositorio y
> producción. Implementá solamente P0 en cortes verticales utilizables. No hagas un
> rediseño general ni declares una función terminada porque compile: cada corte debe
> pasar su escenario de aceptación en móvil, reglas y backend incluidos. Preservá
> cambios ajenos, trabajá en una rama y detenete ante conflictos con trabajo activo.

## 12. Condición final

El próximo enlace entregado a la familia debe abrir una versión donde se pueda hacer
trabajo real de búsqueda. Si sólo demuestra componentes, carga un mapa vacío o exige
explicar dónde están las funciones, todavía no es el producto.
