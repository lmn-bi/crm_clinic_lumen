# CRM Clínica - Sistema de Gestión y Dashboard de Rendimiento

Este repositorio contiene la aplicación cliente (CRM) para la gestión de clínicas médicas, diseñada con una arquitectura de alto rendimiento, interfaz premium y una integración estrecha con la base de datos Supabase y flujos de automatización para Agentes de Voz (n8n).

---

## 📊 Módulo de Dashboard (Nivel 1)

El Dashboard de Rendimiento proporciona un análisis financiero, control de ocupación, distribución de citas y productividad de los doctores en tiempo real.

### Lógica de Cálculo de Tendencias (KPIs)

Cada una de las tarjetas principales de KPI (como *Citas Totales*, *Ingresos*, *Tasa de Ocupación*, *Tasa de No-Show* y *Ticket Medio*) cuenta con un badge porcentual que denota la **tendencia de aumento o baja**. 

#### ¿Por qué se calcula así?
En lugar de comparar contra periodos fijos externos (que podrían no tener datos históricos coherentes o estar sesgados por temporadas remotas), el sistema realiza un **análisis de tendencia interno y dinámico** dividiendo el rango temporal seleccionado en dos mitades cronológicas exactas. Esto permite conocer si el rendimiento está mejorando o desacelerando dentro del intervalo específico que el usuario ha decidido investigar.

#### Fórmula Matemática
La variación porcentual se calcula utilizando la siguiente fórmula estándar:

$$\text{Variación (\%)} = \frac{V_2 - V_1}{V_1} \times 100$$

Donde:
- $V_1$: Valor calculado para la **primera mitad del período** (mitad anterior/antigua).
- $V_2$: Valor calculado para la **segunda mitad del período** (mitad actual/reciente).

---

### Ejemplo Práctico Paso a Paso

Supongamos que un usuario selecciona el filtro temporal de **"Últimos 6 meses"** y filtra por el **Dr. Pérez**.

#### Paso 1: Obtención y división de citas
Tras aplicar los filtros maestros, el sistema obtiene **10 citas** en total. Estas citas se ordenan de la más antigua a la más reciente y se dividen en dos listas iguales:
- **Primera Mitad ($V_1$ - meses 1, 2 y 3):** Primeras 5 citas.
- **Segunda Mitad ($V_2$ - meses 4, 5 y 6):** Siguientes 5 citas.

#### Paso 2: Cálculo por mitades (Métrica: Ingresos)
- Para la **Primera Mitad ($V_1$)**: La facturación de tratamientos completados suma **2.000 €**.
- Para la **Segunda Mitad ($V_2$)**: La facturación de tratamientos completados suma **3.000 €**.

#### Paso 3: Aplicación de la fórmula
$$\text{Variación} = \frac{3.000 - 2.000}{2.000} \times 100 = \frac{1.000}{2.000} \times 100 = +50,0\%$$

#### Paso 4: Visualización en el Dashboard
La tarjeta de **Ingresos** mostrará:
- El valor total consolidado del período completo (**5.000 €**).
- Un indicador verde destacando **`▲ 50,0%`**.
- El subtítulo descriptivo **`vs. mitad anterior`** que clarifica el marco de comparación.

---

## 🛠️ Tecnologías y Estructura

- **Frontend**: React + Vite (diseño de alta velocidad y recarga rápida en caliente HMR).
- **Estilos**: TailwindCSS para un acabado visual premium y adaptabilidad total (móvil y escritorio).
- **Librería de Gráficos**: Recharts (SVGs interactivos y ligeros).
- **Generación de Reportes**:
  - `xlsx` para descargas exclusivas de datos crudos filtrados a Excel.
  - `jspdf` y `html2canvas` para exportaciones nítidas a PDF (A4 en orientación vertical u horizontal).
