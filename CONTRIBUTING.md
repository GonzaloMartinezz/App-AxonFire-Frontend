# Guía de Contribución — AXON FIRE 🚒

¡Bienvenido al equipo de desarrollo! Esta guía contiene las instrucciones necesarias para configurar tu entorno, usar el flujo de trabajo correcto y contribuir de manera efectiva al proyecto.

## 🚀 Configuración del Entorno

### 1. Clonar el repositorio
Para comenzar, clona el repositorio en tu máquina local:
```bash
git clone https://github.com/GonzaloMartinezz/App-AxonFire-Frontend.git
cd App-AxonFire-Frontend/AxonFire
```

### 2. Instalación de dependencias
Asegúrate de tener [Node.js](https://nodejs.org/) (v18+) instalado. Luego ejecuta:
```bash
npm install
```

### 3. Ejecutar el proyecto
Puedes iniciar la aplicación en diferentes plataformas:
```bash
# Iniciar servidor Metro
npx expo start

# Ejecutar en Web (Recomendado para pruebas rápidas)
npx expo start --web

# Ejecutar en Android (Requiere emulador o dispositivo físico con Expo Go)
npx expo start --android
```

---

## 🌿 Estrategia de Ramas

Este proyecto utiliza una estrategia de flujo de trabajo simplificada basada en `git-flow`:

- **`main`**: Esta es la rama de **producción**. Solo contiene código estable y probado que está listo para ser desplegado. **No trabajes directamente aquí.**
- **`dev`**: Esta es la rama de **integración**. Aquí se combinan todas las nuevas funcionalidades terminadas antes de pasar a `main`.
- **Ramas de Funcionalidades (`feat/`)**: Cada nueva tarea o feature debe tener su propia rama creada a partir de `dev`. Ejemplo: `feat/login-screen`.

---

## 🛠️ Flujo de Trabajo (Workflow)

Sigue estos pasos para realizar cambios:

1.  **Sincroniza tu rama `dev` local:**
    ```bash
    git checkout dev
    git pull origin dev
    ```

2.  **Crea una rama para tu tarea:**
    ```bash
    git checkout -b feat/nombre-de-tu-tarea
    ```

3.  **Realiza tus cambios y haz commits:**
    Usa mensajes descriptivos:
    ```bash
    git add .
    git commit -m "feat: implementada pantalla de login táctica"
    ```

4.  **Sube tu rama al repositorio:**
    ```bash
    git push origin feat/nombre-de-tu-tarea
    ```

5.  **Crea un Pull Request (PR):**
    En GitHub, abre un PR comparando tu rama `feat/...` con la rama `dev`.

6.  **Merge a `main`:**
    Una vez que los cambios en `dev` han sido validados y están listos para una versión estable, se realizará el merge de `dev` a `main`.

---

## 🎨 Estándares de Código

-   **Estilo**: Usamos JavaScript moderno (ES6+).
-   **Componentes**: Mantén los componentes en `src/components` y las pantallas en `src/screens`.
-   **Diseño**: Respeta el Design System ("Tactical Monolith") definido en `src/theme`. No uses colores or bordes fuera de los tokens definidos.

---

¡Gracias por ayudar a construir Axon Fire! 🔥
