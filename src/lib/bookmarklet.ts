export function buildBookmarklet(appUrl: string, token: string): string {
  const body = `(async()=>{try{const r=await fetch(${JSON.stringify(`${appUrl}/api/properties`)},{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+${JSON.stringify(token)}},body:JSON.stringify({url:location.href,html:document.documentElement.outerHTML})});const d=await r.json();if(r.ok){alert("Saved: "+(d.property&&(d.property.addressLine||d.property.title)||"property"));}else{alert("Error: "+(d.error||r.statusText));}}catch(e){alert("Error: "+e.message);}})()`;
  return `javascript:${encodeURIComponent(body)}`;
}
