// PDF.js setup
const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

// ─── i18n (Internationalization) ───
let currentLang = localStorage.getItem('lang') || 'ko';

const TRANSLATIONS = {
    ko: {
        // HTML static text
        title: 'AI 강의자료 학습 도우미',
        headerTitle: 'AI 강의자료 학습 도우미',
        settings: '설정',
        uploadTitle: '강의 PDF를 업로드하세요',
        uploadSub: '파일을 드래그하거나 클릭하여 선택',
        recentFiles: '최근 파일',
        filename: '파일명',
        goHome: '홈으로',
        progressDefault: '0/0 완료',
        costDefault: '누적 비용: $0.000',
        originalSlide: '원본 슬라이드',
        aiExplanation: 'AI 설명',
        refreshExplanation: '설명 새로고침',
        selectSlideHint: '슬라이드를 선택하면 AI 설명이 표시됩니다.',
        qna: '질의응답',
        clearChat: '대화 초기화',
        chatPlaceholder: '이 슬라이드에 대해 질문하세요...',
        send: '전송',
        estimatedCost: '예상 API 비용',
        costDisclaimer: '* Gemini API 공식 가격 기준 추정치입니다. 실제 비용은 다를 수 있습니다.',
        cancel: '취소',
        proceed: '진행',
        processing: '처리 중...',
        summaryPromptLabel: '전체 요약 프롬프트',
        slidePromptLabel: '슬라이드별 설명 프롬프트',
        slidePromptHint: '사용 가능한 변수: {summary} = 전체 요약, {slideNumber} = 슬라이드 번호, {totalSlides} = 총 슬라이드 수',
        qaPromptLabel: '질의응답 시스템 프롬프트',
        qaPromptHint: '사용 가능한 변수: {summary} = 전체 요약, {slideNumber} = 슬라이드 번호, {explanation} = AI 설명',
        dataManagement: '데이터 관리',
        clearAllData: '모든 저장 데이터 삭제',
        save: '저장',
        apiKeyPlaceholder: 'API Key를 입력하세요',
        modelLabel: 'AI 모델',
        modelFlash: 'Flash (빠르고 저렴)',
        modelPro: 'Pro (고성능)',
        // Dynamic JS strings
        sessionCost: '이번 세션 비용:',
        currentSessionCost: '현재 세션 비용:',
        accumulatedCost: '누적 비용:',
        summaryLabel: '전체 요약',
        summaryWithImages: '전체 요약 (이미지 {n}장)',
        slideExplanation: '슬라이드 설명',
        slidesUncached: '슬라이드 설명 ({n}장 미생성)',
        slidesCached: '슬라이드 설명 ({n}장 캐시됨)',
        estimatedTotal: '예상 총 비용',
        cachedFree: '캐시 사용 (무료)',
        allCachedMsg: '모든 데이터가 캐시되어 있어 추가 비용이 없습니다!',
        progressDone: '{done}/{total} 완료',
        renderingImages: '슬라이드 이미지 생성 중...',
        renderingSlide: '슬라이드 렌더링 ({current}/{total})',
        generatingSummary: '전체 강의 요약 생성 중...',
        preparingApi: 'Gemini API 호출 준비',
        callingApi: 'Gemini API 호출 중 ({n}장 분석)',
        summaryDone: '요약 완료!',
        preparing: '준비 중...',
        summaryFailed: '요약 생성 실패:',
        summaryFailedPlaceholder: '(요약 생성 실패)',
        generatingExplanation: '설명 생성 중',
        regeneratingExplanation: '설명 재생성 중',
        explanationFailed: '설명 생성 실패:',
        failed: '실패:',
        explainSlide: '이 슬라이드를 설명해주세요.',
        slideLabel: '슬라이드',
        askAboutSlide: '이 슬라이드에 대해 궁금한 점을 물어보세요.',
        waitingResponse: '응답 대기중...',
        errorPrefix: '오류:',
        noResponse: '(응답 없음)',
        alertSetApiKey: 'Gemini API Key를 설정해주세요.',
        alertSetApiKeyStart: '시작하려면 Gemini API Key를 설정해주세요.',
        requestTimeout: '요청 시간 초과 (2분). 다시 시도해주세요.',
        networkError: '네트워크 오류: 인터넷 연결을 확인해주세요.',
        apiError: 'API 오류',
        reuploadAlert: '같은 PDF 파일을 다시 선택해주세요. 이전 분석 결과가 자동으로 로드됩니다.',
        confirmClearAll: '모든 저장된 데이터를 삭제하시겠습니까? (API키 제외)',
        deleted: '삭제되었습니다.',
        confirmClearChat: '이 슬라이드의 대화 내역을 삭제하시겠습니까?',
        delete: '삭제',
        done: '완료',
        pages: '장',
        elapsedTime: '경과 시간:',
        minutes: '분',
        seconds: '초',
    },
    en: {
        title: 'AI Lecture Study Assistant',
        headerTitle: 'AI Lecture Study Assistant',
        settings: 'Settings',
        uploadTitle: 'Upload your lecture PDF',
        uploadSub: 'Drag & drop or click to select',
        recentFiles: 'Recent Files',
        filename: 'Filename',
        goHome: 'Home',
        progressDefault: '0/0 done',
        costDefault: 'Total cost: $0.000',
        originalSlide: 'Original Slide',
        aiExplanation: 'AI Explanation',
        refreshExplanation: 'Refresh explanation',
        selectSlideHint: 'Select a slide to see the AI explanation.',
        qna: 'Q&A',
        clearChat: 'Clear chat',
        chatPlaceholder: 'Ask a question about this slide...',
        send: 'Send',
        estimatedCost: 'Estimated API Cost',
        costDisclaimer: '* Estimated based on official Gemini API pricing. Actual costs may vary.',
        cancel: 'Cancel',
        proceed: 'Proceed',
        processing: 'Processing...',
        summaryPromptLabel: 'Full Summary Prompt',
        slidePromptLabel: 'Per-Slide Explanation Prompt',
        slidePromptHint: 'Available variables: {summary} = full summary, {slideNumber} = slide number, {totalSlides} = total slides',
        qaPromptLabel: 'Q&A System Prompt',
        qaPromptHint: 'Available variables: {summary} = full summary, {slideNumber} = slide number, {explanation} = AI explanation',
        dataManagement: 'Data Management',
        clearAllData: 'Delete all saved data',
        save: 'Save',
        apiKeyPlaceholder: 'Enter your API Key',
        modelLabel: 'AI Model',
        modelFlash: 'Flash (fast & affordable)',
        modelPro: 'Pro (high performance)',
        sessionCost: 'Session cost:',
        currentSessionCost: 'Session cost:',
        accumulatedCost: 'Total cost:',
        summaryLabel: 'Full Summary',
        summaryWithImages: 'Full Summary ({n} images)',
        slideExplanation: 'Slide Explanation',
        slidesUncached: 'Slide explanations ({n} not generated)',
        slidesCached: 'Slide explanations ({n} cached)',
        estimatedTotal: 'Estimated Total',
        cachedFree: 'Cached (free)',
        allCachedMsg: 'All data is cached. No additional cost!',
        progressDone: '{done}/{total} done',
        renderingImages: 'Generating slide images...',
        renderingSlide: 'Rendering slides ({current}/{total})',
        generatingSummary: 'Generating full lecture summary...',
        preparingApi: 'Preparing Gemini API call',
        callingApi: 'Calling Gemini API ({n} images)',
        summaryDone: 'Summary complete!',
        preparing: 'Preparing...',
        summaryFailed: 'Summary generation failed:',
        summaryFailedPlaceholder: '(Summary generation failed)',
        generatingExplanation: 'Generating explanation',
        regeneratingExplanation: 'Regenerating explanation',
        explanationFailed: 'Explanation failed:',
        failed: 'Failed:',
        explainSlide: 'Please explain this slide.',
        slideLabel: 'Slide',
        askAboutSlide: 'Ask a question about this slide.',
        waitingResponse: 'Waiting for response...',
        errorPrefix: 'Error:',
        noResponse: '(No response)',
        alertSetApiKey: 'Please set your Gemini API Key.',
        alertSetApiKeyStart: 'Please set your Gemini API Key to get started.',
        requestTimeout: 'Request timed out (2 min). Please try again.',
        networkError: 'Network error: Please check your internet connection.',
        apiError: 'API Error',
        reuploadAlert: 'Please select the same PDF file again. Previous analysis will be loaded automatically.',
        confirmClearAll: 'Delete all saved data? (API key will be kept)',
        deleted: 'Data deleted.',
        confirmClearChat: 'Delete chat history for this slide?',
        delete: 'Delete',
        done: 'done',
        pages: 'pages',
        elapsedTime: 'Elapsed:',
        minutes: 'min',
        seconds: 'sec',
    }
};

