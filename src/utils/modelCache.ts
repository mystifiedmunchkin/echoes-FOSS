/** Legacy Expo FileSystem model-cache helper, retained outside the active radar cache path. */
import { Paths, File, Directory } from 'expo-file-system';
import { translate } from '../../constants/i18n';

export async function getLocalModelUri(remoteUrl: string): Promise<string> {
  const modelUrl = remoteUrl.trim();
  if (!modelUrl) return '';
  if (modelUrl.startsWith('file://')) return modelUrl;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(modelUrl);
  } catch (error) {
    console.error(translate('modelUrlInvalid', { url: modelUrl }), error);
    return '';
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    console.error(translate('modelInvalidProtocol', { url: modelUrl }));
    return '';
  }

  try {
    const cacheDir = Paths.cache;

    const modelsDir = new Directory(cacheDir, 'models');
    if (!modelsDir.exists) {
      await modelsDir.create();
    }

    const fileName = parsedUrl.pathname.split('/').pop() || `model_${Date.now()}.glb`;
    const targetFile = new File(modelsDir, fileName);

    if (targetFile.exists) {
      return targetFile.uri;
    }

    const downloadedFile = await File.downloadFileAsync(parsedUrl.href, targetFile);
    return downloadedFile.uri;
  } catch (error) {
    console.error(translate('modelDownloadError', { url: modelUrl }), error);
    return modelUrl;
  }
}