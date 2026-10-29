/* Atelier Studio v30.23 — Built-in Template Manager for GitHub Pages.
   Nothing is sent to GitHub without clicking Publish. No Backblaze calls.
   GitHub token is accepted per publish in volatile JS memory, never stored. */
(function(){
'use strict';
const ROOT='templates/';
const DBKEY='atelier:template-manager:draft';
const TM={active:false,backup:null, name:'',slug:'',category:'Business',preview:null,repo:'digitalhauss/Web-Builder',branch:'main',folder:'', lastPackage:null, state:'Ready',busy:false,published:[]};
const priorScheduleSave=scheduleSave;
const priorSaveNow=saveNow;
const copy=v=>structuredClone(v);
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeSlug=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64);
const info=msg=>{TM.state=msg;const el=document.querySelector('#tm-status');if(el)el.textContent=msg;};
const btn=(id,name,klass='')=>`<button type="button" data-tm="${id}" class="tm-btn ${klass}">${name}</button>`;
const d=()=>document.querySelector('#tm-modal');
function navButton(){
 const top=document.querySelector('#top');if(top&&!top.querySelector('[data-tm="open"]')){
  const b=document.createElement('button');b.className='btn';b.textContent='▤ Template Manager';b.dataset.tm='open';b.title='Manage internal templates · Manual save only';
  const a=top.querySelector('[data-a="projects"]');a?.insertAdjacentElement('afterend',b);
 }
 const hub=document.querySelector('#st28-content');
 if(hub&&ST28.screen==='templates'&&!hub.querySelector('[data-tm="open"]')){
  const b=document.createElement('button');b.type='button';b.className='tm-btn tm-primary tm-hub-button';b.dataset.tm='open';
  b.textContent='✦ Template Manager · Publish GitHub';
  b.title='Kelola template bawaan; simpan draft manual; publish GitHub tanpa B2';
  const heading=hub.querySelector('.st-section-title');
  const personal=heading?.querySelector('[data-st="save-current-template"]');
  if(heading){
   let actions=heading.querySelector('.tm-hub-actions');
   if(!actions){actions=document.createElement('div');actions.className='tm-hub-actions';heading.append(actions);}
   if(personal)actions.append(personal);
   actions.prepend(b);
  }else hub.prepend(b);
  if(!hub.querySelector('.tm-hub-explain')){
    const note=document.createElement('p');note.className='tm-hub-explain';
    note.innerHTML='<b>Template lokal</b> disimpan di browser. <b>Template bawaan</b> baru masuk GitHub hanya saat kamu klik Publish. Edit biasa <b>tidak</b> otomatis upload ke GitHub ataupun Backblaze.';
    (heading||hub).insertAdjacentElement('afterend',note);
  }
 }
}
function floating(){
 let e=document.querySelector('#tm-mode-bar');
 if(!TM.active){e?.remove();return}
 if(!e){e=document.createElement('div');e.id='tm-mode-bar';document.body.append(e)}
 e.innerHTML='<span>✦ TEMPLATE MODE · no autosave</span>'+btn('open','Manager')+btn('draft','Save Draft')+btn('exit','Exit');
}
function modal(){
 if(!d()){const e=document.createElement('div');e.id='tm-modal';document.body.append(e)}
 d().innerHTML=`<div class="tm-backdrop" data-tm="close"></div><section class="tm-panel" role="dialog" aria-modal="true" aria-label="Template Manager">
 <header class="tm-header"><div><span class="tm-eyebrow">ATELIER STUDIO · BUILT-IN LIBRARY</span><h2>Template Manager</h2><p>Simpan draft manual · Publish ke GitHub hanya ketika diklik · Aset bawaan bukan di Backblaze</p></div>${btn('close','×','tm-x')}</header>
 <div class="tm-content"><div class="tm-pill">${TM.active?'Template editing · Autosave OFF':'Editor in normal project mode'}</div>
 <div class="tm-card"><h3>1 · Template workspace</h3><p>Mulai dari proyek yang sedang terbuka, atau lanjutkan draft lokal. Saat mulai, editor membuat salinan sementara. Proyek asal tetap aman.</p>
 <div class="tm-actions">${btn('start','Edit as Built-in Template','tm-primary')}${btn('load','Load Saved Draft')}${btn('delete-draft','Delete Saved Draft','tm-danger')}${btn('import','Import .atelier.json')}</div>
 <input id="tm-import" type="file" accept=".json,.atelier.json,application/json" hidden/>
 <p class="tm-tip">Saat Template Mode aktif, tidak ada autosave, upload B2, atau commit GitHub. Edit bebas lalu klik Save Draft atau Publish. Proyek biasa tetap menyimpan edit lokal di browser.</p></div>
 <div class="tm-card"><h3>2 · Metadata</h3><div class="tm-fields"><label>Nama template<input id="tm-name" value="${escapeHTML(TM.name||S.doc?.name||'New Template')}" placeholder="Luxury Fashion"></label><label>Kategori<input id="tm-category" value="${escapeHTML(TM.category)}" placeholder="Business"></label><label>Slug / ID<input id="tm-slug" value="${escapeHTML(TM.slug)}" placeholder="luxury-fashion"></label></div>
 <div class="tm-actions">${btn('draft','Save Draft (manual)','tm-primary')}${btn('package','Download Template ZIP Package')}${btn('validate','Validate')}</div>
 <p class="tm-tip">Draft tersimpan hanya di browser ini. Tidak ada upload atau sinkronisasi otomatis.</p></div>
 <div class="tm-card"><h3>3 · Publish to GitHub</h3><p>Setiap klik Publish menghasilkan satu commit yang berisi manifest, template JSON, thumbnail dan aset internal. GitHub Pages akan memperbarui situs lewat deployment otomatis yang sudah dikonfigurasi.</p>
 <div class="tm-fields"><label>Repository (owner/repo)<input id="tm-repo" autocomplete="off" placeholder="username/atelier" value="${escapeHTML(TM.repo)}"></label><label>Branch Pages<input id="tm-branch" value="${escapeHTML(TM.branch)}" placeholder="main"></label><label>Folder Pages (opsional)<input id="tm-folder" value="${escapeHTML(TM.folder)}" placeholder="kosong untuk root, atau docs"></label><label>Fine-grained GitHub token (Contents: Read and write)<input id="tm-token" type="password" autocomplete="off" spellcheck="false" placeholder="ghp_… / github_pat_…"></label></div>
 <div class="tm-actions">${btn('publish','Publish to GitHub','tm-primary')}</div><p class="tm-tip">Token hanya dipakai untuk permintaan publish ini, tidak disimpan dalam file, localStorage, draft, atau repository. Pastikan repository dan branch memang menjadi sumber GitHub Pages.</p></div>
 <div class="tm-card"><h3>4 · Manage Published Templates</h3><p>Hapus dari galeri dengan <b>Unpublish</b> (file aset tetap aman), atau hapus semua file template dengan <b>Delete Permanently</b> (bisa memutus gambar pada proyek lama).</p>
 <div class="tm-actions">${btn('list-published','Load Published from GitHub')}</div>
 <div id="tm-published-list" class="tm-published-list"><p class="tm-tip">Masukkan repository, branch, folder dan token di bagian Publish terlebih dahulu, lalu muat daftar ini. Template lama bawaan yang tertanam di index.html dilindungi dari penghapusan.</p></div>
 </div>
 <div id="tm-status" role="status" class="tm-status">${escapeHTML(TM.state)}</div></div>
 </section>`;
 d().style.display='block';
}
function readForm(){
 const f=id=>document.getElementById('tm-'+id)?.value.trim();
 if(d()){
  TM.name=f('name')||TM.name||S.doc?.name||'New Template';
  TM.slug=safeSlug(f('slug')||TM.name);TM.category=f('category')||'Business';
  TM.repo=f('repo')||TM.repo;TM.branch=f('branch')||'main';TM.folder=(f('folder')||'').replace(/^\/+|\/+$/g,'');
 }
 if(!TM.slug)throw Error('Masukkan nama atau slug template.');
 if(TM.folder&&!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(TM.folder))throw Error('Folder Pages tidak valid.');
 return TM;
}
function noAutoSave(){S.dirty=true;S.saved='Template · unsaved (manual)';syncTop()}
scheduleSave=function(){if(TM.active){noAutoSave();return}return priorScheduleSave.apply(this,arguments)};
saveNow=async function(){if(TM.active){noAutoSave();return false}return priorSaveNow.apply(this,arguments)};
const priorCloudSave=v24CloudSave;
v24CloudSave=async function(...args){if(TM.active)return false;return priorCloudSave.apply(this,args)};
const priorRenderTop=renderTop;
renderTop=function(...args){const x=priorRenderTop(...args);const tag=document.querySelector('#top .v24-version');if(tag)tag.textContent='v30.25 · Templates';const personal=document.querySelector('#top [data-a="st28-save-template"]');if(personal){personal.textContent='Save to My Templates';personal.title='Personal saved templates. For internal GitHub templates, use Template Manager.'}navButton();floating();return x};
const priorHub=st28Render;
st28Render=async function(...args){
 const x=await priorHub(...args);navButton();
 if(['templates','home'].includes(ST28.screen)){
  const root=document.querySelector('#st28-content');const q=(ST28.query||'').toLowerCase().trim();
  const list=TEMPLATES.filter(t=>t.data?.doc&&(!q||(t.name+' '+t.cat).toLowerCase().includes(q)));
  if(root&&list.length){
   const html='<section class="tm-hub-templates"><h2>Built-in · GitHub templates</h2><p>Editable · Desktop, Tablet, HP · internal assets (no B2)</p><div class="tm-hub-grid">'+list.map(t=>{
    const cover=t.id==='builtin-digital-haus'||t.data.id==='digital-haus-lavender-white'?ROOT+'digital-haus/cover.webp':ROOT+t.data.id+'/cover.svg';return `<article><img loading="lazy" alt="Template cover" src="${escapeHTML(cover)}"><h3>${escapeHTML(t.name)}</h3><small>${escapeHTML(t.cat)} · ${t.data.doc.pages.length} pages</small><button type="button" class="tm-btn tm-primary" data-tm-use="${escapeHTML(t.id)}">Use Template</button></article>`;
   }).join('')+'</div></section>';
   root.insertAdjacentHTML('beforeend',html);
  }
 }
 return x;
};
async function begin(){
 if(TM.active){info('Sudah dalam mode template.');d().style.display='none';return}
 // Ensure original project is captured before entering a non-saving sandbox.
 await priorSaveNow();
 TM.backup={doc:S.doc,assets:S.assets,videos:S.videos,fonts:S.fonts,music:S.music,pid:S.pid,pageId:S.pageId,saved:S.saved,dirty:S.dirty,undo:S.undo,redo:S.redo};
 S.doc=copy(S.doc);S.assets=copy(S.assets||[]);S.videos=copy(S.videos||[]);S.fonts=copy(S.fonts||[]);S.undo=[];S.redo=[];
 TM.active=true;TM.name=TM.name||S.doc.name||'New Template';TM.slug=TM.slug||safeSlug(TM.name);
 clearTimeout(S.saveTimer);S.saveTimer=null;clearTimeout(CLOUD24.timer);CLOUD24.pending=false;S.saved='Template Mode · manual only';S.dirty=false;
 renderAll();floating();d().style.display='none';toast('Template Mode: NO autosave. Use Save Draft or Publish.');
}
function exit(){
 if(!TM.active){d()?.remove();return}
 if(S.dirty&&!confirm('Keluar dari Template Mode? Perubahan yang belum disimpan sebagai draft akan hilang.'))return;
 const b=TM.backup;TM.active=false;TM.backup=null;
 Object.assign(S,b);renderAll();floating();d()?.remove();toast('Kembali ke project asal; template edit mode ditutup');
}
async function saveDraft(){
 readForm();if(!TM.active)throw Error('Klik Edit as Built-in Template terlebih dahulu.');
 if(!idb.db)await idb.open();if(!idb.db)throw Error('Browser ini tidak mendukung IndexedDB. Gunakan Download Package untuk backup.');
 const payload={name:TM.name,slug:TM.slug,category:TM.category,doc:copy(S.doc),assets:copy(S.assets),videos:copy(S.videos||[]),fonts:copy(S.fonts||[]),music:S.music};
 const serialized=await a29MakeLocalPayload(payload);
 await idb.set(DBKEY,serialized);
 S.dirty=false;S.saved='Template draft saved manually';syncTop();info('Draft disimpan manual di browser ini. Tidak ada upload GitHub/B2.');
}
async function deleteDraft(){
 if(!idb.db)await idb.open();
 if(!idb.db)throw Error('Penyimpanan draft browser tidak tersedia.');
 const raw=await idb.get(DBKEY);
 if(!raw){info('Tidak ada draft yang tersimpan di browser ini.');return}
 if(!confirm('Hapus draft Template Manager dari browser ini? Penghapusan tidak bisa dibatalkan. Template yang sudah publish di GitHub tidak akan terhapus.'))return;
 await idb.del(DBKEY);
 info('Draft lokal dihapus. Proyek yang sedang terbuka dan template GitHub tidak berubah.');
}
async function loadDraft(){
 if(!idb.db)await idb.open();const raw=idb.db&&await idb.get(DBKEY);
 if(!raw)throw Error('Belum ada draft Template Manager pada browser ini.');
 let j=JSON.parse(raw);await a29HydrateLocal(j);
 if(!TM.active)await begin();
 TM.name=j.name;TM.slug=j.slug;TM.category=j.category;S.doc=j.doc;S.assets=j.assets||[];S.videos=j.videos||[];S.fonts=j.fonts||[];S.music=j.music||null;S.pageId=S.doc.pages?.[0]?.id;
 S.undo=[];S.redo=[];S.dirty=false;S.saved='Draft loaded · manual save';renderAll();floating();modal();info('Draft berhasil dimuat. Autosave tetap OFF.');
}
async function importJSON(file){
 if(!file||file.size>50*1024*1024)throw Error('File JSON terlalu besar (>50 MB).');
 const j=JSON.parse(await file.text());if(!j.doc?.pages?.length)throw Error('Harus file proyek .atelier.json / native JSON dengan doc.pages.');
 if(!TM.active)await begin();
 S.doc=copy(j.doc);S.assets=copy(j.assets||[]);S.videos=copy(j.videos||[]);S.fonts=copy(j.fonts||[]);S.music=copy(j.music||null);S.pageId=S.doc.pages[0].id;
 S.undo=[];S.redo=[];noAutoSave();renderAll();floating();modal();info('Proyek diimpor sebagai draft. Belum tersimpan ke mana pun.');
}
function ext(mime,name){const x=(name||'').split('.').pop().toLowerCase();const known=['png','jpg','jpeg','webp','svg','gif','avif','mp4','webm','woff','woff2','ttf','otf','mp3','ogg'];if(known.includes(x))return x;
 return ({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg','image/gif':'gif','image/avif':'avif','video/mp4':'mp4','video/webm':'webm','font/woff2':'woff2','font/woff':'woff','application/font-woff':'woff','font/ttf':'ttf','audio/mpeg':'mp3'})[mime]||'bin';}
async function mediaBytes(value){
 if(typeof value!=='string'||!value)throw Error('Media source kosong');
 if(value.startsWith('blob:'))throw Error('Media blob lokal harus diupload ulang ke editor sebelum dipublish.');
 if(value.startsWith('atelier-cloud:')||value.startsWith('v24cloud:'))throw Error('Media masih berupa private cloud reference. Export media as file lalu reimport secara lokal.');
 const url=value.startsWith('data:')?value:new URL(value,location.href).href;
 if(!/^https?:|^data:/.test(url))throw Error('Media path tidak valid: '+value.slice(0,90));
 let r;try{r=await fetch(url,{mode:'cors',credentials:'omit'})}catch(e){throw Error('Tidak bisa membaca file media (CORS/network). Download sumbernya lalu upload sebagai file di editor. '+value.slice(0,100))}
 if(!r.ok)throw Error('Media tidak tersedia (HTTP '+r.status+'): '+value.slice(0,90));
 const blob=await r.blob();if(blob.size>12*1024*1024)throw Error('Aset lebih dari 12 MB: '+value.slice(0,100));
 return {bytes:new Uint8Array(await blob.arrayBuffer()),mime:blob.type||'application/octet-stream'};
}
function toB64(bytes){let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin)}
function b64utf8(s){return toB64(new TextEncoder().encode(s))}
async function pack(){
 readForm();if(!TM.active)throw Error('Masuk Template Mode terlebih dahulu.');
 if(!S.doc?.pages?.length)throw Error('Template harus punya setidaknya satu halaman.');
 const doc=copy(S.doc);doc.name=TM.name;doc.pub=null;doc.__builtinTemplate=TM.slug;
 if(!doc.responsive)doc.responsive={};doc.responsive.mobileSync=false;
 const slug=TM.slug,folder=ROOT+slug+'/',files=new Map(), seen=new Map();
 const assets=copy(S.assets||[]),videos=copy(S.videos||[]),fonts=copy(S.fonts||[]);
 let total=0, num=0;
 async function embed(value,name){
  if(seen.has(value))return seen.get(value);
  const {bytes,mime}=await mediaBytes(value);total+=bytes.length;
  if(total>45*1024*1024)throw Error('Aset template melebihi 45 MB. Kompres gambar/video dulu.');
  const path=folder+'assets/'+String(++num).padStart(3,'0')+'-'+safeSlug(name||'media').slice(0,35)+'.'+ext(mime,name);
  files.set(path,toB64(bytes));const relative=path;seen.set(value,relative);return relative;
 }
 for(const [kind,arr] of [['asset',assets],['video',videos],['font',fonts]]){
  for(const a of arr){if(typeof a.data==='string'&&a.data){a.data=await embed(a.data,a.name||a.family||kind);a.builtin=true;a.origin='atelier-builtin';}}
 }
 // Some older Atelier documents also embed media directly in backgrounds and layers.
 async function replaceEmbedded(node){
  if(!node||typeof node!=='object')return;
  for(const k of Object.keys(node)){
   const v=node[k];
   if(typeof v==='string'){
    if(/^data:(image|video|audio|font|application\/octet-stream)/i.test(v))node[k]=await embed(v,k);
    else if(/backblazeb2\.com|\.backblaze\.com|b2api\./i.test(v))throw Error('Dokumen masih merujuk ke Backblaze pada '+k+'. Ganti aset itu dengan file lokal terlebih dahulu.');
   }else if(v&&typeof v==='object')await replaceEmbedded(v);
  }
 }
 await replaceEmbedded(doc);
 // Test that no hosted B2 media is retained in the model.
 const data={schemaVersion:2,id:slug,name:TM.name,category:TM.category,doc,assets,videos,fonts};
 const serialized=JSON.stringify(data);
 if(/backblazeb2\.com|\.backblaze\.com|b2api\.|b2:\/\//i.test(serialized))throw Error('Masih ada tautan Backblaze dalam paket. Hapus atau ubah dulu.');
 files.set(folder+'template-data.json',b64utf8(JSON.stringify(data,null,2)));
 const primary=doc.theme?.colors?.find(x=>x.id==='primary')?.value||'#9b70a1';
 const c=/^#[0-9a-fA-F]{6}$/.test(primary)?primary:'#9b70a1';
 const cover=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="460" viewBox="0 0 800 460"><rect width="800" height="460" fill="#ffffff"/><rect x="48" y="48" width="704" height="364" rx="35" fill="#f8f1fa"/><circle cx="680" cy="110" r="110" fill="${c}" fill-opacity=".18"/><rect x="100" y="108" width="110" height="9" rx="4" fill="${c}"/><text x="100" y="232" fill="#51425a" font-family="Georgia,serif" font-size="54">${escapeHTML(TM.name).slice(0,38)}</text><rect x="100" y="279" width="180" height="11" rx="5" fill="${c}" fill-opacity=".45"/><rect x="100" y="315" width="270" height="10" rx="5" fill="${c}" fill-opacity=".2"/></svg>`;
 files.set(folder+'cover.svg',b64utf8(cover));
 TM.lastPackage={files,data,cover:folder+'cover.svg',name:TM.name,slug,category:TM.category,pageCount:doc.pages.length,totalMedia:total,mediaCount:num};
 return TM.lastPackage;
}
async function validate(){
 const p=await pack();const all=p.data.doc.pages.flatMap(x=>x.sections||[]).flatMap(s=>s.elements||[]);
 const tablet=all.filter(e=>e.bp?.t||e.bp?.tablet).length,mobile=all.filter(e=>e.bp?.m||e.bp?.mobile).length;
 const warning=all.length&&(!tablet||!mobile)?' PERINGATAN: cek posisi Tablet/HP, karena belum ada override layout untuk salah satu mode.':'';
 info(`VALID · ${p.pageCount} halaman, ${p.mediaCount} aset internal (${(p.totalMedia/1048576).toFixed(2)} MB), ${tablet}/${all.length} layer tablet, ${mobile}/${all.length} layer HP. Tidak ada aset B2 dalam paket.`+warning);return p;
}
function download(name,bytes,mime){const u=URL.createObjectURL(new Blob([bytes],{type:mime}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),10000)}
// Small dependency-free ZIP writer (stored entries; image assets already compressed).
function zipFiles(fileMap){
 const encoder=new TextEncoder(),local=[],central=[];
 let offset=0;const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
 function crc32(bytes){let c=-1;for(const x of bytes){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^-1)>>>0}
 for(const [path,b64] of fileMap){
  const name=encoder.encode(path),content=Uint8Array.from(atob(b64),x=>x.charCodeAt(0)),crc=crc32(content);
  if(name.length>65535)throw Error('ZIP entry name too long');
  const lh=Uint8Array.from([...u32(0x04034b50),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(content.length),...u32(content.length),...u16(name.length),...u16(0)]);
  const ch=Uint8Array.from([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(content.length),...u32(content.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]);
  local.push(lh,name,content);central.push(ch,name);offset+=lh.length+name.length+content.length;
 }
 const cdlen=central.reduce((n,x)=>n+x.length,0),count=fileMap.size;
 if(count>65535)throw Error('Too many ZIP entries');
 const tail=Uint8Array.from([...u32(0x06054b50),...u16(0),...u16(0),...u16(count),...u16(count),...u32(cdlen),...u32(offset),...u16(0)]);
 return new Blob([...local,...central,tail],{type:'application/zip'});
}
async function downloadPackage(){
 const p=await pack();
 const localManifest={version:1,templates:[{id:p.slug,name:p.name,category:p.category,doc:ROOT+p.slug+'/template-data.json',cover:p.cover,pages:p.pageCount}]};
 const files=new Map(p.files);files.set(ROOT+'manifest.json',b64utf8(JSON.stringify(localManifest,null,2)));
 download('atelier-template-'+p.slug+'.zip',zipFiles(files),'application/zip');
 info('Paket ZIP diunduh. Bisa diekstrak atau dipublish melalui GitHub (tidak memakai Backblaze).');
}
async function gh(path,token,method='GET',data){
 const r=await fetch('https://api.github.com'+path,{method,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
 let j;try{j=await r.json()}catch{j={}};
 if(!r.ok)throw Error(`GitHub ${r.status}: ${(j.message||r.statusText||'Request failed').slice(0,300)}`);return j;
}
function fromB64(b64){const bytes=Uint8Array.from(atob(b64.replace(/\s/g,'')),c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}
async function publish(){
 if(TM.busy)return;readForm();const token=document.querySelector('#tm-token')?.value.trim();
 if(!token)throw Error('GitHub fine-grained token perlu diisi untuk Publish (tidak disimpan).');
 if(!/^[\w.-]+\/[\w.-]+$/.test(TM.repo))throw Error('Repository harus berbentuk owner/repo.');
 if(!/^[\w.\/-]+$/.test(TM.branch)||TM.branch.includes('..'))throw Error('Nama branch GitHub tidak valid.');
 const [owner,repo]=TM.repo.split('/').map(encodeURIComponent), base=`/repos/${owner}/${repo}`;
 TM.busy=true;try{
  const p=await pack();const prefix=TM.folder?TM.folder+'/':'';
  if(!confirm(`Publish template "${p.name}" ke ${TM.repo} pada branch ${TM.branch}?\n${p.pageCount} halaman, ${p.mediaCount} aset. Akan membuat satu commit dan memicu GitHub Pages deployment.`))return;
  info('Menghubungi GitHub dan membaca manifest terbaru...');
  const ref=await gh(base+'/git/ref/heads/'+encodeURIComponent(TM.branch),token);
  const commit=await gh(base+'/git/commits/'+ref.object.sha,token);
  let manifest={version:1,templates:[]};
  const manifestPath=prefix+ROOT+'manifest.json';
  try{const r=await gh(base+'/contents/'+manifestPath+'?ref='+encodeURIComponent(TM.branch),token);manifest=JSON.parse(fromB64(r.content));}
  catch(e){if(!/GitHub 404:/.test(e.message))throw e;}
  if(!Array.isArray(manifest.templates))throw Error('manifest.json GitHub tidak valid.');
  const entry={id:p.slug,name:p.name,category:p.category,doc:ROOT+p.slug+'/template-data.json',cover:p.cover,pages:p.pageCount};
  manifest.templates=manifest.templates.filter(x=>x.id!==p.slug);manifest.templates.push(entry);
  // Modify exactly templates/<slug>/* and manifest.json. Never touch B2 settings or other files.
  const files=new Map(p.files);files.set(ROOT+'manifest.json',b64utf8(JSON.stringify(manifest,null,2)));
  const rows=[...files.entries()].map(([path,content])=>({path:prefix+path,content}));
  info('Menyiapkan '+rows.length+' file di GitHub (hanya satu commit)...');
  let done=0;const results=new Array(rows.length);let index=0;
  await Promise.all(Array.from({length:Math.min(3,rows.length)},async()=>{
   while(index<rows.length){const i=index++,item=rows[i];const blob=await gh(base+'/git/blobs',token,'POST',{content:item.content,encoding:'base64'});
    results[i]={path:item.path,mode:'100644',type:'blob',sha:blob.sha};done++;info(`Mengirim aset ${done}/${rows.length}...`);}
  }));
  const tree=await gh(base+'/git/trees',token,'POST',{base_tree:commit.tree.sha,tree:results});
  const newCommit=await gh(base+'/git/commits',token,'POST',{message:'Atelier template: '+p.name,tree:tree.sha,parents:[ref.object.sha]});
  await gh(base+'/git/refs/heads/'+encodeURIComponent(TM.branch),token,'PATCH',{sha:newCommit.sha,force:false});
  info('PUBLISHED ✅ Satu commit '+newCommit.sha.slice(0,7)+'. GitHub Pages akan deploy otomatis sesuai konfigurasi repository. Refresh Atelier setelah deploy.');
 }finally{const password=document.querySelector('#tm-token');if(password)password.value='';TM.busy=false;}
}
// Published template management: GitHub-only. These functions deliberately never call cloud or B2 code.
function repoContext(){
 readForm();
 if(!/^[\w.-]+\/[\w.-]+$/.test(TM.repo))throw Error('Repository harus berbentuk owner/repo.');
 if(!/^[\w.\/-]+$/.test(TM.branch)||TM.branch.includes('..'))throw Error('Nama branch GitHub tidak valid.');
 const token=document.querySelector('#tm-token')?.value.trim();
 if(!token)throw Error('Masukkan fine-grained GitHub token di bagian Publish untuk membaca atau menghapus template.');
 const [owner,repo]=TM.repo.split('/').map(encodeURIComponent);
 return {token,base:`/repos/${owner}/${repo}`,prefix:TM.folder?TM.folder+'/':''};
}
function publishedMarkup(manifest){
 const root=document.querySelector('#tm-published-list');if(!root)return;
 const rows=(manifest?.templates||[]).filter(x=>x&&typeof x.id==='string');
 TM.published=rows;
 if(!rows.length){root.innerHTML='<p class="tm-tip">Belum ada template di manifest GitHub.</p>';return}
 root.innerHTML=rows.map(t=>{
  const slug=String(t.id||''),legacy=!!t.legacy;
  return `<div class="tm-published-row"><div><b>${escapeHTML(t.name||slug)}</b><small>${escapeHTML(slug)} · ${legacy?'Legacy · protected':'Published template'}</small></div><div class="tm-actions">${legacy?'<span class="tm-protected">Protected</span>':btn('unpublish','Unpublish','tm-warning').replace('data-tm="unpublish"',`data-tm="unpublish" data-tm-slug="${escapeHTML(slug)}"`)+btn('delete-published','Delete Permanently','tm-danger').replace('data-tm="delete-published"',`data-tm="delete-published" data-tm-slug="${escapeHTML(slug)}"`)}</div></div>`;
 }).join('');
}
async function publishedFromGitHub(){
 const {token,base,prefix}=repoContext();
 try{
  const r=await gh(base+'/contents/'+prefix+ROOT+'manifest.json?ref='+encodeURIComponent(TM.branch),token);
  const manifest=JSON.parse(fromB64(r.content));if(!Array.isArray(manifest.templates))throw Error('Manifest GitHub tidak valid.');
  publishedMarkup(manifest);info('Daftar template dibaca dari GitHub. Tidak ada perubahan yang disimpan.');
 }finally{const field=document.querySelector('#tm-token');if(field)field.value='';}
}
async function removePublished(slug,permanent){
 if(TM.busy)return;
 const {token,base,prefix}=repoContext();
 const valid=typeof slug==='string'&&/^[a-z0-9-]{1,64}$/.test(slug)&&slug!=='template-manager';
 if(!valid)throw Error('Slug template tidak aman. Operasi dibatalkan.');
 TM.busy=true;
 try{
  const ref=await gh(base+'/git/ref/heads/'+encodeURIComponent(TM.branch),token);
  const oldCommit=await gh(base+'/git/commits/'+ref.object.sha,token);
  const manifestPath=prefix+ROOT+'manifest.json';
  const mf=await gh(base+'/contents/'+manifestPath+'?ref='+encodeURIComponent(TM.branch),token);
  const manifest=JSON.parse(fromB64(mf.content));
  if(!Array.isArray(manifest.templates))throw Error('Manifest GitHub tidak valid.');
  const item=manifest.templates.find(x=>x?.id===slug);
  if(!item)throw Error('Template tidak ditemukan di manifest terbaru; refresh daftar Published.');
  if(item.legacy)throw Error('Template legacy masih tertanam di kode Atelier. Migrasikan dulu sebelum menghapus.');
  // Confirm AFTER reading latest manifest, preventing deletion of a newly modified protected entry.
  const promptLabel=item.name||slug;
  if(permanent){
   const typed=prompt(`PERMANENT DELETE: seluruh file templates/${slug}/ akan dihapus dari branch aktif. Proyek lama yang memakai aset tersebut bisa kehilangan gambar.\n\nKetik slug "${slug}" untuk konfirmasi:`,'');
   if(typed!==slug){info('Penghapusan permanen dibatalkan.');return}
  }else if(!confirm(`Unpublish "${promptLabel}" dari galeri? File aset akan tetap ada, jadi proyek pengguna lama tidak kehilangan gambar.`))return;
  manifest.templates=manifest.templates.filter(x=>x?.id!==slug);
  const b=await gh(base+'/git/blobs',token,'POST',{content:b64utf8(JSON.stringify(manifest,null,2)),encoding:'base64'});
  const treeRows=[{path:manifestPath,mode:'100644',type:'blob',sha:b.sha}];
  if(permanent){
   // Never delete anything outside this exact template directory. Refuse truncated tree responses.
   const fileTree=await gh(base+'/git/trees/'+oldCommit.tree.sha+'?recursive=1',token);
   if(fileTree.truncated)throw Error('Daftar file GitHub terlalu besar / terpotong. Penghapusan dibatalkan untuk keamanan.');
   const dir=prefix+ROOT+slug+'/';
   const owned=(fileTree.tree||[]).filter(x=>x.type==='blob'&&x.path.startsWith(dir));
   if(!owned.length)throw Error('File template tidak ditemukan pada branch. Tidak ada yang dihapus.');
   for(const file of owned)treeRows.push({path:file.path,mode:'100644',type:'blob',sha:null});
  }
  const verb=permanent?'Delete permanently':'Unpublish';
  info('Membuat satu commit GitHub: '+verb+' '+slug+'…');
  const tree=await gh(base+'/git/trees',token,'POST',{base_tree:oldCommit.tree.sha,tree:treeRows});
  const newCommit=await gh(base+'/git/commits',token,'POST',{message:`Atelier: ${permanent?'delete':'unpublish'} template ${slug}`,tree:tree.sha,parents:[ref.object.sha]});
  await gh(base+'/git/refs/heads/'+encodeURIComponent(TM.branch),token,'PATCH',{sha:newCommit.sha,force:false});
  const idx=TEMPLATES.findIndex(t=>t.id==='builtin-'+slug);if(idx>=0)TEMPLATES.splice(idx,1);
  publishedMarkup(manifest);
  info(`${permanent?'DELETED':'UNPUBLISHED'} ✅ Commit ${newCommit.sha.slice(0,7)}. ${permanent?'File template dihapus dari branch (riwayat Git tetap tersimpan).':'Aset tetap di repository.'} GitHub Pages akan diperbarui otomatis.`);
 }finally{const field=document.querySelector('#tm-token');if(field)field.value='';TM.busy=false;}
}
async function loadBuiltins(){
 try{
  const r=await fetch(ROOT+'manifest.json',{cache:'no-cache'});if(!r.ok)return;
  const m=await r.json();if(!Array.isArray(m.templates))return;
  for(const t of m.templates){
   if(t.legacy||!t.doc||!/^templates\/[a-z0-9-]+\/template-data\.json$/.test(t.doc))continue;
   const response=await fetch(t.doc,{cache:'no-cache'});if(!response.ok)continue;
   const data=await response.json();if(!data.doc?.pages?.length)continue;
   const id='builtin-'+t.id;
   if(TEMPLATES.some(x=>x.id===id))continue;
   const record={id,name:t.name||data.name,cat:t.category||'Business',build:()=>copy(data.doc),data};TEMPLATES.unshift(record);
  }
 }catch(e){console.warn('Built-in template manifest could not be read',e)}
}
const origUse=ACT['tpl-use'],origPrev=ACT['tpl-prev'],origModal=ACT['tpl-modal-use'];
async function useBuiltIn(item){
 if(TM.active)throw Error('Keluar dari Template Mode terlebih dahulu sebelum menggunakan template lain.');
 if(!confirm(`Buat proyek baru dari template "${item.name}"? Proyek saat ini akan disimpan terlebih dahulu.`))return;
 const doc=item.build();await newProject(doc);
 S.assets=copy(item.data.assets||[]);S.videos=copy(item.data.videos||[]);S.fonts=copy(item.data.fonts||[]);
 S.doc.__builtinTemplate=item.data.id;S.pageId=S.doc.pages[0].id;
 await priorSaveNow();st28Hide();renderAll();fitZoom();toast('Built-in template dimuat. Semua layer editable; internal assets tidak di-upload B2.');
}
function match(id){return TEMPLATES.find(t=>t.id===id&&t.data?.doc)}
ACT['tpl-use']=function(b){const t=match(b.dataset.v);return t?useBuiltIn(t):origUse(b)};
ACT['tpl-prev']=function(b){const t=match(b.dataset.v);if(!t)return origPrev(b);const old=S.assets;S.assets=[...old,...copy(t.data.assets||[])];try{previewModal(t.name,previewHTML(t.build()),`<button class="btn" data-a="mclose">Close</button><button class="btn pri" data-a="tpl-modal-use" data-v="${t.id}">Use editable template</button>`)}finally{S.assets=old}};
ACT['tpl-modal-use']=function(b){const t=match(b.dataset.v);return t?useBuiltIn(t):origModal(b)};
// Export portable HTML with local internal assets, without mutating normal cloud state.
const prevDL=downloadSite,prevExport=exportProject;
async function makePortable(){const src=[...(S.assets||[]),...(S.videos||[]),...(S.fonts||[])].filter(a=>a.builtin&&typeof a.data==='string'&&!a.data.startsWith('data:'));
 const replacement=new Map();for(const a of src){try{const {bytes,mime}=await mediaBytes(a.data);replacement.set(a.id,'data:'+mime+';base64,'+toB64(bytes))}catch(e){throw Error('Could not bundle internal asset '+a.name+': '+e.message)}}
 return replacement;
}
async function portableCall(kind){
 if(![...(S.assets||[]),...(S.videos||[]),...(S.fonts||[])].some(a=>a.builtin&&!a.data?.startsWith('data:')))return kind==='html'?prevDL():prevExport();
 const map=await makePortable();const bk={assets:S.assets,videos:S.videos,fonts:S.fonts};
 try{for(const k of Object.keys(bk)){S[k]=copy(bk[k]||[]);for(const a of S[k])if(map.has(a.id))a.data=map.get(a.id)}
  if(kind==='html'){const html=siteHTML(S.doc);download(safeSlug(S.doc.name||'website')+'.html',html,'text/html')}
  else{const result={doc:S.doc,assets:S.assets,videos:S.videos,fonts:S.fonts,music:S.music};download(safeSlug(S.doc.name)+'.atelier.json',JSON.stringify(result),'application/json')}
  toast('Export includes internal assets and is standalone.');
 }finally{Object.assign(S,bk)}
}
downloadSite=function(){void portableCall('html').catch(e=>toast(e.message,6500))};
exportProject=function(){void portableCall('json').catch(e=>toast(e.message,6500))};
const priorCloud=a29CloudPayload;
a29CloudPayload=async function(root){
 // Defense-in-depth: built-in path is a static URL, never a data URL to upload.
 const check=o=>{if(!o||typeof o!=='object')return; if(o.builtin&&typeof o.data==='string'&&o.data.startsWith('data:'))throw Error('Internal asset was unexpectedly inlined; B2 upload blocked.');
 for(const [k,v] of Object.entries(o)){if(k==='data')continue;if(v&&typeof v==='object')check(v)} };
 check(root);return priorCloud(root);
};
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-tm-use]');if(!el)return;
 event.preventDefault();event.stopImmediatePropagation();
 const t=match(el.dataset.tmUse);if(t)void useBuiltIn(t).catch(e=>toast(e.message,6500));
},true);
// Portal entrypoint and controls (capture phase prevents legacy handler taking over).
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-tm]');if(!el)return;
 e.preventDefault();e.stopImmediatePropagation();
 const action=el.dataset.tm;
 const run=async()=>{
  if(action==='open'){modal();return}
  if(action==='close'){d().style.display='none';return}
  if(action==='start'){await begin();return}
  if(action==='exit'){exit();return}
  if(action==='draft'){await saveDraft();return}
  if(action==='delete-draft'){await deleteDraft();return}
  if(action==='list-published'){await publishedFromGitHub();return}
  if(action==='unpublish'){await removePublished(el.dataset.tmSlug,false);return}
  if(action==='delete-published'){await removePublished(el.dataset.tmSlug,true);return}
  if(action==='load'){await loadDraft();return}
  if(action==='validate'){await validate();return}
  if(action==='package'){await downloadPackage();return}
  if(action==='publish'){await publish();return}
  if(action==='import'){document.querySelector('#tm-import')?.click();return}
 };
 void run().catch(err=>{console.error('Template Manager:',err);info('ERROR: '+err.message);});
},true);
document.addEventListener('change',e=>{
 if(e.target.id!=='tm-import')return;const f=e.target.files?.[0];if(!f)return;
 void importJSON(f).catch(err=>info('ERROR: '+err.message));
});
window.addEventListener('beforeunload',e=>{if(TM.active&&S.dirty){e.preventDefault();e.returnValue='';}});
const css=`
.tm-hub-templates{padding:20px;margin:22px 0;background:#faf7fb;border:1px solid #ecddeb;border-radius:18px}.tm-hub-templates h2{font:700 21px Georgia,serif;color:#694e75;margin:0 0 5px}.tm-hub-templates p{color:#827287;font-size:12px}.tm-hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:15px}.tm-hub-grid article{background:white;border:1px solid #e8dbe9;border-radius:13px;overflow:hidden;padding:10px;display:flex;align-items:flex-start;flex-direction:column;gap:7px}.tm-hub-grid img{width:100%;height:120px;object-fit:cover;border-radius:7px}.tm-hub-grid h3{margin:0;color:#654d6c}.tm-hub-grid small{color:#897b8e}

#tm-modal{position:fixed;z-index:100000;inset:0;display:none;font:14px/1.5 system-ui,sans-serif;color:#3a3444}
.tm-backdrop{position:absolute;inset:0;background:#19101d99;backdrop-filter:blur(5px)}
.tm-panel{position:absolute;right:0;top:0;height:100%;width:min(700px,100%);background:#fff;box-shadow:-10px 0 50px #180a1a44;overflow:auto}
.tm-header{background:#fbf7fd;border-bottom:1px solid #ebdceb;padding:22px 26px;display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
.tm-header h2{margin:6px 0;font:700 27px Georgia,serif;color:#6e457b}.tm-header p,.tm-card p{color:#817486;margin:6px 0 15px}
.tm-eyebrow{font-weight:700;font-size:10px;letter-spacing:.16em;color:#9a72a5}.tm-content{padding:20px 26px 65px}.tm-card{padding:19px;border:1px solid #e9dbe9;border-radius:16px;margin:14px 0;background:white}
.tm-card h3{margin:0 0 9px;color:#65516b;font-size:16px}.tm-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}
.tm-fields label{font-size:12px;font-weight:700;color:#796780;display:flex;flex-direction:column;gap:5px}.tm-fields input{border:1px solid #dac8df;border-radius:8px;padding:10px;outline-offset:1px;width:100%;min-width:0;background:#fff}
.tm-actions{display:flex;flex-wrap:wrap;gap:9px}.tm-btn{font:600 12px system-ui,sans-serif!important;border:1px solid #d9c5e0;background:#fff;color:#754e80;border-radius:9px;padding:10px 13px;cursor:pointer}
.tm-btn:hover{background:#f5eef7}.tm-danger{border-color:#dcafb7;color:#a12e43;background:#fff7f8}.tm-danger:hover{background:#ffe7eb}.tm-warning{border-color:#edd3a8;color:#8a5a20;background:#fffaf1}.tm-warning:hover{background:#fff1d9}
.tm-published-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #eee6f0;padding:12px 0}.tm-published-row small{display:block;font-size:11px;color:#8c8190}.tm-published-row .tm-actions{justify-content:flex-end}.tm-protected{font-size:11px;color:#777;background:#f4f3f5;border-radius:20px;padding:6px 10px}
.tm-primary{background:#9068a1;color:white;border-color:#9068a1}.tm-primary:hover{background:#775387}
.tm-x{border:0;font-size:25px;background:transparent}.tm-pill{display:inline-flex;padding:6px 11px;background:#f6eff9;border-radius:40px;color:#7c5588;font-weight:700;font-size:12px}
.tm-tip{font-size:11px;color:#887889!important;margin:9px 0 0!important}.tm-status{background:#f7f4f8;border-radius:10px;padding:13px;color:#644970;white-space:pre-wrap;overflow-wrap:anywhere}
#st28-shell .st-section-title .tm-hub-actions .tm-btn.tm-primary{background:#4f5cec!important;color:#fff!important;border:1px solid #4f5cec!important;padding:11px 15px!important;box-shadow:0 3px 13px #4359e22a}#st28-shell .st-section-title .tm-hub-actions .tm-btn.tm-primary:hover{background:#3646d5!important}.tm-hub-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;min-width:0}.tm-hub-actions .st-create-outline{white-space:normal}.tm-hub-button{margin:0;display:inline-flex;align-items:center;justify-content:center;min-height:40px;white-space:normal;text-align:center}.tm-hub-explain{padding:11px 14px;border-radius:12px;background:#f8f8ff;color:#555f84;border:1px solid #e2e4f9;font-size:12px;line-height:1.6;margin:14px 0 17px;max-width:100%}#st28-content .st-section-title:has(.tm-hub-actions){gap:16px;align-items:flex-start;flex-wrap:wrap}#st28-content .tm-hub-templates{max-width:100%;overflow:hidden}#st28-content .tm-hub-grid article{min-width:0}#st28-content .tm-hub-grid img{display:block;max-width:100%}@media(max-width:800px){#st28-content .tm-hub-actions{width:100%;justify-content:flex-start}#st28-content .tm-hub-button{flex:1}}#tm-mode-bar{position:fixed;bottom:15px;left:50%;transform:translateX(-50%);z-index:99990;background:#34233f;color:#fff;box-shadow:0 8px 38px #0004;border-radius:14px;padding:9px 12px;display:flex;align-items:center;gap:8px;font:600 12px system-ui;white-space:nowrap}
#tm-mode-bar .tm-btn{padding:6px 11px}.tm-panel .tm-btn:focus-visible{outline:2px solid #795b86}
@media(max-width:600px){.tm-published-row{flex-direction:column;align-items:stretch}.tm-published-row .tm-actions{justify-content:flex-start}.tm-fields{grid-template-columns:1fr}.tm-header{padding:16px}.tm-content{padding:14px}#tm-mode-bar{left:4px;right:4px;transform:none;flex-wrap:wrap;justify-content:center}#tm-mode-bar span{width:100%;text-align:center}}
`;
const st=document.createElement('style');st.textContent=css;document.head.append(st);
void loadBuiltins().then(()=>{navButton();}).catch(console.error);
})();
