# 🗺️ Mi Mapa IFS

App para mapear tus partes internas según el modelo IFS (Internal Family Systems).

---

## Instalación paso a paso

### 1. Crea la estructura de carpetas

Dentro de `C:\Proyectos\partsmap\` crea las siguientes carpetas:

```
partsmap\
└── src\
    ├── components\
    └── store\
```

En Windows puedes hacerlo desde la terminal:

```bash
mkdir src\components
mkdir src\store
```

---

### 2. Copia los archivos en su lugar

| Archivo | Va en |
|---|---|
| `index.html` | `partsmap\` |
| `package.json` | `partsmap\` |
| `vite.config.js` | `partsmap\` |
| `src\App.jsx` | `partsmap\src\` |
| `src\App.css` | `partsmap\src\` |
| `src\index.css` | `partsmap\src\` |
| `src\main.jsx` | `partsmap\src\` |
| `src\components\IFSNode.jsx` | `partsmap\src\components\` |
| `src\components\PartPanel.jsx` | `partsmap\src\components\` |
| `src\components\Sidebar.jsx` | `partsmap\src\components\` |
| `src\store\useStore.js` | `partsmap\src\store\` |

---

### 3. Instala las dependencias

Abre la terminal en `C:\Proyectos\partsmap\` y ejecuta:

```bash
npm install
```

Esto descarga todo lo necesario. Puede tardar 1-2 minutos.

---

### 4. Corre la app

```bash
npm run dev
```

Abre tu navegador en **http://localhost:5173** y listo.

---

## Cómo usar la app

| Acción | Cómo hacerlo |
|---|---|
| Agregar una parte | Click en **Agregar** → elige el tipo |
| Editar una parte | Click sobre el nodo en el canvas |
| Mover un nodo | Click y arrastra |
| Conectar dos partes | Arrastra desde el punto inferior de un nodo al punto superior de otro |
| Eliminar una parte | Ábela y click en el ícono de basura 🗑️ |
| Zoom | Scroll del mouse o botones abajo a la izquierda |

---

## Tipos de partes (IFS)

| Tipo | Color | Rol |
|---|---|---|
| **Self** | Ámbar | Centro de conciencia, presencia pura |
| **Manager** | Índigo | Previene el dolor antes de que ocurra |
| **Firefighter** | Rojo | Reacciona al dolor cuando ya está presente |
| **Exile** | Púrpura | Lleva el dolor y el trauma |
| **Protector** | Verde | Protege al exiliado del mundo exterior |

---

## Datos

Todo se guarda automáticamente en tu navegador (localStorage). No necesitas cuenta ni internet después de la primera carga.

---

## Próximo paso: publicar en Vercel

```bash
npm run build
```

Luego sube la carpeta `dist\` a Vercel o usa el CLI:

```bash
npm install -g vercel
vercel
```