function t(key, replacements) {
    let str = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['ko'][key] || key;
    if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
            str = str.replace(`{${k}}`, v);
        }
    }
    return str;
}

function applyLanguage() {
    // Update HTML lang attribute
    const htmlEl = document.getElementById('html-root');
    if (htmlEl) htmlEl.lang = currentLang;

    // Update all data-i18n text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update all data-i18n-title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });

    // Update all data-i18n-placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Update select options with data-i18n
    document.querySelectorAll('select option[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update document title
    document.title = t('title');

    // Update lang toggle button text
    const langBtn = document.getElementById('btn-lang');
    if (langBtn) {
        langBtn.textContent = currentLang === 'ko' ? 'EN' : 'KO';
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('lang', currentLang);
    applyLanguage();
}

// ─── Default Prompts ───
const DEFAULT_PROMPTS_KO = {
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
4. 한국어로 답변`
};

const DEFAULT_PROMPTS_EN = {
    summary: `You are an educational expert who analyzes university lecture materials.
Analyze all slides of the given lecture PDF and provide a systematic summary of the entire lecture.

Include in the summary:
1. The topic and objectives of the lecture
2. Key concepts and core content
3. Content flow by section/part
4. Important keywords and terminology

Please write in English.`,

    slide: `You are a friendly professor who explains concepts so that even a high school student can understand.

Summary of the entire lecture:
{summary}

Current slide: #{slideNumber} (out of {totalSlides} total)

Explain this slide following these rules:
1. Explain as if teaching a high school student - keep it simple and friendly
2. When technical terms appear, always explain them in plain language
3. Use analogies or examples when possible
4. Briefly mention where this slide fits in the overall lecture context
5. Clearly highlight the key points
6. Write in clean markdown format
7. Math formulas must be in LaTeX (inline: $formula$, block: $$formula$$)

Please write in English.`,

    qa: `You are a friendly professor teaching this lecture. Answer student questions clearly and accurately.

Full lecture summary:
{summary}

Current slide: #{slideNumber}
AI explanation for this slide:
{explanation}

When answering:
1. Explain simply enough for a high school student
2. Use examples or analogies when needed
3. Relate your answer to the slide content
4. Answer in English`
};

function getDefaultPrompts() {
    return currentLang === 'ko' ? { ...DEFAULT_PROMPTS_KO } : { ...DEFAULT_PROMPTS_EN };
}

// ─── Gemini Models & Pricing ───
const MODELS = {
    flash: {
        id: 'gemini-2.5-flash-preview-05-20',
        label: 'Gemini 2.5 Flash',
        inputPerMToken: 0.15,
        outputPerMToken: 0.60,
    },
    pro: {
        id: 'gemini-2.5-pro-preview-05-06',
        label: 'Gemini 2.5 Pro',
        inputPerMToken: 1.25,
        outputPerMToken: 10.0,
    },
};

function getModel() {
    const key = localStorage.getItem('gemini_model') || 'flash';
    return MODELS[key] || MODELS.flash;
}

function getPricing() {
    const model = getModel();
    return {
        inputPerMToken: model.inputPerMToken,
        outputPerMToken: model.outputPerMToken,
        tokensPerImage: 258,
        avgPromptTokens: 500,
        avgOutputTokens: 4000,
    };
}

// ─── State ───
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    prompts: JSON.parse(localStorage.getItem('custom_prompts') || 'null') || getDefaultPrompts(),
    currentPdf: null,       // { name, hash, numPages }
    currentSlide: 0,        // 0-indexed
    pdfDoc: null,
    slideImages: [],        // base64 images per page
    data: null,             // { summary, slides: [{explanation, chat:[{role,text}]}] }
    sessionCost: 0,         // accumulated cost this session ($)
};

// ─── Storage Keys ───
function storageKey(hash) { return `pdf_data_${hash}`; }
function recentKey() { return 'recent_files'; }

// ─── Cost Estimation ───
function estimateCost(numImages, isOutput = true) {
    const pricing = getPricing();
    const inputTokens = (numImages * pricing.tokensPerImage) + pricing.avgPromptTokens;
    const outputTokens = isOutput ? pricing.avgOutputTokens : 0;
    const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMToken;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMToken;
    return { inputTokens, outputTokens, inputCost, outputCost, total: inputCost + outputCost };
}

function estimateFullPdfCost(numPages, hasCachedSummary, cachedSlides) {
    const items = [];
    let total = 0;

    // Summary cost (all images in one call)
    if (!hasCachedSummary) {
        const summaryCost = estimateCost(numPages);
        items.push({ label: t('summaryWithImages', { n: numPages }), cost: summaryCost.total, cached: false });
        total += summaryCost.total;
    } else {
        items.push({ label: t('summaryLabel'), cost: 0, cached: true });
    }

    // Per-slide explanation cost
    const uncachedSlides = numPages - cachedSlides;
    if (uncachedSlides > 0) {
        const perSlide = estimateCost(1);
        const slidesCost = perSlide.total * uncachedSlides;
        items.push({ label: t('slidesUncached', { n: uncachedSlides }), cost: slidesCost, cached: false });
        total += slidesCost;
    }
    if (cachedSlides > 0) {
        items.push({ label: t('slidesCached', { n: cachedSlides }), cost: 0, cached: true });
    }

    return { items, total };
}

function formatCost(cost) {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(3)}`;
}

function updateCostDisplay() {
    const el = $('cost-info');
    if (el) {
        el.style.display = 'block';
        $('cost-text').textContent = `${t('sessionCost')} ${formatCost(state.sessionCost)}`;
    }
    const loadingCost = $('loading-cost');
    if (loadingCost) {
        loadingCost.textContent = `${t('currentSessionCost')} ${formatCost(state.sessionCost)}`;
    }
}

function addCost(numImages) {
    const cost = estimateCost(numImages);
    state.sessionCost += cost.total;
    updateCostDisplay();
}

function showCostConfirm(numPages, hasCachedSummary, cachedSlides) {
    return new Promise((resolve) => {
        const estimate = estimateFullPdfCost(numPages, hasCachedSummary, cachedSlides);

        const model = getModel();
        let html = `<div class="cost-row" style="margin-bottom:8px;">
            <span class="cost-label">${t('modelLabel')}</span>
            <span class="cost-value" style="color:var(--accent);">${model.label}</span>
        </div>`;
        for (const item of estimate.items) {
            if (item.cached) {
                html += `<div class="cost-row">
                    <span class="cost-label">${item.label}</span>
                    <span class="cost-cached">${t('cachedFree')}</span>
                </div>`;
            } else {
                html += `<div class="cost-row">
                    <span class="cost-label">${item.label}</span>
                    <span class="cost-value">${formatCost(item.cost)}</span>
                </div>`;
            }
        }
        html += `<div class="cost-row cost-total">
            <span>${t('estimatedTotal')}</span>
            <span>${formatCost(estimate.total)}</span>
        </div>`;

        if (estimate.total === 0) {
            html += `<p class="cost-cached" style="margin-top:12px;text-align:center;">${t('allCachedMsg')}</p>`;
        }

        $('cost-breakdown').innerHTML = html;
        $('cost-modal').style.display = 'flex';

        const proceed = () => { cleanup(); resolve(true); };
        const cancel = () => { cleanup(); resolve(false); };
        const cleanup = () => {
            $('cost-modal').style.display = 'none';
            $('btn-cost-proceed').removeEventListener('click', proceed);
            $('btn-cost-cancel').removeEventListener('click', cancel);
            $('btn-close-cost').removeEventListener('click', cancel);
        };

        $('btn-cost-proceed').addEventListener('click', proceed);
        $('btn-cost-cancel').addEventListener('click', cancel);
        $('btn-close-cost').addEventListener('click', cancel);
    });
}

// ─── Utility: Hash a file ───
async function hashFile(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// ─── Simple Markdown to HTML ───
function md(text) {
    if (!text) return '';
    let html = text
        // code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // hr
        .replace(/^---$/gm, '<hr>')
        // blockquote
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // unordered list
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        // ordered list
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Paragraphs
    html = html.split('\n\n').map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') ||
            block.startsWith('<pre') || block.startsWith('<blockquote') || block.startsWith('<hr')) {
            return block;
        }
        return `<p>${block}</p>`;
    }).join('\n');

    // single newlines to <br> within paragraphs
    html = html.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
        return `<p>${content.replace(/\n/g, '<br>')}</p>`;
    });

    return html;
}

