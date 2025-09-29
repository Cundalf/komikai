/**
 * Servicio de manejo de archivos
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  size?: number;
  type?: string;
}

export class FileService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  validateUploadedFile(file: File): FileValidationResult {
    // Validar tamaño
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande. Máximo 10MB.'
      };
    }

    // Validar tipo
    if (!this.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP).'
      };
    }

    return {
      isValid: true,
      size: file.size,
      type: file.type
    };
  }

  async convertToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return await file.arrayBuffer();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

export const fileService = new FileService();