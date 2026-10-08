// Generates a robust autofill bookmarklet for the shcilestamp.com e-stamping
// "Create Submission" form. The SHCIL form uses a table layout
// (<td>Label</td><td><input></td>) with no <label> elements and cryptic
// server-generated field names, so we resolve each field's label from its
// preceding table cell / sibling text and match against known SHCIL labels.

export function buildBookmarklet(order) {
  const d = order.data || {};

  // Each entry: keys (synonyms seen on SHCIL / generic forms) -> value.
  // Longer keys win when multiple match, so specific labels take priority.
  const raw = [
    { k: ["stamp duty purchased by", "purchased by", "purchaser", "purchased"], v: d.purchased_by },
    { k: ["description of document", "document description", "description"], v: d.description_of_document },
    { k: ["article"], v: d.article },
    { k: ["consideration of property", "consideration price", "consideration value", "consideration amount", "consideration", "property value", "market value"], v: d.consideration_price },
    { k: ["name and address of the first party", "name address of the first party", "details of first party", "first party name", "first party"], v: d.first_party_name },
    { k: ["name and address of the second party", "name address of the second party", "details of second party", "second party name", "second party"], v: d.second_party_name },
    { k: ["stamp duty amount", "stamp duty", "duty amount"], v: d.stamp_duty_amount },
    { k: ["stamp duty paid by", "duty paid by", "paid by"], v: d.stamp_duty_paid_by },
    { k: ["first party address", "address line 1", "address"], v: d.first_party_address1 },
    { k: ["pin code", "pincode", "pin"], v: d.first_party_pin },
    { k: ["pan"], v: d.first_party_pan },
    { k: ["mobile", "phone", "contact number"], v: d.first_party_mobile },
    { k: ["email", "e-mail"], v: d.first_party_email },
    { k: ["gender"], v: d.gender },
    { k: ["mode of payment", "payment mode"], v: d.mode_of_payment },
    { k: ["proof of identity", "identity proof"], v: d.proof_of_identity },
    { k: ["proof of residence", "residence proof", "address proof"], v: d.proof_of_residence },
  ];

  const mapping = raw.filter((m) => m.v != null && String(m.v).trim() !== "")
    .map((m) => ({ k: m.k, v: String(m.v) }));

  const payload = JSON.stringify(mapping);

  const code = `(function(){try{var M=${payload};
function norm(s){return (s||'').toString().toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\\s+/g,' ').trim();}
function setVal(el,val){
 try{
  if(el.tagName==='SELECT'){var ok=false;for(var i=0;i<el.options.length;i++){var ot=norm(el.options[i].text);if(ot&&(ot.indexOf(norm(val))>-1||norm(val).indexOf(ot)>-1)){el.selectedIndex=i;ok=true;break;}}if(!ok)return false;}
  else{var proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;var desc=Object.getOwnPropertyDescriptor(proto,'value');if(desc&&desc.set){desc.set.call(el,val);}else{el.value=val;}}
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('blur',{bubbles:true}));
  return true;
 }catch(e){return false;}
}
function ctxOf(el){
 var p=[el.name,el.id,el.getAttribute('placeholder'),el.getAttribute('aria-label'),el.getAttribute('title')];
 if(el.id){var l=document.querySelector('label[for=\"'+el.id+'\"]');if(l)p.push(l.innerText);}
 var la=el.closest&&el.closest('label');if(la)p.push(la.innerText);
 var prev=el.previousSibling,g=0;while(prev&&g<5){if(prev.nodeType===3)p.push(prev.textContent);else if(prev.nodeType===1)p.push(prev.innerText||prev.textContent);prev=prev.previousSibling;g++;}
 var td=el.closest&&el.closest('td');
 if(td){var ptd=td.previousElementSibling,g2=0;while(ptd&&g2<3){p.push(ptd.innerText||ptd.textContent);ptd=ptd.previousElementSibling;g2++;}var tr=td.closest('tr');if(tr&&tr.cells&&tr.cells.length)p.push(tr.cells[0].innerText||tr.cells[0].textContent);}
 var fg=el.closest&&el.closest('div');if(fg){var dl=fg.querySelector('label');if(dl)p.push(dl.innerText);}
 return norm(p.join(' '));
}
var filled=0;
var els=document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=password]),textarea,select');
els.forEach(function(el){
 var ctx=ctxOf(el);if(!ctx)return;
 var best=null,bestLen=0;
 M.forEach(function(m){m.k.forEach(function(key){var nk=norm(key);if(nk&&ctx.indexOf(nk)>-1&&nk.length>bestLen){best=m;bestLen=nk.length;}});});
 if(best){if(setVal(el,best.v)){filled++;try{el.style.outline='2px solid #22c55e';}catch(e){}}}
});
alert('DocGalaxy Autofill: '+filled+' field(s) filled. Please review before submitting.');
}catch(e){alert('DocGalaxy Autofill error: '+e.message);}})();`;

  return "javascript:" + encodeURIComponent(code);
}
