# Configuración de Videos en el VPS

Los archivos de video son demasiado pesados para subirlos a Git, por lo que deben subirse manualmente al VPS.

## Pasos para configurar los videos

### 1. Crear el directorio en el VPS

```bash
sudo mkdir -p /videos
sudo chown -R 1001:1001 /videos
sudo chmod -R 755 /videos
```

### 2. Subir los archivos de video

Sube los siguientes archivos al directorio `/videos` en el VPS:

- `confeti.mp4`
- `foco-de-luz.mp4`
- `Premiacion.mp4`
- `Battlecry.mp3` (opcional, si no está en Git)
- `Medal-of-Honor.mp3` (opcional, si no está en Git)

Puedes usar SCP, SFTP o cualquier método de transferencia de archivos:

```bash
# Ejemplo con SCP
scp frontend/public/confeti.mp4 usuario@vps:/videos/
scp frontend/public/foco-de-luz.mp4 usuario@vps:/videos/
scp frontend/public/Premiacion.mp4 usuario@vps:/videos/
```

### 3. Configurar la ruta en el VPS

**IMPORTANTE**: En el VPS, debes crear un archivo `.env` en la raíz del proyecto con la ruta de los videos:

```env
VIDEOS_PATH=/videos
```

Si no configuras `VIDEOS_PATH`, el sistema intentará usar `./frontend/public` (ruta relativa), lo cual funcionará localmente pero no en el VPS.

**Nota**: Localmente no necesitas configurar nada, ya que por defecto usará `./frontend/public` donde están tus videos de desarrollo.

### 4. Reiniciar el contenedor

Después de subir los videos, reinicia el contenedor del frontend:

```bash
docker-compose restart frontend
```

O si es la primera vez:

```bash
docker-compose up -d frontend
```

## Verificación

Para verificar que los videos están disponibles, puedes:

1. Verificar que los archivos existen en el VPS:
   ```bash
   ls -lh /videos/
   ```

2. Verificar que el volumen está montado correctamente:
   ```bash
   docker exec condor_frontend ls -lh /app/dist/public/
   ```

3. Acceder a los videos desde el navegador:
   - `http://tu-vps:3000/confeti.mp4`
   - `http://tu-vps:3000/foco-de-luz.mp4`
   - `http://tu-vps:3000/Premiacion.mp4`

## Notas

- Los videos se montan desde el VPS al directorio `/app/dist/public` del contenedor
- Si los videos no están en el VPS, el contenedor usará los que se copiaron durante el build (si existen)
- El usuario `nodejs` (UID 1001) debe tener permisos de lectura en el directorio de videos

