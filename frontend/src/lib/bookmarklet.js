// Generates a best-effort autofill bookmarklet for the shcilestamp.com e-stamping form.
// It maps DocGalaxy order fields to likely field labels/names/ids on the target form.

export function buildBookmarklet(order) {
  const d = order.data || {};
  const mapping = {
    "first party": d.first_party_name,
    "purchased by": d.purchased_by,
    "description of document": d.description_of_document,
    "description": d.description_of_document,
    "article": d.article,
    "article no": d.article,
    "consideration price": d.consideration_price,
    "consideration": d.consideration_price,
    "first party name": d.first_party_name,
    "second party name": d.second_party_name,
    "second party": d.second_party_name,
    "stamp duty amount": d.stamp_duty_amount,
    "stamp duty": d.stamp_duty_amount,
    "stamp duty paid by": d.stamp_duty_paid_by,
    "address line 1": d.first_party_address1,
    "address line 2": d.first_party_address2,
    "address line 3": d.first_party_address3,
    "pin code": d.first_party_pin,
    "pincode": d.first_party_pin,
    "pan": d.first_party_pan,
    "gender": d.gender,
    "proof of identity": d.proof_of_identity,
    "proof of residence": d.proof_of_residence,
    "mode of payment": d.mode_of_payment,
    "mobile": d.first_party_mobile,
    "email": d.first_party_email,
  };

  // Clean empties
  const clean = {};
  Object.entries(mapping).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") clean[k] = String(v);
  });

  const payload = JSON.stringify(clean);

  // The injected script, kept compact
  const code = `(function(){try{var M=${payload};var norm=function(s){return (s||'').toString().toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\\s+/g,' ').trim();};var filled=0;var inputs=document.querySelectorAll('input[type=text],input:not([type]),textarea,select');inputs.forEach(function(el){var ctx='';if(el.id){var lbl=document.querySelector('label[for=\"'+el.id+'\"]');if(lbl)ctx+=' '+lbl.innerText;}ctx+=' '+(el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')+' '+(el.getAttribute('aria-label')||'');var p=el.closest('td,div,.form-group');if(p){var pl=p.querySelector('label');if(pl)ctx+=' '+pl.innerText;}ctx=norm(ctx);var best=null;Object.keys(M).forEach(function(key){if(ctx.indexOf(norm(key))>-1){if(!best||key.length>best.length)best=key;}});if(best){var val=M[best];if(el.tagName==='SELECT'){for(var i=0;i<el.options.length;i++){if(norm(el.options[i].text).indexOf(norm(val))>-1||norm(val).indexOf(norm(el.options[i].text))>-1){el.selectedIndex=i;break;}}}else{el.value=val;}el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));filled++;}});alert('DocGalaxy Autofill: '+filled+' field(s) filled. Please review before submitting.');}catch(e){alert('DocGalaxy Autofill error: '+e.message);}})();`;

  return "javascript:" + encodeURIComponent(code);
}
