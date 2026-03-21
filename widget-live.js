(function(){
var cfg=window.TACFundiBot||{};
var KEY=cfg.apiKey||'';
var PROXY=cfg.proxyUrl||'';
var NAME=cfg.botName||'POPIA Assistant';
var GREET=cfg.greeting||'Hi! How can I help with POPIA compliance today?';
var COLOR=cfg.primaryColor||'#0D2240';
var ACCENT=cfg.accentColor||'#B8860B';
var POS=cfg.position||'bottom-right';
var MODEL=cfg.model||'gemini-2.0-flash';
var SYSTEM=cfg.systemPrompt||'You are a helpful POPIA compliance assistant for TACFundi. Answer questions about POPIA compliance for South African law firms and medical practices. Services: Audits R999-R3500, Monthly Retainer R599-R799/month, Staff Training R499/person. Free 30-min assessment at tacfundi.co.za. Phone: +27 71 975 1571.';

var history=[];
var open=false;
var greeted=false;
var busy=false;

var s=document.createElement('style');
s.textContent='#tcfw-btn{position:fixed;bottom:24px;'+(POS==='bottom-left'?'left':'right')+':24px;width:56px;height:56px;border-radius:50%;background:'+COLOR+';border:none;cursor:pointer;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;transition:transform .2s;}#tcfw-btn:hover{transform:scale(1.1);}#tcfw-box{position:fixed;bottom:92px;'+(POS==='bottom-left'?'left':'right')+':24px;width:340px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);z-index:999998;display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;border:1px solid #e2e8f0;}#tcfw-hdr{background:'+COLOR+';padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}#tcfw-hdr-av{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}#tcfw-hdr-info{flex:1;}#tcfw-hdr-info h4{margin:0;font-size:14px;font-weight:600;color:#fff;}#tcfw-hdr-info p{margin:0;font-size:11px;color:rgba(255,255,255,0.6);}#tcfw-cls{background:none;border:none;color:rgba(255,255,255,0.7);font-size:18px;cursor:pointer;padding:2px 4px;line-height:1;}#tcfw-cls:hover{color:#fff;}#tcfw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:180px;}#tcfw-msgs::-webkit-scrollbar{width:3px;}#tcfw-msgs::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px;}.tcfw-row{display:flex;gap:8px;align-items:flex-end;}.tcfw-row.u{flex-direction:row-reverse;}.tcfw-av{width:26px;height:26px;border-radius:7px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}.tcfw-av.b{background:'+COLOR+';color:'+ACCENT+';}.tcfw-av.u{background:'+ACCENT+';color:#000;}.tcfw-bbl{max-width:80%;padding:9px 13px;font-size:13px;line-height:1.5;border-radius:12px;word-break:break-word;}.tcfw-bbl.b{background:#f1f3f5;color:#2d3748;border-radius:3px 12px 12px 12px;}.tcfw-bbl.u{background:'+COLOR+';color:#fff;border-radius:12px 3px 12px 12px;}.tcfw-bbl.e{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}.tcfw-typing{display:flex;gap:4px;padding:10px 13px;background:#f1f3f5;border-radius:3px 12px 12px 12px;width:50px;}.tcfw-dot{width:6px;height:6px;border-radius:50%;background:#b0b8c4;animation:tcfwb 1.1s infinite;}.tcfw-dot:nth-child(2){animation-delay:.18s;}.tcfw-dot:nth-child(3){animation-delay:.36s;}@keyframes tcfwb{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}#tcfw-foot{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e2e8f0;flex-shrink:0;}#tcfw-inp{flex:1;border:1.5px solid #e2e8f0;border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;resize:none;background:#f9fafb;max-height:80px;line-height:1.4;transition:border-color .2s;}#tcfw-inp:focus{border-color:'+COLOR+';background:#fff;}#tcfw-inp::placeholder{color:#b0b8c4;}#tcfw-snd{width:36px;height:36px;border:none;border-radius:9px;background:'+COLOR+';cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s;}#tcfw-snd:hover{opacity:.85;}#tcfw-snd:disabled{opacity:.4;cursor:not-allowed;}#tcfw-brand{text-align:center;font-size:10px;color:#bbb;padding:3px 0 7px;flex-shrink:0;}@media(max-width:400px){#tcfw-box{width:calc(100vw - 16px);right:8px!important;left:8px!important;}}';
document.head.appendChild(s);

var btn=document.createElement('button');
btn.id='tcfw-btn';
btn.setAttribute('aria-label','Open chat');
btn.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
document.body.appendChild(btn);

var box=document.createElement('div');
box.id='tcfw-box';
box.innerHTML='<div id="tcfw-hdr"><div id="tcfw-hdr-av">TF</div><div id="tcfw-hdr-info"><h4>'+NAME+'</h4><p>Powered by TACFundi \xb7 Online</p></div><button id="tcfw-cls" aria-label="Close">\u2715</button></div><div id="tcfw-msgs" role="log" aria-live="polite"></div><div id="tcfw-foot"><textarea id="tcfw-inp" rows="1" placeholder="Ask about POPIA compliance..."></textarea><button id="tcfw-snd" aria-label="Send"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div><div id="tcfw-brand">Powered by <a href="https://tacfundi.co.za" target="_blank" style="color:'+ACCENT+';text-decoration:none;">TACFundi</a></div>';
document.body.appendChild(box);

var msgs=document.getElementById('tcfw-msgs');
var inp=document.getElementById('tcfw-inp');
var snd=document.getElementById('tcfw-snd');

function addMsg(text,role,err){
  var row=document.createElement('div');
  row.className='tcfw-row'+(role==='u'?' u':'');
  var av=document.createElement('div');
  av.className='tcfw-av '+role;
  av.textContent=role==='b'?'TF':'You';
  var bbl=document.createElement('div');
  bbl.className='tcfw-bbl '+role+(err?' e':'');
  if(role==='b'){
    bbl.innerHTML=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  } else {
    bbl.textContent=text;
  }
  row.appendChild(av);
  row.appendChild(bbl);
  msgs.appendChild(row);
  msgs.scrollTop=msgs.scrollHeight;
}

function showTyping(){
  var row=document.createElement('div');
  row.className='tcfw-row';
  row.id='tcfw-typing';
  var av=document.createElement('div');
  av.className='tcfw-av b';
  av.textContent='TF';
  var bbl=document.createElement('div');
  bbl.className='tcfw-typing';
  bbl.innerHTML='<div class="tcfw-dot"></div><div class="tcfw-dot"></div><div class="tcfw-dot"></div>';
  row.appendChild(av);
  row.appendChild(bbl);
  msgs.appendChild(row);
  msgs.scrollTop=msgs.scrollHeight;
}

function removeTyping(){
  var t=document.getElementById('tcfw-typing');
  if(t)t.remove();
}

function openBox(){
  open=true;
  box.style.display='flex';
  btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  if(!greeted){greeted=true;setTimeout(function(){addMsg(GREET,'b');inp.focus();},300);}
  else{setTimeout(function(){inp.focus();},100);}
}

function closeBox(){
  open=false;
  box.style.display='none';
  btn.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
}

btn.onclick=function(){open?closeBox():openBox();};
document.getElementById('tcfw-cls').onclick=closeBox;

function send(){
  var text=inp.value.trim();
  if(!text||busy)return;
  inp.value='';
  inp.style.height='auto';
  addMsg(text,'u');
  history.push({role:'user',content:text});
  busy=true;
  snd.disabled=true;
  showTyping();

  var p;
  if(PROXY){
    p=fetch(PROXY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history,system:SYSTEM,domain:window.location.hostname})}).then(function(r){return r.json();}).then(function(d){return d.reply||d.message||d.text||'No response.';});
  } else if(KEY){
    var contents=history.slice(-10).map(function(m){return {role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]};});
    p=fetch('https://generativelanguage.googleapis.com/v1beta/models/'+MODEL+':generateContent?key='+KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM}]},contents:contents,generationConfig:{maxOutputTokens:1024,temperature:0.7}})}).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error&&d.error.message?d.error.message:'API error '+r.status);var t=d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0]&&d.candidates[0].content.parts[0].text;if(!t)throw new Error('Empty response');return t;});});
  } else {
    p=Promise.resolve('Chat not configured. Contact tacfundi@zohomail.com or call +27 71 975 1571.');
  }

  p.then(function(reply){
    removeTyping();
    addMsg(reply,'b');
    history.push({role:'assistant',content:reply});
    if(history.length>20)history=history.slice(-20);
  }).catch(function(err){
    removeTyping();
    console.error('[TACFundi Widget Error]',err.message);
    addMsg('Sorry, something went wrong. Please call +27 71 975 1571 or email tacfundi@zohomail.com','b',true);
  }).then(function(){
    busy=false;
    snd.disabled=false;
    inp.focus();
  });
}

snd.onclick=send;
inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
inp.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px';});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open)closeBox();});
window.__tcfwAsk=function(q){if(!open)openBox();setTimeout(function(){inp.value=q;send();},400);};
})();