function renderMath(el) {
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(el, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\[', right: '\\]', display: true },
                { left: '\\(', right: '\\)', display: false },
            ],
            throwOnError: false,
        });
    }
}

// ─── Gemini API ───
async function callGemini(contents, systemInstruction) {
    if (!state.apiKey) {
        alert(t('alertSetApiKey'));
        openSettings();
        throw new Error('API key not set');
    }

    const model = getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${state.apiKey}`;

    const body = {
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
        }
    };

    if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    let resp;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 2분 타임아웃
        resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        clearTimeout(timeout);
    } catch (e) {
        if (e.name === 'AbortError') {
            throw new Error(t('requestTimeout'));
        }
        throw new Error(`${t('networkError')} (${e.message})`);
    }

    if (!resp.ok) {
        const err = await resp.text();
        console.error('Gemini API error:', err);
        throw new Error(`${t('apiError')} (${resp.status}): ${err}`);
    }

    const json = await resp.json();

    // Track cost from usage metadata if available
    const usage = json.usageMetadata;
    if (usage) {
        const pricing = getPricing();
        const inputCost = ((usage.promptTokenCount || 0) / 1_000_000) * pricing.inputPerMToken;
        const outputCost = ((usage.candidatesTokenCount || 0) / 1_000_000) * pricing.outputPerMToken;
        state.sessionCost += inputCost + outputCost;
        updateCostDisplay();
    }

    return json.candidates?.[0]?.content?.parts?.[0]?.text || t('noResponse');
}

// ─── PDF Processing ───
async function loadPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hash = await hashFile(file);
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    state.pdfDoc = pdfDoc;
    state.currentPdf = { name: file.name, hash, numPages: pdfDoc.numPages };
    state.currentSlide = 0;
    state.slideImages = [];

    // Check for cached data
    const cached = localStorage.getItem(storageKey(hash));
    if (cached) {
        state.data = JSON.parse(cached);
    } else {
        state.data = { summary: null, slides: Array(pdfDoc.numPages).fill(null).map(() => ({ explanation: null, chat: [] })) };
    }

    // Render all pages as images
    const totalSteps = pdfDoc.numPages + (state.data.summary ? 0 : 1); // images + summary
    let currentStep = 0;

    showLoading(t('renderingImages'), t('renderingSlide', { current: 0, total: pdfDoc.numPages }), 0);
    for (let i = 0; i < pdfDoc.numPages; i++) {
        updateLoading(
            t('renderingImages'),
            t('renderingSlide', { current: i + 1, total: pdfDoc.numPages }),
            (i + 1) / pdfDoc.numPages * 0.3  // images = 30% of total
        );
        const page = await pdfDoc.getPage(i + 1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        state.slideImages.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    // Update recent files
    updateRecentFiles(file.name, hash, pdfDoc.numPages);

    hideLoading();

    // Show cost estimate before proceeding
    const cachedSlides = state.data.slides.filter(s => s?.explanation).length;
    const hasCachedSummary = !!state.data.summary;
    const proceed = await showCostConfirm(pdfDoc.numPages, hasCachedSummary, cachedSlides);

    if (!proceed) {
        state.pdfDoc = null;
        state.currentPdf = null;
        return;
    }

    // Generate summary if not cached
    if (!state.data.summary) {
        showLoading(t('generatingSummary'), t('preparingApi'), 0.3);
        await generateSummary();
    }

    hideLoading();
    showViewer();
}

async function generateSummary() {
    updateLoading(
        t('generatingSummary'),
        t('callingApi', { n: state.slideImages.length }),
        0.35
    );

    const parts = [{ text: state.prompts.summary }];

    // Add all slide images
    for (let i = 0; i < state.slideImages.length; i++) {
        parts.push({ text: `\n--- ${t('slideLabel')} ${i + 1} ---` });
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: state.slideImages[i].split(',')[1]
            }
        });
    }

    try {
        // Pulse animation during API call
        let pulse = 0.35;
        const pulseInterval = setInterval(() => {
            pulse = pulse >= 0.65 ? 0.35 : pulse + 0.02;
            $('loading-progress-fill').style.width = `${Math.round(pulse * 100)}%`;
        }, 500);

        state.data.summary = await callGemini([{ role: 'user', parts }]);
        clearInterval(pulseInterval);
        updateLoading(t('summaryDone'), t('preparing'), 1.0);
        saveData();
    } catch (e) {
        alert(t('summaryFailed') + ' ' + e.message);
        state.data.summary = t('summaryFailedPlaceholder');
    }
}

async function generateSlideExplanation(slideIdx) {
    const promptTemplate = state.prompts.slide;
    const systemPrompt = promptTemplate
        .replace('{summary}', state.data.summary || '')
        .replace('{slideNumber}', String(slideIdx + 1))
        .replace('{totalSlides}', String(state.currentPdf.numPages));

    const parts = [
        { text: t('explainSlide') },
        {
            inlineData: {
                mimeType: 'image/jpeg',
                data: state.slideImages[slideIdx].split(',')[1]
            }
        }
    ];

    const result = await callGemini([{ role: 'user', parts }], systemPrompt);
    state.data.slides[slideIdx].explanation = result;
    saveData();
    return result;
}

async function askQuestion(slideIdx, question) {
    const slide = state.data.slides[slideIdx];
    const systemPrompt = state.prompts.qa
        .replace('{summary}', state.data.summary || '')
        .replace('{slideNumber}', String(slideIdx + 1))
        .replace('{explanation}', slide.explanation || '');

    // Build conversation history (text only, no image to keep payload small)
    const contents = [];

    // Only keep last 10 messages to avoid payload too large
    const recentChat = slide.chat.slice(-10);
    for (const msg of recentChat) {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        });
    }

    // Add current question
    contents.push({ role: 'user', parts: [{ text: question }] });

    const answer = await callGemini(contents, systemPrompt);

    // Save to chat history
    slide.chat.push({ role: 'user', text: question });
    slide.chat.push({ role: 'ai', text: answer });
    saveData();

    return answer;
}

// ─── Data Persistence ───
function saveData() {
    if (state.currentPdf) {
        localStorage.setItem(storageKey(state.currentPdf.hash), JSON.stringify(state.data));
    }
}

function updateRecentFiles(name, hash, numPages) {
    let recent = JSON.parse(localStorage.getItem(recentKey()) || '[]');
    recent = recent.filter(r => r.hash !== hash);
    recent.unshift({ name, hash, numPages, date: new Date().toISOString() });
    if (recent.length > 10) recent = recent.slice(0, 10);
    localStorage.setItem(recentKey(), JSON.stringify(recent));
}

// ─── UI Functions ───
const $ = id => document.getElementById(id);

let loadingTimer = null;
let loadingStartTime = null;

function showLoading(text, step, progress) {
    $('loading-text').textContent = text;
    $('loading-overlay').style.display = 'flex';

    // Step info
    $('loading-step').textContent = step || '';

    // Progress bar
    const fill = $('loading-progress-fill');
    if (progress !== undefined) {
        fill.style.width = `${Math.round(progress * 100)}%`;
        $('loading-detail').style.display = 'block';
    } else {
        fill.style.width = '0%';
    }

    // Timer
    if (!loadingStartTime) {
        loadingStartTime = Date.now();
        loadingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000);
            const min = Math.floor(elapsed / 60);
            const sec = elapsed % 60;
            $('loading-timer').textContent = `${t('elapsedTime')} ${min > 0 ? min + t('minutes') + ' ' : ''}${sec}${t('seconds')}`;
        }, 1000);
        $('loading-timer').textContent = `${t('elapsedTime')} 0${t('seconds')}`;
    }

    $('loading-detail').style.display = 'block';
}

function updateLoading(text, step, progress) {
    $('loading-text').textContent = text;
    if (step !== undefined) $('loading-step').textContent = step;
    if (progress !== undefined) {
        $('loading-progress-fill').style.width = `${Math.round(progress * 100)}%`;
    }
}

function hideLoading() {
    $('loading-overlay').style.display = 'none';
    if (loadingTimer) {
        clearInterval(loadingTimer);
        loadingTimer = null;
    }
    loadingStartTime = null;
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(viewId).classList.add('active');
}

function showViewer() {
    showView('viewer');
    $('pdf-filename').textContent = state.currentPdf.name;
    renderThumbnails();
    selectSlide(0);
    updateProgress();
}

function renderThumbnails() {
    const list = $('thumbnail-list');
    list.innerHTML = '';

    for (let i = 0; i < state.currentPdf.numPages; i++) {
        const item = document.createElement('div');
        item.className = 'thumbnail-item' + (state.data.slides[i]?.explanation ? ' done' : '');
        item.dataset.idx = i;

        const img = document.createElement('img');
        img.src = state.slideImages[i];
        img.style.width = '100%';
        img.style.display = 'block';

        const num = document.createElement('div');
        num.className = 'thumbnail-num';
        num.textContent = i + 1;

        item.appendChild(img);
        item.appendChild(num);
        item.addEventListener('click', () => selectSlide(i));
        list.appendChild(item);
    }
}

async function selectSlide(idx) {
    state.currentSlide = idx;

    // Update active thumbnail
    document.querySelectorAll('.thumbnail-item').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
    });

    // Render main slide
    $('slide-num').textContent = `(${idx + 1}/${state.currentPdf.numPages})`;

    const page = await state.pdfDoc.getPage(idx + 1);
    const canvas = $('slide-canvas');
    const wrapRect = document.querySelector('.slide-image-wrap').getBoundingClientRect();
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
        (wrapRect.width - 32) / baseViewport.width,
        (wrapRect.height - 32) / baseViewport.height,
        3
    );
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Show explanation
    const slide = state.data.slides[idx];
    if (slide?.explanation) {
        $('explanation-content').innerHTML = md(slide.explanation);
        renderMath($('explanation-content'));
    } else {
        $('explanation-content').innerHTML = `<p class="placeholder">${t('generatingExplanation')}<span class="loading-dots"></span></p>`;
        try {
            const explanation = await generateSlideExplanation(idx);
            if (state.currentSlide === idx) {
                $('explanation-content').innerHTML = md(explanation);
                renderMath($('explanation-content'));
            }
            // Mark thumbnail as done
            document.querySelectorAll('.thumbnail-item')[idx]?.classList.add('done');
            updateProgress();
        } catch (e) {
            if (state.currentSlide === idx) {
                $('explanation-content').innerHTML = `<p class="placeholder" style="color:var(--danger);">${t('explanationFailed')} ${e.message}</p>`;
            }
        }
    }

    // Render chat history
    renderChat();
}

function renderChat() {
    const chatEl = $('chat-messages');
    const slide = state.data.slides[state.currentSlide];
    chatEl.innerHTML = '';

    if (!slide?.chat?.length) {
        chatEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;padding:8px;">${t('askAboutSlide')}</p>`;
        return;
    }

    for (const msg of slide.chat) {
        const div = document.createElement('div');
        div.className = `chat-msg ${msg.role}`;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML = msg.role === 'ai' ? md(msg.text) : escapeHtml(msg.text);
        div.appendChild(bubble);
        chatEl.appendChild(div);
        if (msg.role === 'ai') renderMath(bubble);
    }

    chatEl.scrollTop = chatEl.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateProgress() {
    const done = state.data.slides.filter(s => s?.explanation).length;
    const total = state.currentPdf.numPages;
    $('progress-text').textContent = t('progressDone', { done, total });
    $('progress-fill').style.width = `${(done / total) * 100}%`;
}

