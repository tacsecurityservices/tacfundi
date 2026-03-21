bash

cat /mnt/user-data/outputs/widget-live.js
Output

/**
 * TACFundi Live ChatBot Widget v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * LIVE AI chatbot — calls Claude API via your proxy or directly.
 *
 * USAGE on any website — paste before </body>:
 *
 *   <script>
 *   window.TACFundiBot = {
 *     // OPTION A: Use a proxy (recommended for client sites — hides API key)
 *     proxyUrl: 'https://your-proxy.vercel.app/api/chat',
 *
 *     // OPTION B: Direct API (fine for your own site, testing, or internal tools)
 *     apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  // Your Gemini API key from aistudio.google.com
 *
 *     // Bot config
 *     botName:      'POPIA Assistant',
 *     greeting:     'Hi! How can I help with your POPIA compliance today?',
 *     primaryColor: '#0D2240',
 *     accentColor:  '#B8860B',
 *     position:     'bottom-right',
 *     systemPrompt: 'You are a helpful assistant for...',  // optional override
 *   };
 *   </script>
 *   <script src="widget-live.js"></script>
 *
 * PROXY SETUP (Vercel — free tier):
 *   1. Create a new Vercel project
 *   2. Add file: /api/chat.js  (content below in comments)
 *   3. Add env var: ANTHROPIC_API_KEY = your key
 *   4. Deploy — use the /api/chat URL as proxyUrl above
 *
 * /api/chat.js content:
 *   export default async function handler(req, res) {
 *     res.setHeader('Access-Control-Allow-Origin', '*');
 *     res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
 *     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 *     if (req.method === 'OPTIONS') return res.status(200).end();
 *     const { messages, system } = req.body;
 *     const r = await fetch('https://api.anthropic.com/v1/messages', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'x-api-key': process.env.ANTHROPIC_API_KEY,
 *         'anthropic-version': '2023-06-01'
 *       },
 *       body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, system, messages })
 *     });
 *     const data = await r.json();
 *     res.json({ reply: data.content?.[0]?.text || 'Sorry, try again.' });
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var cfg = window.TACFundiBot || {};
  var PROXY      = cfg.proxyUrl    || '';
  var API_KEY    = cfg.apiKey      || '';
  var BOT_NAME   = cfg.botName     || 'POPIA Assistant';
  var GREETING   = cfg.greeting    || 'Hi! How can I help with your POPIA compliance today?';
  var PRIMARY    = cfg.primaryColor || '#0D2240';
  var ACCENT     = cfg.accentColor  || '#B8860B';
  var POSITION   = cfg.position     || 'bottom-right';
  var POWERED    = cfg.poweredBy    || 'TACFundi';

  var DEFAULT_SYSTEM = `You are a knowledgeable POPIA compliance assistant for TACFundi — South Africa's cybersecurity specialist for law firms and medical practices.

TACFundi services:
- POPIA Compliance Audit: R999–R3,500 (once-off)
- Monthly Retainer: R599–R799/month  
- Staff Security Training: R499/person

Free 30-minute assessment available at tacfundi.co.za
Contact: +27 71 975 1571 | tacfundi@zohomail.com
Registered — Information Regulator SA, Reg. No. 2026-003992

Answer POPIA questions clearly, in plain language. Recommend TACFundi services where relevant. Offer the free assessment. Never give specific legal advice.`;

  var SYSTEM = cfg.systemPrompt || DEFAULT_SYSTEM;

  if (!PROXY && !API_KEY) {
    console.warn('[TACFundi Widget] No proxyUrl or apiKey configured. Widget loaded but inactive.');
  }

  var history = [];
  var isLoading = false;
  var isOpen = false;
  var greeted = false;
  var sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);

  var posCSS = POSITION === 'bottom-right' ? 'right:20px;' : 'left:20px;';

  // ── CSS ────────────────────────────────────────────────────────────────────
  var css = `
    #tcf2-fab{position:fixed;${posCSS}bottom:24px;width:58px;height:58px;border-radius:50%;
      background:${PRIMARY};border:none;cursor:pointer;z-index:2147483647;
      box-shadow:0 4px 24px rgba(0,0,0,0.22),0 0 0 0 ${PRIMARY};
      display:flex;align-items:center;justify-content:center;
      transition:transform 0.22s,box-shadow 0.22s;animation:tcf2Pulse 3s infinite;}
    @keyframes tcf2Pulse{0%,100%{box-shadow:0 4px 24px rgba(0,0,0,0.22),0 0 0 0 rgba(13,34,64,0.4);}
      50%{box-shadow:0 4px 24px rgba(0,0,0,0.22),0 0 0 10px rgba(13,34,64,0);}}
    #tcf2-fab:hover{transform:scale(1.08);}
    #tcf2-fab.open{animation:none;}
    #tcf2-fab .ic-chat{transition:all 0.2s;}
    #tcf2-fab .ic-close{display:none;transition:all 0.2s;}
    #tcf2-fab.open .ic-chat{display:none;}
    #tcf2-fab.open .ic-close{display:block;}

    #tcf2-win{position:fixed;${posCSS}bottom:96px;width:360px;
      background:#fff;border-radius:18px;z-index:2147483646;
      box-shadow:0 12px 48px rgba(0,0,0,0.2);
      display:none;flex-direction:column;overflow:hidden;
      font-family:'Segoe UI','DM Sans',-apple-system,sans-serif;
      border:1px solid rgba(0,0,0,0.08);
      transform:translateY(16px) scale(0.97);opacity:0;
      transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.25s ease;
      max-height:min(580px,90vh);}
    #tcf2-win.open{display:flex;transform:translateY(0) scale(1);opacity:1;}

    #tcf2-hdr{background:${PRIMARY};padding:14px 16px;display:flex;align-items:center;gap:11px;flex-shrink:0;}
    #tcf2-av{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,0.13);
      border:1.5px solid rgba(184,134,11,0.35);display:flex;align-items:center;
      justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}
    #tcf2-hdr-info h4{font-size:14px;font-weight:600;color:white;margin:0 0 2px;}
    #tcf2-hdr-info p{font-size:11px;color:rgba(255,255,255,0.55);margin:0;display:flex;align-items:center;gap:5px;}
    .tcf2-online{width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block;}
    #tcf2-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.6);
      cursor:pointer;font-size:18px;padding:4px;transition:color 0.2s;line-height:1;}
    #tcf2-close:hover{color:white;}

    #tcf2-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;
      min-height:200px;scroll-behavior:smooth;}
    #tcf2-msgs::-webkit-scrollbar{width:3px;}
    #tcf2-msgs::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px;}

    .tcf2-row{display:flex;gap:8px;align-items:flex-end;animation:tcf2In 0.22s ease;}
    @keyframes tcf2In{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
    .tcf2-row.user{flex-direction:row-reverse;}
    .tcf2-av{width:28px;height:28px;border-radius:8px;flex-shrink:0;font-size:10px;font-weight:700;
      display:flex;align-items:center;justify-content:center;}
    .tcf2-av.bot{background:${PRIMARY};color:#d4a017;}
    .tcf2-av.user{background:${ACCENT};color:#000;}
    .tcf2-bubble{max-width:80%;padding:10px 14px;font-size:13px;line-height:1.55;border-radius:14px;word-break:break-word;}
    .tcf2-bubble.bot{background:#f1f3f5;color:#2d3748;border-radius:4px 14px 14px 14px;}
    .tcf2-bubble.user{background:${PRIMARY};color:white;border-radius:14px 4px 14px 14px;}
    .tcf2-bubble.err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .tcf2-bubble strong{font-weight:600;color:#1a2744;}
    .tcf2-bubble code{background:#e2e8f0;padding:1px 5px;border-radius:3px;font-size:11px;font-family:monospace;}
    .tcf2-bubble ul{padding-left:16px;margin:4px 0;}
    .tcf2-bubble li{margin-bottom:2px;}

    .tcf2-typing{display:flex;gap:4px;padding:12px 14px;background:#f1f3f5;
      border-radius:4px 14px 14px 14px;align-self:flex-start;width:54px;}
    .tcf2-dot{width:6px;height:6px;border-radius:50%;background:#b0b8c4;animation:tcf2b 1.1s infinite;}
    .tcf2-dot:nth-child(2){animation-delay:.18s;}
    .tcf2-dot:nth-child(3){animation-delay:.36s;}
    @keyframes tcf2b{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}

    .tcf2-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 12px;flex-shrink:0;}
    .tcf2-chip{background:#f1f3f5;border:1px solid #e2e8f0;border-radius:100px;padding:6px 12px;
      font-size:11px;font-weight:500;color:#2d3748;cursor:pointer;transition:all 0.15s;
      font-family:inherit;white-space:nowrap;}
    .tcf2-chip:hover{background:#e2e8f0;border-color:#cbd5e0;}

    #tcf2-inp-wrap{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;flex-shrink:0;}
    #tcf2-inp{flex:1;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 13px;
      font-size:13px;font-family:inherit;outline:none;resize:none;max-height:100px;
      transition:border-color 0.2s;line-height:1.45;background:#f8f9fa;}
    #tcf2-inp:focus{border-color:${PRIMARY};background:#fff;}
    #tcf2-inp::placeholder{color:#b0b8c4;}
    #tcf2-send{width:38px;height:38px;border:none;border-radius:10px;background:${PRIMARY};
      cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;
      transition:all 0.2s;}
    #tcf2-send:hover{background:${ACCENT};}
    #tcf2-send:disabled{opacity:0.45;cursor:not-allowed;}

    #tcf2-brand{text-align:center;font-size:10px;color:#c0c0c0;padding:4px 0 8px;flex-shrink:0;}
    #tcf2-brand a{color:${ACCENT};text-decoration:none;}

    @media(max-width:420px){
      #tcf2-win{width:calc(100vw - 20px);right:10px!important;left:10px!important;}
    }
  `;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── DOM ────────────────────────────────────────────────────────────────────
  var fab = document.createElement('button');
  fab.id = 'tcf2-fab';
  fab.setAttribute('aria-label', 'Open ' + BOT_NAME);
  fab.innerHTML = `
    <svg class="ic-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg class="ic-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;

  var win = document.createElement('div');
  win.id = 'tcf2-win';
  win.innerHTML = `
    <div id="tcf2-hdr">
      <div id="tcf2-av">TF</div>
      <div id="tcf2-hdr-info">
        <h4>${BOT_NAME}</h4>
        <p><span class="tcf2-online"></span> Powered by ${POWERED} · Online</p>
      </div>
      <button id="tcf2-close">✕</button>
    </div>
    <div id="tcf2-msgs" role="log" aria-live="polite"></div>
    <div class="tcf2-chips" id="tcf2-chips">
      <button class="tcf2-chip" onclick="window.__tcf2ask('What is a POPIA compliance audit?')">What is an audit?</button>
      <button class="tcf2-chip" onclick="window.__tcf2ask('How much does the monthly retainer cost?')">Retainer pricing</button>
      <button class="tcf2-chip" onclick="window.__tcf2ask('Book a free POPIA assessment')">Free assessment</button>
    </div>
    <div id="tcf2-inp-wrap">
      <textarea id="tcf2-inp" rows="1" placeholder="Ask about POPIA compliance..."></textarea>
      <button id="tcf2-send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <div id="tcf2-brand">Powered by <a href="https://tacfundi.co.za" target="_blank">${POWERED}</a></div>`;

  document.body.appendChild(fab);
  document.body.appendChild(win);

  var msgs   = document.getElementById('tcf2-msgs');
  var inp    = document.getElementById('tcf2-inp');
  var sendBtn = document.getElementById('tcf2-send');

  // ── Helpers ────────────────────────────────────────────────────────────────
  function addMsg(text, role, isErr) {
    var row = document.createElement('div');
    row.className = 'tcf2-row ' + role;
    var av = document.createElement('div');
    av.className = 'tcf2-av ' + role;
    av.textContent = role === 'bot' ? 'TF' : 'You';
    var bubble = document.createElement('div');
    bubble.className = 'tcf2-bubble ' + role + (isErr ? ' err' : '');
    if (role === 'bot') {
      bubble.innerHTML = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^• (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n/g, '<br>');
    } else {
      bubble.textContent = text;
    }
    row.appendChild(av);
    row.appendChild(bubble);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }

  function showTyping() {
    var row = document.createElement('div');
    row.className = 'tcf2-row bot';
    row.id = 'tcf2-typing';
    var av = document.createElement('div');
    av.className = 'tcf2-av bot';
    av.textContent = 'TF';
    var bubble = document.createElement('div');
    bubble.className = 'tcf2-typing';
    bubble.innerHTML = '<div class="tcf2-dot"></div><div class="tcf2-dot"></div><div class="tcf2-dot"></div>';
    row.appendChild(av); row.appendChild(bubble);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('tcf2-typing');
    if (el) el.remove();
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────
  function openWin() {
    isOpen = true;
    fab.classList.add('open');
    win.style.display = 'flex';
    win.offsetHeight; // force reflow
    win.classList.add('open');
    if (!greeted) {
      greeted = true;
      setTimeout(function () {
        addMsg(GREETING, 'bot');
        inp.focus();
      }, 320);
    } else {
      setTimeout(function () { inp.focus(); }, 100);
    }
  }

  function closeWin() {
    isOpen = false;
    fab.classList.remove('open');
    win.classList.remove('open');
    setTimeout(function () { if (!isOpen) win.style.display = 'none'; }, 300);
  }

  fab.addEventListener('click', function () { isOpen ? closeWin() : openWin(); });
  document.getElementById('tcf2-close').addEventListener('click', closeWin);

  // ── Send ───────────────────────────────────────────────────────────────────
  async function send() {
    var text = inp.value.trim();
    if (!text || isLoading) return;
    if (!PROXY && !API_KEY) {
      addMsg('Chat not configured. Please contact tacfundi@zohomail.com or call +27 71 975 1571.', 'bot', true);
      return;
    }

    // Hide chips after first message
    var chips = document.getElementById('tcf2-chips');
    if (chips) chips.style.display = 'none';

    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    inp.value = '';
    inp.style.height = 'auto';
    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      var reply;

      if (PROXY) {
        // ── Via proxy (hides API key) ──────────────────────────────────────
        var res = await fetch(PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            system: SYSTEM,
            sessionId: sessionId,
            domain: window.location.hostname
          })
        });
        var data = await res.json();
        reply = data.reply || data.message || data.response || data.text;

      } else {
        // ── Direct Gemini API call ────────────────────────────────────────
        var geminiContents = history.slice(-10).map(function(m) {
          return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
        });
        var model = cfg.model || 'gemini-2.0-flash';
        var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + API_KEY;
        var res2 = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM }] },
            contents: geminiContents,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
          })
        });
        var data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error?.message || 'Gemini API error ' + res2.status);
        reply = data2.candidates && data2.candidates[0] && data2.candidates[0].content && data2.candidates[0].content.parts && data2.candidates[0].content.parts[0] && data2.candidates[0].content.parts[0].text;
      }

      removeTyping();
      if (reply) {
        addMsg(reply, 'bot');
        history.push({ role: 'assistant', content: reply });
        if (history.length > 20) history = history.slice(-20);
      } else {
        addMsg('Sorry, I could not get a response. Please try again or contact us directly.', 'bot', true);
      }

    } catch (err) {
      removeTyping();
      addMsg('Connection error. Please try again or contact us: tacfundi@zohomail.com | +27 71 975 1571', 'bot', true);
      console.warn('[TACFundi Widget]', err);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      inp.focus();
    }
  }

  sendBtn.addEventListener('click', send);
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  inp.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Global function for chip buttons
  window.__tcf2ask = function (q) {
    inp.value = q;
    send();
  };

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (isOpen && !win.contains(e.target) && !fab.contains(e.target)) closeWin();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeWin();
  });

})();
