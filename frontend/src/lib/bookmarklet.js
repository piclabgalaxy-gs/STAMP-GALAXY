// Generates a STRICT autofill bookmarklet for the shcilestamp.com e-stamping
// "Create Submission" form.
//
// Strictness rules (as requested):
// - Only fills a field when its label clearly and specifically identifies that
//   exact DocGalaxy field. Party-specific fields require BOTH the party token
//   ("first party" / "second party") AND the field-type token ("mobile" /
//   "email" / "name" / ...). No loose single-word guessing that could put data
//   in the wrong box.
// - Fields with an empty/null value in the order are SKIPPED (left blank).
// - NO alerts: fills silently and logs a diagnostic table to the console.
// - NO stale data: fetches the LATEST order data live at click time.
//
// Matching: for each input we build a "context" from its label (sibling <td>,
// <label for>, aria-label, placeholder, name, id). Each DocGalaxy field defines
// one or more RULES (a list of tokens that must ALL be present). A field also
// accepts specific HTML name/id substrings for forms with no visible labels.
// For each input the highest-scoring (most specific) matching field wins.

import { API } from "@/lib/api";

const FIELDS = [
  { f: "purchased_by", rules: [["purchased by"], ["purchased"]], names: ["purchasedby", "purby", "purchaser"] },
  { f: "description_of_document", rules: [["description of document"], ["document description"], ["description"]], names: ["descriptionofdocument", "docdescription", "txtdesc", "descofdoc"] },
  { f: "article", rules: [["article"]], names: ["articleno", "txtarticle"] },
  { f: "consideration_price", rules: [["consideration"]], names: ["considerationprice", "considervalue", "considr", "considamt"] },

  { f: "first_party_name", rules: [["first party", "name"], ["name and address of the first party"]], neg: ["mobile", "phone", "email", "e-mail"], names: ["firstpartyname", "fpname"] },
  { f: "first_party_address1", rules: [["first party", "address"]], neg: ["mobile", "phone", "email", "e-mail"], names: ["firstpartyaddress", "fpaddress"] },
  { f: "first_party_pin", rules: [["first party", "pin"], ["first party", "pincode"]], names: ["firstpartypin", "fppin"] },
  { f: "first_party_pan", rules: [["first party", "pan"]], names: ["firstpartypan", "fppan"] },
  { f: "first_party_mobile", rules: [["first party", "mobile"], ["first party", "phone"], ["first party", "contact"]], names: ["firstpartymobile", "fpmobile", "fpphone"] },
  { f: "first_party_email", rules: [["first party", "email"], ["first party", "e-mail"]], names: ["firstpartyemail", "fpemail"] },

  { f: "second_party_name", rules: [["second party", "name"], ["name and address of the second party"]], neg: ["mobile", "phone", "email", "e-mail"], names: ["secondpartyname", "spname"] },
  { f: "second_party_address1", rules: [["second party", "address"]], neg: ["mobile", "phone", "email", "e-mail"], names: ["secondpartyaddress", "spaddress"] },
  { f: "second_party_pin", rules: [["second party", "pin"], ["second party", "pincode"]], names: ["secondpartypin", "sppin"] },
  { f: "second_party_pan", rules: [["second party", "pan"]], names: ["secondpartypan", "sppan"] },
  { f: "second_party_mobile", rules: [["second party", "mobile"], ["second party", "phone"], ["second party", "contact"]], names: ["secondpartymobile", "spmobile", "spphone"] },
  { f: "second_party_email", rules: [["second party", "email"], ["second party", "e-mail"]], names: ["secondpartyemail", "spemail"] },

  { f: "stamp_duty_amount", rules: [["stamp duty", "amount"], ["duty", "amount"]], names: ["stampdutyamount", "dutyamount", "sdamount"] },
  { f: "stamp_duty_paid_by", rules: [["stamp duty", "paid by"], ["duty", "paid by"], ["paid by"]], names: ["stampdutypaidby", "dutypaidby", "paidby"] },
  { f: "gender", rules: [["gender"]], names: ["gender"] },
  { f: "mode_of_payment", rules: [["mode of payment"], ["payment mode"]], names: ["modeofpayment", "paymentmode"] },
  { f: "proof_of_identity", rules: [["proof of identity"], ["identity proof"]], names: ["proofofidentity", "identityproof"] },
  { f: "proof_of_residence", rules: [["proof of residence"], ["residence proof"]], names: ["proofofresidence", "residenceproof"] },
];

