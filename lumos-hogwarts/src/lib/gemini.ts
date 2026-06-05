// ─── Gemini Models & Pricing ───
export const DEFAULT_MODEL_KEY = 'flash';

export const MODELS = {
  'flash-lite': {
    id: 'gemini-flash-lite-latest',
    label: 'Gemini Flash-Lite Latest',
    inputPerMToken: NaN,
    outputPerMToken: NaN,
    pricingKnown: false,
  },
  flash: {
    id: 'gemini-flash-latest',
    label: 'Gemini Flash Latest',
    inputPerMToken: NaN,
    outputPerMToken: NaN,
    pricingKnown: false,
  },
  pro: {
    id: 'gemini-pro-latest',
    label: 'Gemini Pro Latest',
    inputPerMToken: NaN,
    outputPerMToken: NaN,
    pricingKnown: false,
  },
} as const;

export type ModelKey = keyof typeof MODELS;
export type ModelInfo = {
  key?: string;
  id: string;
  label: string;
  inputPerMToken: number;
  outputPerMToken: number;
  pricingKnown?: boolean;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
};

type ApiGeminiModel = {
  name?: string;
  baseModelId?: string;
  displayName?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
};

type ApiModelListResponse = {
  models?: ApiGeminiModel[];
  nextPageToken?: string;
};

const KNOWN_MODEL_PRICING = Object.fromEntries(
  Object.values(MODELS)
    .filter(hasModelPricing)
    .map(model => [
      model.id,
      {
        inputPerMToken: model.inputPerMToken,
        outputPerMToken: model.outputPerMToken,
      },
    ])
);

const MODEL_ORDER = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview',
];

export function normalizeModelId(name: string) {
  return String(name || '').replace(/^models\//, '');
}

export function defaultModelOptions(): ModelInfo[] {
  return sortModelOptions(Object.entries(MODELS).map(([key, model]) => ({ key, ...model })));
}

function labelFromModelId(id: string) {
  return normalizeModelId(id)
    .split('-')
    .map(part => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')
    .replace(/^Gemini /i, 'Gemini ');
}

function getKnownPricing(id: string) {
  return KNOWN_MODEL_PRICING[normalizeModelId(id)] || null;
}

export function hasModelPricing(model: ModelInfo) {
  return model.pricingKnown !== false &&
    Number.isFinite(model.inputPerMToken) &&
    Number.isFinite(model.outputPerMToken);
}

function isUsableGeminiTextModel(model: ApiGeminiModel) {
  const id = normalizeModelId(model.name || model.baseModelId || '');
  const label = model.displayName || '';
  const haystack = `${id} ${label}`.toLowerCase();
  const methods = model.supportedGenerationMethods || [];

  if (!id.startsWith('gemini-')) return false;
  if (!methods.includes('generateContent')) return false;
  return !/(embedding|imagen|veo|lyria|tts|live|image|nano|aqa|robotics|computer-use)/.test(haystack);
}

function sortModelOptions(options: ModelInfo[]) {
  return [...options].sort((a, b) => {
    const ai = MODEL_ORDER.indexOf(a.id);
    const bi = MODEL_ORDER.indexOf(b.id);
    const ar = ai === -1 ? 999 : ai;
    const br = bi === -1 ? 999 : bi;
    if (ar !== br) return ar - br;
    return a.label.localeCompare(b.label);
  });
}

function mergeFetchedModels(apiModels: ApiGeminiModel[], seedModels: ModelInfo[]) {
  const byId = new Map(seedModels.map(model => [model.id, model]));

  for (const apiModel of apiModels) {
    if (!isUsableGeminiTextModel(apiModel)) continue;

    const id = normalizeModelId(apiModel.name || apiModel.baseModelId || '');
    const existing = byId.get(id);
    const pricing = getKnownPricing(id);

    byId.set(id, {
      key: existing?.key || id,
      id,
      label: apiModel.displayName || existing?.label || labelFromModelId(id),
      inputPerMToken: pricing?.inputPerMToken ?? existing?.inputPerMToken ?? NaN,
      outputPerMToken: pricing?.outputPerMToken ?? existing?.outputPerMToken ?? NaN,
      pricingKnown: Boolean(pricing || existing?.pricingKnown),
      inputTokenLimit: apiModel.inputTokenLimit,
      outputTokenLimit: apiModel.outputTokenLimit,
    });
  }

  return sortModelOptions([...byId.values()]);
}

export async function fetchGeminiModelOptions(apiKey: string, seedModels = defaultModelOptions()) {
  const models: ApiGeminiModel[] = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({ key: apiKey, pageSize: '1000' });
    if (pageToken) params.set('pageToken', pageToken);

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?${params}`);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`ListModels ${resp.status}: ${text}`);
    }

    const json = await resp.json() as ApiModelListResponse;
    models.push(...(json.models || []));
    pageToken = json.nextPageToken || '';
  } while (pageToken);

  return mergeFetchedModels(models, seedModels);
}

export function getModel(key: string, options = defaultModelOptions()): ModelInfo {
  const curated = MODELS[key as ModelKey] as ModelInfo | undefined;
  if (curated) return curated;

  const id = normalizeModelId(key);
  return options.find(model => model.id === id) || {
    key: id,
    id,
    label: labelFromModelId(id),
    inputPerMToken: NaN,
    outputPerMToken: NaN,
    pricingKnown: false,
  };
}

// ─── Cost Estimation ───
const TOKENS_PER_IMAGE = 258;
const AVG_PROMPT_TOKENS = 500;
const AVG_OUTPUT_TOKENS = 4000;

export function estimateCost(model: ModelInfo, numImages: number) {
  if (!hasModelPricing(model)) {
    return { inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0, total: 0 };
  }

  const inputTokens = numImages * TOKENS_PER_IMAGE + AVG_PROMPT_TOKENS;
  const outputTokens = AVG_OUTPUT_TOKENS;
  const inputCost = (inputTokens / 1_000_000) * model.inputPerMToken;
  const outputCost = (outputTokens / 1_000_000) * model.outputPerMToken;
  return { inputTokens, outputTokens, inputCost, outputCost, total: inputCost + outputCost };
}

export function estimateFullPdfCost(
  model: ModelInfo,
  numPages: number,
  hasCachedSummary: boolean,
  cachedSlides: number,
) {
  const items: { label: string; cost: number; cached: boolean }[] = [];
  let total = 0;

  if (!hasCachedSummary) {
    const sc = estimateCost(model, numPages);
    items.push({ label: `전체 요약 (이미지 ${numPages}장)`, cost: sc.total, cached: false });
    total += sc.total;
  } else {
    items.push({ label: '전체 요약', cost: 0, cached: true });
  }

  const uncached = numPages - cachedSlides;
  if (uncached > 0) {
    const per = estimateCost(model, 1);
    items.push({ label: `슬라이드 설명 (${uncached}장)`, cost: per.total * uncached, cached: false });
    total += per.total * uncached;
  }
  if (cachedSlides > 0) {
    items.push({ label: `슬라이드 설명 (${cachedSlides}장 캐시)`, cost: 0, cached: true });
  }

  return { items, total };
}

export function formatCost(cost: number) {
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(3)}`;
}

// ─── Gemini API ───
export async function callGemini(
  apiKey: string,
  modelId: string,
  contents: any[],
  systemInstruction?: string,
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const body: any = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `API 오류 (${resp.status})`);
  }

  const json = await resp.json();

  // Extract usage for cost tracking
  const usage = json.usageMetadata || {};

  return {
    text: json.candidates?.[0]?.content?.parts?.[0]?.text || '(응답 없음)',
    promptTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
  };
}

