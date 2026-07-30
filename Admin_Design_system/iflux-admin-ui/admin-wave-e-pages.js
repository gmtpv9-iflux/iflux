(function (global) {
  'use strict';
  function apiBase(){ return (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api'; }
  function headers(){
    var h={'Content-Type':'application/json',Accept:'application/json'};
    var t=null; if(global.IfluxAdminAuth&&IfluxAdminAuth.getSession){var s=IfluxAdminAuth.getSession(); if(s&&s.token)t=s.token;}
    if(t)h.Authorization='Bearer '+t; else h['X-Admin-Key']='iflux-admin-local-dev'; return h;
  }
  function req(path, opt){ opt=opt||{}; return fetch(apiBase()+path,{method:opt.method||'GET',headers:Object.assign(headers(),opt.headers||{}),body:opt.body!=null?JSON.stringify(opt.body):undefined}).then(function(r){return r.json().catch(function(){return{};}).then(function(d){ if(!r.ok) throw new Error(((d.error||{}).message)||d.message||('HTTP '+r.status)); return (d&&d.data)?d.data:d; }); }); }
  function toast(m,t){ if(typeof global.ixToast==='function') global.ixToast(m,t||'info'); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fillTable(items, mapRow){
    var c=document.getElementById('adm-we-count'); if(c)c.textContent=String(items.length);
    var tb=document.getElementById('adm-we-tbody'); if(!tb)return;
    tb.innerHTML=items.map(mapRow).join('')||'<tr><td colspan="3" class="ix-caption">Trống</td></tr>';
  }
  global.AdmWaveE={
    initSubscribers:function(){ req('/admin/subscription/subscribers').then(function(d){ fillTable(d.items||[], function(r){ return '<tr><td>'+esc(r.email)+'</td><td>'+esc(r.plan_code)+'</td><td>'+esc(r.status)+'</td></tr>'; }); }).catch(function(e){toast(e.message,'danger');});
      var btn=document.getElementById('btn-adm-we-add'); if(btn){ btn.style.display=''; btn.textContent='Xuất CSV'; btn.setAttribute('data-ix-perm','subscription.subscribers.export');
        btn.onclick=function(){ req('/admin/subscription/subscribers/export').then(function(){toast('Đã xuất','success');}).catch(function(e){toast(e.message,'danger');}); };
      }
    },
    initFeatureFlags:function(){ req('/admin/system/feature-flags').then(function(d){ var p=(d.item&&d.item.payload)||{}; fillTable(Object.keys(p).map(function(k){return {k:k,v:p[k]};}), function(r){ return '<tr><td>'+esc(r.k)+'</td><td>'+esc(r.v)+'</td><td></td></tr>'; }); }).catch(function(e){toast(e.message,'danger');}); },
    initMaintenance:function(){ req('/admin/system/maintenance').then(function(d){ var p=(d.item&&d.item.payload)||{}; fillTable([{k:'enabled',v:p.enabled}], function(r){ return '<tr><td>'+esc(r.k)+'</td><td>'+esc(r.v)+'</td><td></td></tr>'; }); }).catch(function(e){toast(e.message,'danger');}); }
  };
})(window);