export function buildBookmarklet(order) {
  const url = `${API}/orders/${order.id}/autofill`;
  const fields = JSON.stringify(FIELDS);

  const code = `(function(){try{var URL=${JSON.stringify(url)};var FIELDS=${fields};
function norm(s){return (s||'').toString().toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\\s+/g,' ').trim();}
function setVal(el,val){
 try{
  if(el.tagName==='SELECT'){var ok=false;for(var i=0;i<el.options.length;i++){var ot=norm(el.options[i].text);if(ot&&(ot===norm(val)||ot.indexOf(norm(val))>-1||norm(val).indexOf(ot)>-1)){el.selectedIndex=i;ok=true;break;}}if(!ok)return false;}
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
function scoreField(F,ctx,ctxNS,nm){
 if(F.neg){for(var j=0;j<F.neg.length;j++){var nt=norm(F.neg[j]);if(nt&&ctx.indexOf(nt)>-1)return 0;}}
 var score=0;
 (F.rules||[]).forEach(function(rule){
  var ok=true,s=0;
  rule.forEach(function(tok){var t=norm(tok);var tNS=t.replace(/ /g,'');if(t&&(ctx.indexOf(t)>-1||(tNS&&ctxNS.indexOf(tNS)>-1)))s+=tNS.length;else ok=false;});
  if(ok&&s>score)score=s;
 });
 (F.names||[]).forEach(function(h){var hh=h.toLowerCase().replace(/[^a-z0-9]/g,'');if(hh&&nm.indexOf(hh)>-1&&hh.length>score)score=hh.length;});
 return score;
}
function fill(d){
 var els=document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=password]),textarea,select');
 var diag=[];for(var i=0;i<els.length;i++){var e=els[i];diag.push({tag:e.tagName,type:e.type||'',name:e.name||'',id:e.id||'',label:ctxOf(e).slice(0,70)});}
 try{console.log('%cDocGalaxy Autofill — '+els.length+' fillable field(s) detected on this page:','font-weight:bold;color:#2a4b8d;font-size:13px');if(console.table){console.table(diag);}else{console.log(JSON.stringify(diag,null,2));}}catch(e){}
 var filled=0,matched=[];
 els.forEach(function(el){
  var ctx=ctxOf(el);var ctxNS=ctx.replace(/ /g,'');var nm=nameOf(el);
  var bestF=null,bestScore=0;
  FIELDS.forEach(function(F){var v=d[F.f];if(v==null||String(v).trim()==='')return;var sc=scoreField(F,ctx,ctxNS,nm);if(sc>bestScore){bestScore=sc;bestF=F;}});
  if(bestF){if(setVal(el,String(d[bestF.f]))){filled++;matched.push((el.name||el.id||el.tagName)+' <= '+bestF.f+' = '+d[bestF.f]);try{el.style.outline='2px solid #22c55e';}catch(e){}}}
 });
 try{console.log('%cDocGalaxy Autofill: '+filled+' field(s) filled (strict mapping).','font-weight:bold;color:'+(filled?'#16a34a':'#dc2626'),matched);if(!filled){console.log('No strict matches. Copy the field-name table above and send it so the exact mapping can be set.');}}catch(e){}
 return filled;
}
return fetch(URL,{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){return fill(d);}).catch(function(e){try{console.error('DocGalaxy Autofill fetch error (check Network tab / CORS):',e);}catch(x){}return 0;});
}catch(e){try{console.error('DocGalaxy Autofill error:',e);}catch(x){}}})();`;

  return "javascript:" + encodeURIComponent(code);
}
