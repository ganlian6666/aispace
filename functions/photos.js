import { getLocale, t } from './utils/i18n.js';

export async function onRequestGet(context) {
    const { env, request } = context;

    // 0. Language Detection
    const cookie = request.headers.get('Cookie');
    const locale = getLocale(request.headers.get('Accept-Language'), cookie);
    const T = (key, vars) => t(locale, key, vars); // We might need to extend i18n for new keys

    // Fallback translation helper since we haven't updated i18n.js yet
    const T_Safe = (key, defaultVal) => {
        // Ideally this should use t(), but for now we hardcode new keys or fallback
        const dict = {
            'zh': {
                'photos_title': 'AI 摄影师',
                'photos_subtitle': '无需摄影棚，用 AI 生成你的专业大片',
                'pack_professional': '职业照',
                'pack_cyberpunk': '赛博朋克',
                'pack_graduation': '毕业照',
                'pack_polaroid': '拍立得',
                'lbl_prompt': '画面描述',
                'btn_generate': '立即生成',
                'btn_download': '下载原图',
                'ph_prompt': '描述你想生成的画面...',
                'loading_gen': '正在冲洗照片...',
                'res_error': '生成失败',
                'try_pack': '点击上方“相册套餐”快速填入提示词'
            },
            'en': {
                'photos_title': 'AI Photographer',
                'photos_subtitle': 'Professional photos without a studio',
                'pack_professional': 'Professional',
                'pack_cyberpunk': 'Cyberpunk',
                'pack_graduation': 'Graduation',
                'pack_polaroid': 'Polaroid',
                'lbl_prompt': 'Prompt',
                'btn_generate': 'Generate',
                'btn_download': 'Download',
                'ph_prompt': 'Describe the image...',
                'loading_gen': 'Developing photo...',
                'res_error': 'Generation Failed',
                'try_pack': 'Click a "Photo Pack" above to auto-fill'
            }
        };
        return dict[locale][key] || defaultVal || key;
    };

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T_Safe('photos_title')} - AI Space</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css">
  <style>
    /* Specific Styles for Photos Page */
    .photo-hero {
        text-align: center;
        margin-bottom: 40px;
    }
    .photo-hero h1 {
        font-size: 3rem;
        background: linear-gradient(135deg, #FF6B6B 0%, #556270 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 10px;
    }

    /* Photo Packs Grid */
    .packs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 30px;
    }
    .pack-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
    }
    .pack-card:hover, .pack-card.active {
        background: rgba(69, 224, 255, 0.15);
        border-color: var(--accent-glow);
        transform: translateY(-2px);
    }
    .pack-img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 8px;
        background: #000;
    }
    
    /* Input Area */
    .gen-panel {
        background: var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: 20px;
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;
    }
    .gen-input-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
    }
    .gen-textarea {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--panel-border);
        border-radius: 12px;
        padding: 16px;
        color: #fff;
        font-family: inherit;
        font-size: 16px;
        resize: vertical;
        min-height: 100px;
    }
    .gen-textarea:focus {
        outline: none;
        border-color: var(--accent-glow);
    }
    
    /* Upload Area */
    .upload-area {
        border: 2px dashed var(--panel-border);
        border-radius: 12px;
        padding: 30px;
        text-align: center;
        margin-bottom: 20px;
        cursor: pointer;
        transition: all 0.2s;
        background: rgba(0,0,0,0.2);
        position: relative;
    }
    .upload-area:hover, .upload-area.dragover {
        border-color: var(--accent-glow);
        background: rgba(69, 224, 255, 0.05);
    }
    .upload-icon {
        width: 40px;
        height: 40px;
        margin-bottom: 10px;
        color: var(--text-muted);
    }
    .upload-preview {
        max-width: 100%;
        max-height: 200px;
        border-radius: 8px;
        display: none;
        margin-top: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .upload-hint {
        color: var(--text-muted);
        font-size: 14px;
    }
    .clear-img-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    }
    
    /* Result Area */
    .result-display {
        margin-top: 24px;
        border-top: 1px solid var(--panel-border);
        padding-top: 24px;
        display: none; /* Hidden by default */
        text-align: center;
    }
    .result-display.active {
        display: block;
        animation: fadeIn 0.5s ease;
    }
    .result-img {
        max-width: 100%;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    
    /* Loading Spinner */
    .loader {
        display: none;
        width: 48px;
        height: 48px;
        border: 5px solid #FFF;
        border-bottom-color: var(--accent-glow);
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
        margin: 20px auto;
    }
    @keyframes rotation {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="url(#grad1)" d="M12 8l24 32H12z" opacity="0.9"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>${T('brand_name')}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">${T('brand_subtitle')}</p>
        </div>
      </div>
      <nav>
        <a href="/">${T('nav_home')}</a>
        <a href="/news">${T('nav_news')}</a>
        <a href="/photos" class="active">${T_Safe('photos_title')}</a>
        <a href="/vpn">${T('nav_vpn')}</a>
        <a href="/guide">${T('nav_guide')}</a>
      </nav>
      <!-- Same Right Nav -->
      <div style="display:flex; align-items:center; margin-left: auto;">
         <button class="lang-btn" onclick="switchLanguage()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${locale === 'zh' ? 'English' : '中文'}
        </button>
      </div>
    </header>

    <div class="photo-hero">
        <h1>${T_Safe('photos_title')}</h1>
        <p>${T_Safe('photos_subtitle')}</p>
    </div>

    <div class="gen-panel">
        
        <!-- Smart Builder Controls -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:24px;">
            <div>
                <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:14px;">1. ${T_Safe('lbl_subject', '主角 (Subject)')}</label>
                <select id="subjectSelect" class="form-control" onchange="updatePromptBuilder()" style="background:rgba(0,0,0,0.4);">
                    <option value="">${T_Safe('opt_custom', '自定义 (Custom)')}</option>
                    <option value="A beautiful chinese woman">${T_Safe('opt_woman_cn', '中国美女 (Chinese Woman)')}</option>
                    <option value="A handsome chinese man">${T_Safe('opt_man_cn', '中国帅哥 (Chinese Man)')}</option>
                    <option value="A cute golden retriever dog">${T_Safe('opt_dog', '金毛犬 (Golden Retriever)')}</option>
                    <option value="A futuristic robot">${T_Safe('opt_robot', '未来机器人 (Robot)')}</option>
                </select>
            </div>
            <div>
                <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:14px;">2. ${T_Safe('lbl_style', '风格 (Style)')}</label>
                <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; font-size:14px; color:#fff;" id="selectedStyleName">
                    ${T_Safe('style_none', '未选择 (None)')}
                </div>
            </div>
        </div>

        <!-- Photo Packs -->
        <h3 style="margin-top:0">${T_Safe('try_pack')}</h3>
        <div class="packs-grid">
            <div class="pack-card" onclick="selectPack('professional', this)">
                <div class="pack-img" style="background: linear-gradient(45deg, #2c3e50, #bdc3c7)"></div>
                <div>${T_Safe('pack_professional')}</div>
            </div>
            <div class="pack-card" onclick="selectPack('cyberpunk', this)">
                <div class="pack-img" style="background: linear-gradient(45deg, #11998e, #38ef7d)"></div>
                <div>${T_Safe('pack_cyberpunk')}</div>
            </div>
            <div class="pack-card" onclick="selectPack('graduation', this)">
                <div class="pack-img" style="background: linear-gradient(45deg, #f12711, #f5af19)"></div>
                <div>${T_Safe('pack_graduation')}</div>
            </div>
            <div class="pack-card" onclick="selectPack('polaroid', this)">
                <div class="pack-img" style="background: linear-gradient(45deg, #833ab4, #fd1d1d)"></div>
                <div>${T_Safe('pack_polaroid')}</div>
            </div>
             <div class="pack-card" onclick="selectPack('ghibli', this)">
                <div class="pack-img" style="background: linear-gradient(45deg, #2980b9, #6dd5fa)"></div>
                <div>${T_Safe('pack_ghibli', '宫崎骏风')}</div>
            </div>
             <div class="pack-card" onclick="selectPack('pixar', this)">
                <div class="pack-img" style="background: linear-gradient(45deg, #ff9966, #ff5e62)"></div>
                <div>${T_Safe('pack_pixar', '皮克斯3D')}</div>
            </div>
        </div>

        <div class="gen-input-group">
            <label>${T_Safe('lbl_ref_img', '参考图 (可选)')}</label>
            <div class="upload-area" id="dropZone" onclick="document.getElementById('fileInput').click()">
                <input type="file" id="fileInput" accept="image/*" style="display:none" onchange="handleFileSelect(event)">
                <div id="uploadPlaceholder">
                    <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <div class="upload-hint">${T_Safe('hint_upload', '点击或拖拽图片到这里 (用于图生图)')}</div>
                </div>
                <img id="imagePreview" class="upload-preview" />
                <button class="clear-img-btn" id="clearImgBtn" onclick="clearImage(event)">×</button>
            </div>

            <label>${T_Safe('lbl_prompt')} <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">(${T_Safe('prompt_hint', '系统会自动组合主角与风格')})</span></label>
            <textarea id="promptInput" class="gen-textarea" placeholder="${T_Safe('ph_prompt')}"></textarea>
            <button id="genBtn" class="btn-primary" style="justify-content:center; padding: 12px;" onclick="generatePhoto()">
                ${T_Safe('btn_generate')}
            </button>
        </div>

        <!-- Result -->
        <div id="loading" style="display:none; text-align:center;">
             <span class="loader"></span>
             <p style="color:var(--text-muted)">${T_Safe('loading_gen')}</p>
        </div>

        <div id="result" class="result-display">
            <img id="generatedImage" class="result-img" src="" alt="AI Generated" />
            <div style="margin-top:16px;">
                <a id="downloadBtn" href="#" download="ai-photo.png" class="btn-secondary" style="display:inline-block; text-decoration:none;">
                    ${T_Safe('btn_download')}
                </a>
            </div>
        </div>
    </div>
  </div>

  <script>
    // Style Templates (Suffixes)
    // The placeholder {subject} will be replaced by the user selected subject
    const styles = {
        'professional': "{subject}, professional linkedin headshot, business suit, studio lighting, canon r5, 8k, bokeh, highly detailed face",
        'cyberpunk': "{subject}, cyberpunk city street at night, neon lights, futuristic clothing, reflections, wet pavement, high contrast, cinematic lighting",
        'graduation': "{subject} wearing academic regalia, holding diploma, university campus background, proud expression, soft natural lighting, realistic",
        'polaroid': "{subject}, polaroid vintage photo, flash photography, candid moment, grainy texture, 90s aesthetic, hard shadows",
        'ghibli': "{subject}, studio ghibli style, anime style, vibrant colors, summer sky, grassy field, detailed clouds, hand drawn",
        'pixar': "{subject}, pixar style 3d render, cute, big eyes, disney animation style, vibrant, 4k, octane render"
    };
    
    let currentStyle = '';

    function switchLanguage() {
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        window.location.reload();
    }

    function selectPack(key, cardEl) {
        // Update UI
        document.querySelectorAll('.pack-card').forEach(el => el.classList.remove('active'));
        if(cardEl) cardEl.classList.add('active');
        
        // Set Style
        currentStyle = key;
        const styleName = cardEl ? cardEl.querySelector('div:last-child').innerText : key;
        document.getElementById('selectedStyleName').innerText = styleName;

        updatePromptBuilder();
    }

    function updatePromptBuilder() {
        const subjectSelect = document.getElementById('subjectSelect');
        const subject = subjectSelect.value || "A person"; // Default fallback
        const input = document.getElementById('promptInput');

        if (!currentStyle) {
            // No style selected, just set subject if input is empty or simple
            // But we don't want to overwrite user custom text aggressively
            return; 
        }

        const template = styles[currentStyle];
        const finalPrompt = template.replace('{subject}', subject);

        input.value = finalPrompt;
        
        // Visual feedback
        input.style.borderColor = 'var(--accent-glow)';
        setTimeout(() => input.style.borderColor = '', 300);
    }

    let uploadedImageBase64 = null;

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) processFile(file);
    }

    // Drag and Drop
    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
    });

    function processFile(file) {
        if (!file.type.startsWith('image/')) return alert('Please upload an image file');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageBase64 = e.target.result; // Data URL
            document.getElementById('imagePreview').src = uploadedImageBase64;
            document.getElementById('imagePreview').style.display = 'inline-block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('clearImgBtn').style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    function clearImage(e) {
        e.stopPropagation();
        uploadedImageBase64 = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('uploadPlaceholder').style.display = 'block';
        document.getElementById('clearImgBtn').style.display = 'none';
    }

    async function generatePhoto() {
        const prompt = document.getElementById('promptInput').value.trim();
        if(!prompt && !uploadedImageBase64) return alert('Please enter a description or upload an image');

        const btn = document.getElementById('genBtn');
        const loader = document.getElementById('loading');
        const result = document.getElementById('result');
        const img = document.getElementById('generatedImage');
        const dl = document.getElementById('downloadBtn');

        // Reset UI
        result.classList.remove('active');
        btn.disabled = true;
        btn.style.opacity = '0.7';
        loader.style.display = 'block';

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: prompt,
                    image: uploadedImageBase64 // Send existing image if any (Img2Img)
                })
            });

            if(!res.ok) {
                throw new Error(await res.text() || 'Generation failed');
            }

            const data = await res.json();
            // Assuming API returns { image_url: "..." } or { image_base64: "..." }
            // Adjust based on actual API
            const src = data.image_url || data.url || data.image || ('data:image/png;base64,' + data.base64);
            
            img.onload = () => {
                loader.style.display = 'none';
                result.classList.add('active');
                btn.disabled = false;
                btn.style.opacity = '1';
                // Scroll to result
                result.scrollIntoView({ behavior: 'smooth' });
            };
            img.src = src;
            dl.href = src;

        } catch(e) {
            console.error(e);
            alert("${T_Safe('res_error')}: " + e.message);
            loader.style.display = 'none';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }
  </script>
</body>
</html>`;

    return new Response(html, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
}
