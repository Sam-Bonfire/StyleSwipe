import * as FileSystem from 'expo-file-system/legacy';

// quantized model (int8) for mobile.
// Configurable via Env, defaults to HuggingFace Generic
const DEFAULT_MODEL_URL =
  'https://huggingface.co/Xenova/bge-small-en-v1.5/resolve/main/onnx/model_quantized.onnx';
const DEFAULT_TOKENIZER_URL =
  'https://huggingface.co/Xenova/bge-small-en-v1.5/resolve/main/tokenizer.json';
const DEFAULT_TOKENIZER_CONFIG_URL =
  'https://huggingface.co/Xenova/bge-small-en-v1.5/resolve/main/tokenizer_config.json';

const MODEL_URL = process.env.EXPO_PUBLIC_SLM_MODEL_URL || DEFAULT_MODEL_URL;
const TOKENIZER_URL = process.env.EXPO_PUBLIC_SLM_TOKENIZER_URL || DEFAULT_TOKENIZER_URL;
const TOKENIZER_CONFIG_URL =
  process.env.EXPO_PUBLIC_SLM_TOKENIZER_CONFIG_URL || DEFAULT_TOKENIZER_CONFIG_URL;

const MODEL_FILENAME = 'model_quantized.onnx';
const TOKENIZER_FILENAME = 'tokenizer.json';
const TOKENIZER_CONFIG_FILENAME = 'tokenizer_config.json';

// Storage Strategy:
// FileSystem.documentDirectory is null on Web. We must handle this gracefully.
// On Web, this Manager should basically be a no-op or throw if used (since Web uses InferenceEngine.web.ts)
const BASE_DIR = FileSystem.documentDirectory;

function getPaths() {
  if (!BASE_DIR) return null; // Web or Error
  const MODEL_DIR = BASE_DIR + 'models/';
  return {
    MODEL_DIR,
    MODEL_URI: MODEL_DIR + MODEL_FILENAME,
    TOKENIZER_URI: MODEL_DIR + TOKENIZER_FILENAME,
    TOKENIZER_CONFIG_URI: MODEL_DIR + TOKENIZER_CONFIG_FILENAME,
  };
}

export class ModelManager {
  static async ensureModelDirectory() {
    const paths = getPaths();
    if (!paths) return; // No-op on web

    const dirInfo = await FileSystem.getInfoAsync(paths.MODEL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(paths.MODEL_DIR, { intermediates: true });
    }
  }

  static async isModelAvailable(): Promise<boolean> {
    const paths = getPaths();
    if (!paths) return false;

    const modelInfo = await FileSystem.getInfoAsync(paths.MODEL_URI);
    const tokenizerInfo = await FileSystem.getInfoAsync(paths.TOKENIZER_URI);
    return modelInfo.exists && tokenizerInfo.exists;
  }

  static async downloadFile(
    url: string,
    dest: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    const callback = (downloadProgress: {
      totalBytesWritten: number;
      totalBytesExpectedToWrite: number;
    }) => {
      const progress =
        downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if (onProgress) onProgress(progress);
    };

    const downloadResumable = FileSystem.createDownloadResumable(url, dest, {}, callback);

    try {
      const result = await downloadResumable.downloadAsync();
      if (result && result.uri) {
        console.log(`[ModelManager] Downloaded ${url} to ${result.uri}`);
        return result.uri;
      } else {
        throw new Error('Download failed');
      }
    } catch (e) {
      console.error('[ModelManager] Download error:', e);
      throw e;
    }
  }

  static async downloadModel(onProgress?: (progress: number) => void): Promise<string> {
    const paths = getPaths();
    if (!paths) {
      console.warn('[ModelManager] Skipping download (Web or No Storage)');
      return '';
    }

    await this.ensureModelDirectory();

    if (await this.isModelAvailable()) {
      return paths.MODEL_URI;
    }

    console.log(`[ModelManager] Starting downloads...`);

    // 1. Download Model (Largest)
    const modelUri = await this.downloadFile(MODEL_URL, paths.MODEL_URI, onProgress);

    // 2. Download Tokenizer files (Small)
    await this.downloadFile(TOKENIZER_URL, paths.TOKENIZER_URI);
    await this.downloadFile(TOKENIZER_CONFIG_URL, paths.TOKENIZER_CONFIG_URI);

    return modelUri;
  }

  static getModelPath(): string {
    const paths = getPaths();
    if (!paths) throw new Error('Storage unavailable (Web?)');
    return paths.MODEL_URI;
  }

  static getTokenizerPath(): string {
    const paths = getPaths();
    if (!paths) throw new Error('Storage unavailable (Web?)');
    return paths.TOKENIZER_URI;
  }

  static getTokenizerConfigPath(): string {
    const paths = getPaths();
    if (!paths) throw new Error('Storage unavailable (Web?)');
    return paths.TOKENIZER_CONFIG_URI;
  }
}