// ─── PDF Processing ───
export async function loadPdfJs() {
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs' as any);
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
  return pdfjsLib;
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
}

export async function renderPageToImage(pdfDoc: any, pageNum: number): Promise<string> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.8);
}

// ─── IndexedDB for PDF cache ───
const DB_NAME = 'lumos_pdf_cache';
const DB_STORE = 'pdfs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cachePdfBuffer(hash: string, buffer: ArrayBuffer) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).put(buffer, hash);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedPdfBuffer(hash: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readonly');
  const req = tx.objectStore(DB_STORE).get(hash);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCachedPdf(hash: string) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).delete(hash);
}

// ─── Storage ───
export function storageKey(hash: string) { return `pdf_data_${hash}`; }

export function loadCachedData(hash: string) {
  const raw = localStorage.getItem(storageKey(hash));
  return raw ? JSON.parse(raw) : null;
}

export function saveData(hash: string, data: any) {
  localStorage.setItem(storageKey(hash), JSON.stringify(data));
}

// ─── Default Prompts ───
export const DEFAULT_PROMPTS = {
  summary: `당신은 대학교 강의 자료를 분석하는 교육 전문가입니다.
주어진 강의 PDF의 모든 슬라이드를 분석하고, 이 강의의 전체적인 내용을 체계적으로 요약해주세요.

요약에 포함할 내용:
1. 강의의 주제와 목표
2. 주요 개념과 핵심 내용
3. 각 섹션/파트별 내용 흐름
4. 중요 키워드와 용어 정리

한국어로 작성해주세요.`,

  slide: `당신은 고등학생도 쉽게 이해할 수 있도록 설명하는 친절한 교수입니다.

이 강의의 전체 내용 요약:
{summary}

현재 보고 있는 슬라이드: {slideNumber}번 (총 {totalSlides}장 중)

이 슬라이드의 내용을 다음 규칙에 맞게 설명해주세요:
1. 고등학생에게 설명한다고 생각하고 최대한 쉽고 친근하게
2. 전문 용어가 나오면 반드시 쉬운 말로 풀어서 설명
3. 가능하면 비유나 예시를 활용
4. 이 슬라이드가 전체 강의에서 어떤 위치에 있는지, 앞뒤 맥락도 간단히 언급
5. 핵심 포인트를 명확히 정리
6. 마크다운 형식으로 보기 좋게 작성
7. 수학 수식은 반드시 LaTeX 형식으로 작성 (인라인: $수식$, 블록: $$수식$$)

한국어로 작성해주세요.`,

  qa: `당신은 이 강의를 가르치는 친절한 교수입니다. 학생의 질문에 쉽고 정확하게 답변해주세요.

강의 전체 요약:
{summary}

현재 보고 있는 슬라이드: {slideNumber}번
이 슬라이드에 대한 AI 설명:
{explanation}

학생의 질문에 답변할 때:
1. 고등학생도 이해할 수 있게 쉽게 설명
2. 필요하면 예시나 비유 사용
3. 슬라이드 내용과 관련지어서 답변
4. 한국어로 답변`,
};

// ─── Simple Markdown → HTML ───
export function md(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-3]|ul|ol|pre|blockquote|hr)/.test(block)) return block;
    return `<p>${block}</p>`;
  }).join('\n');
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (_, c) => `<p>${c.replace(/\n/g, '<br>')}</p>`);
  return html;
}
