/* VanGuard Clean — client sign-off helpers */
(function(){'use strict';
  function escape(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function render(recordId, container, onSigned){
    const box=document.getElementById(container); if(!box)return;
    box.innerHTML='<div class="section form"><h3>Client sign-off</h3><p class="notice">Optional confirmation from the client or supervisor.</p><label>Signer name<input id="signerName" maxlength="120" placeholder="Client or supervisor name"></label><label>Role<input id="signerRole" maxlength="120" placeholder="Manager, client, supervisor…"></label><div class="actions"><button class="btn" id="signBtn">Record sign-off</button></div><div id="signMsg" class="error"></div></div>';
    document.getElementById('signBtn').onclick=async()=>{try{const name=document.getElementById('signerName').value.trim();if(!name)throw Error('Signer name is required.');await window.api('clean_signoffs',{method:'POST',body:JSON.stringify({record_id:recordId,signer_name:name,signer_role:document.getElementById('signerRole').value.trim()||null,signed_at:new Date().toISOString()})});box.innerHTML='<div class="notice">Client sign-off recorded.</div>';if(onSigned)onSigned()}catch(e){document.getElementById('signMsg').textContent=e.message}};
  }
  window.VGCleanSignoff={render,escape};
})();