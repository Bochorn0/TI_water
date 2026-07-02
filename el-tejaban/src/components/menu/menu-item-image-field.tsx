import { useRef } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'react-toastify';
import { MenuItemImage } from './menu-item-image';
import { readImageFileAsDataUrl } from '@tejaban/utils/image-upload';

type Props = {
  value: string;
  onChange: (url: string) => void;
  productName?: string;
};

export function MenuItemImageField({ value, onChange, productName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar imagen');
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Imagen del producto
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        Una imagen por producto · JPG, PNG o WebP · máx. 2 MB
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <MenuItemImage
          src={value || undefined}
          alt={productName || 'Vista previa'}
          width={140}
          height={105}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={() => inputRef.current?.click()}
            sx={{ minHeight: 44 }}
          >
            {value ? 'Cambiar imagen' : 'Subir imagen'}
          </Button>
          {value && (
            <IconButton color="error" onClick={() => onChange('')} aria-label="Quitar imagen" size="small">
              <DeleteOutlineIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* MOCK-BACKEND: replace data URL with multipart POST → Azure Blob / CDN URL */}
    </Box>
  );
}