function showRecentFiles() {
    const recent = JSON.parse(localStorage.getItem(recentKey()) || '[]');
    const container = $('recent-files');
    const list = $('recent-list');

    if (recent.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    list.innerHTML = '';

    for (const item of recent) {
        const div = document.createElement('div');
        div.className = 'recent-item';

        const dateLocale = currentLang === 'ko' ? 'ko-KR' : 'en-US';
        const dateStr = new Date(item.date).toLocaleDateString(dateLocale);
        const cached = localStorage.getItem(storageKey(item.hash));
        const data = cached ? JSON.parse(cached) : null;
        const doneCount = data ? data.slides.filter(s => s?.explanation).length : 0;

        div.innerHTML = `
            <div class="recent-item-info">
                <span class="recent-item-name">${escapeHtml(item.name)}</span>
                <span class="recent-item-date">${dateStr} · ${item.numPages} ${t('pages')} · ${doneCount}/${item.numPages} ${t('done')}</span>
            </div>
            <div class="recent-item-actions">
                <button class="delete-btn" data-hash="${item.hash}" title="${t('delete')}">&#128465;</button>
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            // Need to re-upload same file
            alert(t('reuploadAlert'));
            $('pdf-input').click();
        });

        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const hash = e.currentTarget.dataset.hash;
            localStorage.removeItem(storageKey(hash));
            let r = JSON.parse(localStorage.getItem(recentKey()) || '[]');
            r = r.filter(x => x.hash !== hash);
            localStorage.setItem(recentKey(), JSON.stringify(r));
            showRecentFiles();
        });

        list.appendChild(div);
    }
}

function openSettings() {
    $('api-key-input').value = state.apiKey;
    $('model-select').value = localStorage.getItem('gemini_model') || 'flash';
    $('prompt-summary').value = state.prompts.summary;
    $('prompt-slide').value = state.prompts.slide;
    $('prompt-qa').value = state.prompts.qa;
    $('settings-modal').style.display = 'flex';
}

function closeSettings() {
    $('settings-modal').style.display = 'none';
}

// ─── Event Listeners ───
// Upload
const uploadArea = $('upload-area');
const pdfInput = $('pdf-input');

uploadArea.addEventListener('click', () => pdfInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') loadPdf(file);
});
pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadPdf(file);
});

// Back button
$('btn-back').addEventListener('click', () => {
    showView('landing');
    showRecentFiles();
    state.pdfDoc = null;
    state.currentPdf = null;
});

// Settings
$('btn-settings').addEventListener('click', openSettings);
$('btn-close-settings').addEventListener('click', closeSettings);
$('settings-modal').querySelector('.modal-overlay').addEventListener('click', closeSettings);

$('btn-toggle-key').addEventListener('click', () => {
    const input = $('api-key-input');
    input.type = input.type === 'password' ? 'text' : 'password';
});

$('btn-save-settings').addEventListener('click', () => {
    state.apiKey = $('api-key-input').value.trim();
    localStorage.setItem('gemini_api_key', state.apiKey);

    localStorage.setItem('gemini_model', $('model-select').value);

    state.prompts.summary = $('prompt-summary').value;
    state.prompts.slide = $('prompt-slide').value;
    state.prompts.qa = $('prompt-qa').value;
    localStorage.setItem('custom_prompts', JSON.stringify(state.prompts));

    closeSettings();
});

$('btn-clear-all').addEventListener('click', () => {
    if (confirm(t('confirmClearAll'))) {
        const apiKey = localStorage.getItem('gemini_api_key');
        const lang = localStorage.getItem('lang');
        const model = localStorage.getItem('gemini_model');
        localStorage.clear();
        if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
        if (lang) localStorage.setItem('lang', lang);
        if (model) localStorage.setItem('gemini_model', model);
        alert(t('deleted'));
        showRecentFiles();
    }
});

// Refresh explanation
$('btn-refresh-explanation').addEventListener('click', async () => {
    if (!state.currentPdf) return;
    const idx = state.currentSlide;
    state.data.slides[idx].explanation = null;
    saveData();
    $('explanation-content').innerHTML = `<p class="placeholder">${t('regeneratingExplanation')}<span class="loading-dots"></span></p>`;
    try {
        const explanation = await generateSlideExplanation(idx);
        if (state.currentSlide === idx) {
            $('explanation-content').innerHTML = md(explanation);
            renderMath($('explanation-content'));
        }
    } catch (e) {
        $('explanation-content').innerHTML = `<p class="placeholder" style="color:var(--danger);">${t('failed')} ${e.message}</p>`;
    }
});

// Chat
$('btn-send').addEventListener('click', sendChat);
$('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
});

async function sendChat() {
    const input = $('chat-input');
    const question = input.value.trim();
    if (!question || !state.currentPdf) return;

    const idx = state.currentSlide;
    input.value = '';

    // Add user message immediately
    state.data.slides[idx].chat.push({ role: 'user', text: question });
    renderChat();

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg ai';
    typingDiv.innerHTML = '<div class="chat-bubble typing-indicator"><span></span><span></span><span></span></div>';
    $('chat-messages').appendChild(typingDiv);
    $('chat-messages').scrollTop = $('chat-messages').scrollHeight;

    // Disable input
    input.disabled = true;
    $('btn-send').disabled = true;
    $('btn-send').textContent = t('waitingResponse');

    // Remove the user message we just added (askQuestion will add it again)
    state.data.slides[idx].chat.pop();

    try {
        await askQuestion(idx, question);
        if (state.currentSlide === idx) renderChat();
    } catch (e) {
        // Re-add user message and error
        state.data.slides[idx].chat.push({ role: 'user', text: question });
        state.data.slides[idx].chat.push({ role: 'ai', text: `${t('errorPrefix')} ${e.message}` });
        saveData();
        if (state.currentSlide === idx) renderChat();
    }

    input.disabled = false;
    $('btn-send').disabled = false;
    $('btn-send').textContent = t('send');
    input.focus();
}

// Clear chat
$('btn-clear-chat').addEventListener('click', () => {
    if (!state.currentPdf) return;
    if (confirm(t('confirmClearChat'))) {
        state.data.slides[state.currentSlide].chat = [];
        saveData();
        renderChat();
    }
});

// Chat resize handle
const resizeHandle = $('chat-resize-handle');
const chatSection = document.querySelector('.chat-section');
let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeHandle.classList.add('dragging');
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const containerBottom = document.querySelector('#main-content').getBoundingClientRect().bottom;
    const newHeight = containerBottom - e.clientY;
    const clamped = Math.max(120, Math.min(newHeight, window.innerHeight * 0.7));
    chatSection.style.height = clamped + 'px';
});

document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    resizeHandle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!state.currentPdf) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.currentSlide > 0) selectSlide(state.currentSlide - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (state.currentSlide < state.currentPdf.numPages - 1) selectSlide(state.currentSlide + 1);
    }
});

// ─── Language Toggle ───
$('btn-lang').addEventListener('click', toggleLanguage);

// ─── Init ───
applyLanguage();
showRecentFiles();

// Check if API key is set
if (!state.apiKey) {
    setTimeout(() => {
        alert(t('alertSetApiKeyStart'));
        openSettings();
    }, 500);
}
