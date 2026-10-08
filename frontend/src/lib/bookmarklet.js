// Generates a robust autofill bookmarklet for the shcilestamp.com e-stamping
// "Create Submission" form.
//
// Key properties:
// - NO alerts/popups: fills fields silently.
// - NO stale data: the order values are NOT hardcoded. At click time the
//   bookmarklet fetches the LATEST order data live from the backend using the
//   order id, so it always reflects current customer details.
//
// The SHCIL form uses a table layout (<td>Label</td><td><input></td>) with no
// <label> elements and cryptic server-generated field names, so we resolve each
// field's label from its preceding table cell / sibling text and match against
// known SHCIL labels.

import { API } from "@/lib/api";

// field key on order.data -> list of label synonyms seen on SHCIL / generic forms.
// `n` = candidate HTML name/id substrings (despaced) seen on ASP.NET/JSP forms.
const FIELD_SYNONYMS = [
  { f: "purchased_by", k: ["stamp duty purchased by", "purchased by", "purchaser", "purchased"], n: ["purchasedby", "purchaseby", "purby", "purchaser", "purchased"] },
  { f: "description_of_document", k: ["description of document", "document description", "description"], n: ["description", "descofdoc", "docdesc", "desc"] },
  { f: "article", k: ["article"], n: ["article", "articleno", "doctype", "documenttype"] },
  { f: "consideration_price", k: ["consideration of property", "consideration price", "consideration value", "consideration amount", "consideration", "property value", "market value"], n: ["consideration", "considr", "considerationprice", "considervalue", "propertyvalue", "marketvalue", "considamt"] },
  { f: "first_party_name", k: ["name and address of the first party", "name address of the first party", "details of first party", "first party name", "first party"], n: ["firstparty", "firstpartyname", "fparty", "fpname", "party1", "firstpname"] },
  { f: "second_party_name", k: ["name and address of the second party", "name address of the second party", "details of second party", "second party name", "second party"], n: ["secondparty", "secondpartyname", "sparty", "spname", "party2", "secpname"] },
  { f: "stamp_duty_amount", k: ["stamp duty amount", "stamp duty", "duty amount"], n: ["stampduty", "dutyamount", "stampdutyamt", "dutyamt", "sdamount"] },
  { f: "stamp_duty_paid_by", k: ["stamp duty paid by", "duty paid by", "paid by"], n: ["paidby", "dutypaidby", "stampdutypaidby"] },
  { f: "first_party_address1", k: ["first party address", "address line 1", "address"], n: ["fpaddress", "firstpartyaddress", "address1", "addressline1", "faddr"] },
  { f: "first_party_pin", k: ["pin code", "pincode", "pin"], n: ["pincode", "pin", "zip", "postalcode"] },
  { f: "first_party_pan", k: ["pan"], n: ["pan", "panno", "pannumber"] },
  { f: "first_party_mobile", k: ["mobile", "phone", "contact number"], n: ["mobile", "phone", "contactno", "mobileno", "contact"] },
  { f: "first_party_email", k: ["email", "e-mail"], n: ["email", "emailid", "mail"] },
  { f: "gender", k: ["gender"], n: ["gender", "sex"] },
  { f: "mode_of_payment", k: ["mode of payment", "payment mode"], n: ["modeofpayment", "paymentmode", "paymode"] },
  { f: "proof_of_identity", k: ["proof of identity", "identity proof"], n: ["proofofidentity", "identityproof", "idproof"] },
  { f: "proof_of_residence", k: ["proof of residence", "residence proof", "address proof"], n: ["proofofresidence", "residenceproof", "addressproof"] },
];

export function buildBookmarklet(order) {
  const url = `${API}/orders/${order.id}/autofill`;
  const syn = JSON.stringify(FIELD_SYNONYMS);

  const code = `(function(){try{var URL=${JSON.stringify(url)};var SYN=${syn};
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
function nameOf(el){return (el.name+' '+el.id).toLowerCase().replace(/[^a-z0-9]/g,'');}
function fill(d){
 var els=document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=password]),textarea,select');
 var diag=[];for(var i=0;i<els.length;i++){var e=els[i];diag.push({tag:e.tagName,type:e.type||'',name:e.name||'',id:e.id||'',label:ctxOf(e).slice(0,70)});}
 try{console.log('%cDocGalaxy Autofill — '+els.length+' fillable field(s) detected on this page:','font-weight:bold;color:#2a4b8d;font-size:13px');if(console.table){console.table(diag);}else{console.log(JSON.stringify(diag,null,2));}}catch(e){}
 var filled=0,matched=[];
 els.forEach(function(el){
  var ctx=ctxOf(el);var ctxNS=ctx.replace(/ /g,'');var nm=nameOf(el);
  var best=null,bestLen=0;
  SYN.forEach(function(m){
   var v=d[m.f];if(v==null||String(v).trim()==='')return;
   (m.k||[]).forEach(function(key){var nk=norm(key);var nkNS=nk.replace(/ /g,'');if(nk&&(ctx.indexOf(nk)>-1||(nkNS&&ctxNS.indexOf(nkNS)>-1))&&nk.length>bestLen){best={v:String(v)};bestLen=nk.length;}});
   (m.n||[]).forEach(function(hint){var h=hint.toLowerCase().replace(/[^a-z0-9]/g,'');if(h&&nm.indexOf(h)>-1&&h.length>bestLen){best={v:String(v)};bestLen=h.length;}});
  });
  if(best){if(setVal(el,best.v)){filled++;matched.push((el.name||el.id||el.tagName)+' = '+best.v);try{el.style.outline='2px solid #22c55e';}catch(e){}}}
 });
 try{console.log('%cDocGalaxy Autofill: '+filled+' field(s) filled.','font-weight:bold;color:'+(filled?'#16a34a':'#dc2626'),matched);if(!filled){console.log('No matches. Copy the table above (field names) and send it so the mapping can be fine-tuned.');}}catch(e){}
 return filled;
}
return fetch(URL,{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){return fill(d);}).catch(function(e){try{console.error('DocGalaxy Autofill error:',e);}catch(x){}return 0;});
}catch(e){try{console.error('DocGalaxy Autofill error:',e);}catch(x){}}})();`;

  return "javascript:" + encodeURIComponent(code);
}
