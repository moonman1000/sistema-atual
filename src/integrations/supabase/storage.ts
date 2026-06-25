import { supabase } from './client';
import { v4 as uuidv4 } from 'uuid';

export const uploadImageToSupabase = async (file: File, bucketName: string, folderPath: string = ''): Promise<string | null> => {
  console.log(`[uploadImageToSupabase] Attempting to upload file: ${file.name} to bucket: ${bucketName}, folder: ${folderPath}`);
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = folderPath ? `${folderPath}/${fileName}` : `${fileName}`;
  console.log(`[uploadImageToSupabase] Generated filePath: ${filePath}`);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[uploadImageToSupabase] Erro ao fazer upload da imagem:', error);
    throw new Error(`Falha no upload da imagem: ${error.message}`);
  }
  console.log('[uploadImageToSupabase] Upload successful, data:', data);

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  console.log('[uploadImageToSupabase] Public URL data:', publicUrlData);
  return publicUrlData.publicUrl;
};

export const deleteImageFromSupabase = async (imageUrl: string, bucketName: string): Promise<void> => {
  if (!imageUrl) return;

  try {
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    
    // Find the index of the bucket name in the path
    const bucketIndex = pathSegments.indexOf(bucketName);
    
    if (bucketIndex === -1 || bucketIndex === pathSegments.length - 1) {
      console.warn('Não foi possível extrair o caminho do arquivo da URL para exclusão:', imageUrl);
      return;
    }

    // The file path in storage starts after the bucket name
    const filePath = pathSegments.slice(bucketIndex + 1).join('/');

    if (!filePath) {
      console.warn('Não foi possível extrair o caminho do arquivo da URL para exclusão:', imageUrl);
      return;
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Erro ao excluir imagem do Supabase Storage:', error);
      throw new Error(`Falha ao excluir imagem: ${error.message}`);
    }
    console.log('Imagem excluída com sucesso:', imageUrl);
  } catch (e) {
    console.error('Erro ao processar URL da imagem para exclusão:', e);
    throw new Error('Erro ao processar URL da imagem para exclusão.');
  }
};