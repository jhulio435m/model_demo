# Optimizador de Rutas Web

Este documento detalla los componentes y requisitos para construir un sistema de optimización de rutas con interfaz web. La información amplía los puntos clave descritos previamente.

## 1. Objetivo del Sistema

El sistema permite ingresar múltiples direcciones o coordenadas y calcular la ruta óptima que las recorra. El objetivo es minimizar la distancia o el tiempo de viaje y presentar los resultados en un mapa interactivo. Se busca que el usuario también pueda exportar las rutas calculadas a formatos como CSV o PDF.

## 2. Componentes

### 2.1 Frontend

- **Tecnologías**: HTML5, CSS3, JavaScript y un framework como React, Vue.js o Svelte.
- **Librerías de mapas**: Leaflet.js, Mapbox GL JS o Google Maps JS API.
- **Funciones clave**:
  - Formulario para ingresar direcciones o coordenadas.
  - Botón para iniciar el cálculo de la ruta.
  - Mapa interactivo con marcadores.
  - Tabla o lista con el orden de visita y distancia total.
  - Exportar los resultados a CSV o PDF.

### 2.2 Backend

- **Tecnologías**: Python con FastAPI o Flask (o Node.js con Express).
- **Funciones clave**:
  - Recibir la lista de puntos.
  - Calcular la matriz de distancias.
  - Resolver la ruta óptima (TSP, Dijkstra u otro algoritmo).
  - Enviar la ruta al frontend.

## 3. Librerías y Dependencias

- **Backend**: `fastapi`/`flask`, `networkx`, `osmnx`, `numpy`, `pandas`, `geopy`, `ortools`, `uvicorn`.
- **Frontend**: `React`/`Vue.js`, `leaflet.js`/`mapbox-gl-js`, `axios`, `html2pdf.js`, `papaparse`.

## 4. Base de Datos (Opcional)

- PostgreSQL con PostGIS para proyectos completos o SQLite para entornos de prueba.

## 5. Estructura de Archivos

```
cliente/
  public/
  src/
servidor/
  main.py
  rutas/
  utils/
base_datos/
data/
```

## 6. Funcionalidades

| Módulo          | Descripción                                      |
| --------------- | ------------------------------------------------- |
| Carga de puntos | Ingreso manual o por archivo (CSV, Excel).        |
| Cálculo de rutas| Optimización usando TSP, Dijkstra, VRP, etc.      |
| Mapa interactivo| Mostrar puntos y rutas optimizadas.               |
| Exportación     | Resultados en PDF o CSV.                          |
| API REST        | Comunicación entre frontend y backend.            |
| Seguridad       | (Opcional) Validación de entradas, JWT, etc.      |

## 7. Uso de APIs Externas (Opcional)

- OpenStreetMap para mapas libres.
- Google Maps API para geocodificación y rutas (requiere clave).
- Mapbox para mapas estilizados.

