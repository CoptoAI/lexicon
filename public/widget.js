var CoptoLexWidget=(function(){"use strict";var T=Object.defineProperty;var $=(a,l,d)=>l in a?T(a,l,{enumerable:!0,configurable:!0,writable:!0,value:d}):a[l]=d;var p=(a,l,d)=>$(a,typeof l!="symbol"?l+"":l,d);const a=new Map,l=300;async function d(u,e,t="en"){const o=u.normalize("NFD").replace(/[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]/g,"").normalize("NFC").trim().toLowerCase();if(!o)return null;const n=`${o}:${t}`;if(a.has(n))return a.get(n);try{const r=`${e.replace(/\/$/,"")}/widget/lookup?word=${encodeURIComponent(o)}&lang=${t}`,c=await fetch(r,{method:"GET",headers:{Accept:"application/json"}});if(!c.ok)return null;const s=await c.json();if(s&&s.found){if(a.size>=l){const h=a.keys().next().value;h&&a.delete(h)}return a.set(n,s),s}return null}catch(i){return console.warn("[CoptoLex Widget] Lookup error:",i),null}}function b(u,e="S"){if(!u||typeof window=="undefined")return;let t=u.toLowerCase();t=t.replace(/ⲟⲩ/g,"oo"),t=t.replace(/ϯ/g,e==="B"?"dee":"tee"),t=t.replace(/ⲯ/g,"ps"),t=t.replace(/ⲝ/g,"ks"),t=t.replace(/ⲑ/g,"th"),t=t.replace(/ⲫ/g,"f"),t=t.replace(/ⲭ/g,"kh"),t=t.replace(/ϣ/g,"sh"),t=t.replace(/ϥ/g,"f"),t=t.replace(/ϧ|ⳉ/g,"kh"),t=t.replace(/ϩ/g,"h"),t=t.replace(/ϫ/g,e==="B"?"j":"ch"),t=t.replace(/ϭ/g,e==="B"?"ch":"k");const o={"ⲁ":"ah","ⲃ":e==="B"?"v":"b","ⲅ":"g","ⲇ":"d","ⲉ":"eh","ⲍ":"z","ⲏ":"ay","ⲓ":"ee","ⲕ":"k","ⲗ":"l","ⲙ":"m","ⲛ":"n","ⲟ":"o","ⲡ":"p","ⲣ":"r","ⲥ":"s","ⲧ":"t","ⲩ":"oo","ⲱ":"oh"};let n="";for(const i of t)o[i]!==void 0?n+=o[i]:/[a-z\s]/i.test(i)&&(n+=i);if(n=n.trim()||u,"speechSynthesis"in window)try{window.speechSynthesis.cancel();const i=new SpeechSynthesisUtterance(n);i.rate=.85,i.pitch=1;const r=window.speechSynthesis.getVoices(),c=r.find(s=>s.lang.startsWith("el")||s.lang.startsWith("it")||s.lang.startsWith("la")||s.lang.startsWith("es"))||r.find(s=>s.lang.startsWith("en"));c&&(i.voice=c),window.speechSynthesis.speak(i),window.speechSynthesis.paused&&window.speechSynthesis.resume();return}catch(i){}}const m={en:{loading:"Looking up Coptic word...",openInCoptoLex:"Open in CoptoLex",searchOnCoptoLex:"Search on CoptoLex ↗",noMatch:"No exact lexicon match found.",noDefinition:"No definition found.",listen:"Listen to pronunciation",greek:"🏛️ Greek",egyptian:"🏺 Egyptian",greekTitle:"Greek Loanword in Coptic",egyptianTitle:"Ancient Egyptian Heritage",stem:"Stem",from:"from"},ar:{loading:"جاري البحث عن الكلمة القبطية...",openInCoptoLex:"افتح في CoptoLex",searchOnCoptoLex:"ابحث في CoptoLex ↗",noMatch:"لم يتم العثور على تطابق معجمي دقيق.",noDefinition:"لم يتم العثور على تعريف.",listen:"استمع إلى النطق",greek:"🏛️ يوناني",egyptian:"🏺 مصري",greekTitle:"لفظ دخيل من اليونانية إلى القبطية",egyptianTitle:"أصل مصري قديم",stem:"الأصل",from:"من"},de:{loading:"Koptisches Wort wird nachgeschlagen...",openInCoptoLex:"In CoptoLex öffnen",searchOnCoptoLex:"Auf CoptoLex suchen ↗",noMatch:"Kein genauer Wörterbucheintrag gefunden.",noDefinition:"Keine Definition gefunden.",listen:"Aussprache anhören",greek:"🏛️ Griechisch",egyptian:"🏺 Ägyptisch",greekTitle:"Griechisches Lehnwort im Koptischen",egyptianTitle:"Altägyptisches Erbe",stem:"Stamm",from:"aus"},fr:{loading:"Recherche du mot copte...",openInCoptoLex:"Ouvrir dans CoptoLex",searchOnCoptoLex:"Rechercher sur CoptoLex ↗",noMatch:"Aucune correspondance exacte trouvée.",noDefinition:"Aucune définition trouvée.",listen:"Écouter la prononciation",greek:"🏛️ Grec",egyptian:"🏺 Égyptien",greekTitle:"Emprunt grec en copte",egyptianTitle:"Héritage égyptien ancien",stem:"Radical",from:"de"}};class w{constructor(e){p(this,"host",null);p(this,"shadow",null);p(this,"popover",null);p(this,"config");p(this,"hideTimeout",null);p(this,"currentTarget",null);this.config=e,this.initShadowDOM()}getLabels(){const e=this.config.lang||"en";return m[e]||m.en}updateConfig(e){this.config={...this.config,...e},this.applyTheme()}initShadowDOM(){if(typeof document=="undefined")return;let e=document.getElementById("coptolex-widget-host");e||(e=document.createElement("div"),e.id="coptolex-widget-host",e.style.position="absolute",e.style.top="0",e.style.left="0",e.style.width="100%",e.style.height="0",e.style.overflow="visible",e.style.pointerEvents="none",e.style.zIndex=String(this.config.zIndex||999999),document.body.appendChild(e)),this.host=e,this.shadow=this.host.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent=this.getStyles(),this.shadow.appendChild(t),this.popover=document.createElement("div"),this.popover.className="coptolex-popover hidden",this.popover.setAttribute("role","dialog"),this.popover.setAttribute("aria-label","Coptic Word Definition"),this.shadow.appendChild(this.popover),this.popover.addEventListener("mouseenter",()=>{this.hideTimeout&&(clearTimeout(this.hideTimeout),this.hideTimeout=null)}),this.popover.addEventListener("mouseleave",()=>{this.config.mode==="hover"&&this.hideWithDelay(250)}),this.applyTheme()}applyTheme(){if(!this.popover)return;const e=this.config.theme==="dark"||this.config.theme==="auto"&&typeof window!="undefined"&&window.matchMedia("(prefers-color-scheme: dark)").matches;this.popover.setAttribute("data-theme",e?"dark":"light")}showLoading(e){if(this.hideTimeout&&(clearTimeout(this.hideTimeout),this.hideTimeout=null),!this.popover)return;const t=this.getLabels();this.applyTheme(),this.popover.innerHTML=`
      <div class="coptolex-loading">
        <div class="coptolex-spinner">ⲁ</div>
        <span>${t.loading}</span>
      </div>
    `,this.positionPopover(e),this.popover.classList.remove("hidden"),this.popover.classList.add("visible")}showResult(e,t){if(this.hideTimeout&&(clearTimeout(this.hideTimeout),this.hideTimeout=null),!this.popover)return;const o=this.getLabels();this.applyTheme();const n=(e.dialects||[]).map(g=>`<span class="coptolex-badge coptolex-dialect">${g}</span>`).join(""),i=e.origin==="greek"?`<span class="coptolex-badge coptolex-origin-greek" title="${o.greekTitle}">${o.greek}</span>`:`<span class="coptolex-badge coptolex-origin-egyptian" title="${o.egyptianTitle}">${o.egyptian}</span>`,r=e.matched_stem&&e.original_query&&e.matched_stem!==e.original_query.toLowerCase().trim()?`<div class="coptolex-morph-hint">${o.stem}: <strong>${e.matched_stem}</strong> (${o.from} <em>${e.original_query}</em>)</div>`:"",c=e.etym?`<div class="coptolex-etym">✨ ${this.sanitizeDefinitionHtml(e.etym)}</div>`:"",s=this.config.audio?`
        <button class="coptolex-audio-btn" id="coptolex-audio-trigger" title="${o.listen}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      `:"",h=e.url||`https://lexicon.copto.org/?q=${encodeURIComponent(e.coptic_name||"")}`;if(this.popover.innerHTML=`
      <div class="coptolex-card">
        <div class="coptolex-header">
          <div class="coptolex-word-row">
            <span class="coptolex-headword">${this.escapeHtml(e.coptic_name||"")}</span>
            ${s}
            ${e.ipa?`<span class="coptolex-ipa">${this.escapeHtml(e.ipa)}</span>`:""}
          </div>
          <div class="coptolex-badges">
            ${e.pos?`<span class="coptolex-badge coptolex-pos">${this.escapeHtml(e.pos)}</span>`:""}
            ${i}
            ${n}
          </div>
        </div>

        ${r}

        <div class="coptolex-body">
          <div class="coptolex-definition ${/[\u0600-\u06FF\u0750-\u077F]/.test(e.definition||"")?"coptolex-arabic":""}" ${/[\u0600-\u06FF\u0750-\u077F]/.test(e.definition||"")?'dir="rtl"':""}>
            ${this.sanitizeDefinitionHtml(e.definition||o.noDefinition)}
          </div>
          ${c}
        </div>

        <div class="coptolex-footer">
          <a href="${h}" target="_blank" rel="noopener noreferrer" class="coptolex-link">
            <span>${o.openInCoptoLex}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    `,this.config.audio){const g=this.popover.querySelector("#coptolex-audio-trigger");g&&e.coptic_name&&g.addEventListener("click",L=>{var x,v;L.stopPropagation();const C=(x=e.dialects)!=null&&x.includes("B")&&!((v=e.dialects)!=null&&v.includes("S"))?"B":"S";b(e.coptic_name,C)})}this.positionPopover(t),this.popover.classList.remove("hidden"),this.popover.classList.add("visible")}showNotFound(e,t){if(!this.popover)return;const o=this.getLabels();this.applyTheme();const n=`https://lexicon.copto.org/?q=${encodeURIComponent(e)}`;this.popover.innerHTML=`
      <div class="coptolex-card">
        <div class="coptolex-header">
          <span class="coptolex-headword">${this.escapeHtml(e)}</span>
        </div>
        <div class="coptolex-body">
          <p style="margin:0; font-size:13px; color:var(--text-muted);">${o.noMatch}</p>
        </div>
        <div class="coptolex-footer">
          <a href="${n}" target="_blank" rel="noopener noreferrer" class="coptolex-link">
            <span>${o.searchOnCoptoLex}</span>
          </a>
        </div>
      </div>
    `,this.positionPopover(t),this.popover.classList.remove("hidden"),this.popover.classList.add("visible")}hide(){this.hideTimeout&&(clearTimeout(this.hideTimeout),this.hideTimeout=null),this.popover&&(this.popover.classList.remove("visible"),this.popover.classList.add("hidden"))}hideWithDelay(e=250){this.hideTimeout&&clearTimeout(this.hideTimeout),this.hideTimeout=window.setTimeout(()=>{this.hide()},e)}positionPopover(e){if(!this.popover)return;const t=Math.min(320,window.innerWidth-24);this.popover.style.width=`${t}px`;const o=window.pageXOffset||document.documentElement.scrollLeft||0,n=window.pageYOffset||document.documentElement.scrollTop||0;let i=e.left+e.width/2-t/2+o;i=Math.max(o+12,Math.min(i,o+window.innerWidth-t-12));const r=160,c=e.top,s=window.innerHeight-e.bottom;let h=0;s>=r||s>=c?(h=e.bottom+n+8,this.popover.setAttribute("data-placement","bottom")):(h=e.top+n-r-8,this.popover.setAttribute("data-placement","top")),this.popover.style.left=`${Math.round(i)}px`,this.popover.style.top=`${Math.round(h)}px`}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}sanitizeDefinitionHtml(e){return e?e.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,"").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,"").replace(/on\w+="[^"]*"/gi,"").replace(/on\w+='[^']*'/gi,"").replace(/javascript:[^"']*/gi,""):""}getStyles(){return`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

      @font-face {
        font-family: 'Antinoou';
        src: local('Antinoou'), local('Antinoou Coptic'),
             url('https://lexicon.copto.org/fonts/Antinoou.woff2') format('woff2'),
             url('https://lexicon.copto.org/fonts/Antinoou.woff') format('woff'),
             url('https://lexicon.copto.org/fonts/Antinoou.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }

      :host {
        all: initial;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      }

      .coptolex-popover {
        position: absolute;
        pointer-events: auto;
        box-sizing: border-box;
        border-radius: 12px;
        box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 999999;
        line-height: 1.4;
      }

      .coptolex-popover.hidden {
        opacity: 0;
        transform: translateY(4px) scale(0.97);
        pointer-events: none;
      }

      .coptolex-popover.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      /* Dark Theme (Obsidian Gold) */
      .coptolex-popover[data-theme="dark"] {
        --bg: #121824;
        --bg-elevated: #1a2233;
        --text: #f1f5f9;
        --text-muted: #94a3b8;
        --gold: #d4af37;
        --border: rgba(212, 175, 55, 0.25);
        --border-subtle: rgba(255, 255, 255, 0.08);
        background: rgba(18, 24, 36, 0.96);
        backdrop-filter: blur(12px);
        color: var(--text);
        border: 1px solid var(--border);
      }

      /* Light Theme (Papyrus Linen) */
      .coptolex-popover[data-theme="light"] {
        --bg: #fbf9f4;
        --bg-elevated: #f3ede2;
        --text: #1e293b;
        --text-muted: #64748b;
        --gold: #b38600;
        --border: rgba(179, 134, 0, 0.3);
        --border-subtle: rgba(0, 0, 0, 0.08);
        background: rgba(251, 249, 244, 0.98);
        backdrop-filter: blur(12px);
        color: var(--text);
        border: 1px solid var(--border);
      }

      .coptolex-card {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .coptolex-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-bottom: 1px solid var(--border-subtle);
        padding-bottom: 8px;
      }

      .coptolex-word-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .coptolex-headword {
        font-family: 'Antinoou', 'Segoe UI Historic', 'Athena', sans-serif;
        font-size: 20px;
        font-weight: bold;
        color: var(--gold);
        letter-spacing: 0.5px;
      }

      .coptolex-ipa {
        font-family: ui-monospace, monospace;
        font-size: 11px;
        color: var(--text-muted);
      }

      .coptolex-audio-btn {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        color: var(--gold);
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
      }

      .coptolex-audio-btn:hover {
        transform: scale(1.1);
        background: var(--gold);
        color: #0c0f17;
      }

      .coptolex-badges {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .coptolex-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .coptolex-pos {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }

      .coptolex-dialect {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
        border: 1px solid rgba(168, 85, 247, 0.3);
      }

      .coptolex-origin-egyptian {
        background: rgba(212, 175, 55, 0.15);
        color: var(--gold);
        border: 1px solid var(--border);
      }

      .coptolex-origin-greek {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      .coptolex-morph-hint {
        font-size: 11px;
        color: var(--text-muted);
        background: var(--bg-elevated);
        padding: 4px 8px;
        border-radius: 4px;
      }

      .coptolex-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .coptolex-definition {
        font-size: 13px;
        font-weight: 500;
        color: var(--text);
      }

      .coptolex-definition.coptolex-arabic {
        font-family: 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', -apple-system, sans-serif;
        text-align: right;
        direction: rtl;
        font-size: 14px;
        line-height: 1.6;
      }

      .coptolex-etym {
        font-size: 11px;
        color: var(--text-muted);
        font-style: italic;
      }

      .coptolex-footer {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid var(--border-subtle);
        padding-top: 6px;
        margin-top: 2px;
      }

      .coptolex-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
        color: var(--gold);
        text-decoration: none;
        transition: opacity 0.15s ease;
      }

      .coptolex-link:hover {
        opacity: 0.8;
        text-decoration: underline;
      }

      .coptolex-loading {
        padding: 18px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text-muted);
        font-size: 12px;
      }

      .coptolex-spinner {
        font-family: 'Antinoou', sans-serif;
        font-size: 20px;
        color: var(--gold);
        animation: pulse 1s infinite alternate;
      }

      @keyframes pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        100% { transform: scale(1.15); opacity: 1; }
      }
    `}}const y=/[\u2C80-\u2CFF\u03E2-\u03EF\u0370-\u03FF]/;class k{constructor(){p(this,"config");p(this,"ui");p(this,"scannedElements",new WeakSet);p(this,"activeLookupWord",null);this.config=this.parseConfig(),this.ui=new w(this.config),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.init()):this.init()}parseConfig(){var i,r;let e=null;typeof document!="undefined"&&(e=document.currentScript||document.querySelector('script[src*="widget.js"]'));const t=(c,s)=>e&&(e.getAttribute(c)||e.getAttribute(`data-${c}`))||s,o=typeof window!="undefined"&&window.CoptoLexWidgetConfig||{},n=typeof window!="undefined"&&window.location.hostname==="localhost"?`${window.location.origin}/api`:"https://lexicon.copto.org/api";return{theme:t("theme",o.theme||"auto"),lang:t("lang",o.lang||"en"),mode:t("mode",o.mode||"hover"),audio:t("audio",String((i=o.audio)!=null?i:"true"))!=="false",selectionLookup:t("selection-lookup",String((r=o.selectionLookup)!=null?r:"true"))!=="false",selector:t("selector",o.selector||".coptic, [data-coptic], [data-coptic-lemma], coptic-word, coptic"),apiUrl:t("api-url",o.apiUrl||n),zIndex:parseInt(t("z-index",String(o.zIndex||999999)),10)}}init(){this.scanDocument(),this.setupMutationObserver(),this.config.selectionLookup&&this.setupSelectionListener(),document.addEventListener("click",e=>{const t=e.target;!t.closest("#coptolex-widget-host")&&!t.closest(this.config.selector)&&this.ui.hide()})}scanDocument(e=document){try{e.querySelectorAll(this.config.selector).forEach(o=>this.bindElement(o))}catch(t){console.warn("[CoptoLex Widget] Scanner error:",t)}}setupMutationObserver(){if(typeof MutationObserver=="undefined")return;new MutationObserver(t=>{let o=!1;for(const n of t)if(n.addedNodes.length>0){o=!0;break}o&&this.scanDocument()}).observe(document.body,{childList:!0,subtree:!0})}bindElement(e){if(!this.scannedElements.has(e))if(this.scannedElements.add(e),e.style.cursor="help",e.style.textDecoration="underline dotted var(--accent-gold, #d4af37)",this.config.mode==="hover"){let t=null;e.addEventListener("mouseenter",()=>{t=window.setTimeout(()=>{this.triggerLookup(e)},150)}),e.addEventListener("mouseleave",()=>{t&&clearTimeout(t),this.ui.hideWithDelay(250)})}else e.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.triggerLookup(e)})}async triggerLookup(e){const o=(e.getAttribute("data-coptic-lemma")||e.getAttribute("data-coptic")||e.innerText||e.textContent||"").trim();if(!o)return;const n=e.getBoundingClientRect();this.activeLookupWord=o,this.ui.showLoading(n);const i=await d(o,this.config.apiUrl,this.config.lang);this.activeLookupWord===o&&(i&&i.found?this.ui.showResult(i,n):this.ui.showNotFound(o,n))}setupSelectionListener(){let e=null;document.addEventListener("mouseup",()=>{e&&clearTimeout(e),e=window.setTimeout(()=>{const t=window.getSelection();if(!t||t.isCollapsed)return;const o=t.toString().trim();if(o&&o.length<=30&&y.test(o)){const i=t.getRangeAt(0).getBoundingClientRect();i.width>0&&i.height>0&&(this.activeLookupWord=o,this.ui.showLoading(i),d(o,this.config.apiUrl,this.config.lang).then(r=>{this.activeLookupWord===o&&(r&&r.found?this.ui.showResult(r,i):this.ui.showNotFound(o,i))}))}},200)})}lookup(e,t){const o=t instanceof DOMRect?t:t.getBoundingClientRect();this.activeLookupWord=e,this.ui.showLoading(o),d(e,this.config.apiUrl,this.config.lang).then(n=>{n&&n.found?this.ui.showResult(n,o):this.ui.showNotFound(e,o)})}hide(){this.ui.hide()}configure(e){this.config={...this.config,...e},this.ui.updateConfig(e)}}let f=null;return typeof window!="undefined"&&(f=new k,window.CoptoLexWidget=f),f})();
