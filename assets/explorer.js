/* Wearable AI Explorer: interactive models.
   Companion to Huang G, Chen X, Liao C. AI-Driven Wearable Bioelectronics in Digital Healthcare.
   Biosensors 2025, 15(7), 410. doi:10.3390/bios15070410
   No libraries and no network calls: everything is drawn as inline SVG. */
(function(){
const $=s=>document.querySelector(s);
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const NS="http://www.w3.org/2000/svg";
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function txt(parent,x,y,s,attrs){const t=el("text",Object.assign({x,y,"font-size":12,"font-family":"IBM Plex Sans, Arial, sans-serif",fill:css("--muted")},attrs||{}),parent);t.textContent=s;return t;}
function svgIn(container,w,h){let s=container.querySelector("svg");if(s)s.remove();s=el("svg",{viewBox:`0 0 ${w} ${h}`,role:"img"});container.appendChild(s);return s;}
function tipFor(container){let t=container.querySelector(".tip");if(!t){t=document.createElement("div");t.className="tip";t.hidden=true;container.appendChild(t);}return t;}
function showTip(container,tip,evt,lines){tip.replaceChildren();const s=document.createElement("strong");s.textContent=lines[0];tip.appendChild(s);for(const l of lines.slice(1)){const d=document.createElement("div");d.textContent=l;tip.appendChild(d);}tip.hidden=false;const r=container.getBoundingClientRect();let x=evt.clientX-r.left+14,y=evt.clientY-r.top+14;if(x+170>r.width)x=evt.clientX-r.left-180;tip.style.left=x+"px";tip.style.top=y+"px";}
const fmtPct=(v,d=1)=>(v*100).toFixed(d)+" %";
function widthOf(c){return Math.max(320,Math.min(760,c.clientWidth||600));}

/* ---------- 1. sampling ---------- */
const S={seed:7};
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function durMin(){return Math.round(Math.pow(10,+$("#dur").value));}
function fmtDur(m){return m<60?m+" min":(m%60===0?(m/60)+" h":(m/60).toFixed(1)+" h");}
function sampling(){
  const perMonth=Math.pow(10,+$("#rate").value), lam=perMonth/30.44; // per day
  const d=durMin()/1440, visits=+$("#visits").value, wear=+$("#wear").value/100;
  $("#rateV").textContent=perMonth<1?perMonth.toFixed(2):perMonth.toFixed(1);
  $("#durV").textContent=fmtDur(durMin()); $("#visitsV").textContent=visits; $("#wearV").textContent=Math.round(wear*100)+" %";
  const P=T=>1-Math.exp(-lam*(T+d));
  const pVisit=P(10/86400), pClinic=1-Math.pow(1-pVisit,visits);
  const burden=1-Math.exp(-lam*d); // fraction of time in episode (approx.)
  const rows=[
    {k:"Clinic ECG × "+visits+"/yr (10 s each)",p:pClinic,c:"--base"},
    {k:"24-h Holter, once",p:P(1),c:"--s2"},
    {k:"14-day patch, once",p:P(14),c:"--s3"},
    {k:"Smartwatch, 1 yr at "+Math.round(wear*100)+" % wear",p:P(365*wear),c:"--s1"}
  ];
  const ro=$("#sampRO");ro.replaceChildren();
  [[fmtPct(burden,burden<0.01?2:1),"of time spent in an episode (burden)"],[(perMonth*12).toFixed(0),"episodes per year on average"],[fmtPct(pClinic,pClinic<0.01?2:1),"chance clinic ECGs record one"],[fmtPct(rows[3].p,0),"chance the smartwatch records one"]].forEach(([n,l])=>{const b=document.createElement("div");b.className="ro";const a=document.createElement("div");a.className="n";a.textContent=n;const c=document.createElement("div");c.className="l";c.textContent=l;b.append(a,c);ro.appendChild(b);});
  // bar chart
  const box=$("#capChart"), W=widthOf(box), H=36*rows.length+40, L=Math.min(250,W*0.42), R=W-56;
  const svg=svgIn(box,W,H); svg.setAttribute("aria-label","Capture probability by monitoring strategy");
  for(const g of [0,.25,.5,.75,1]){const x=L+(R-L)*g;el("line",{x1:x,x2:x,y1:6,y2:H-26,stroke:css("--grid")},svg);txt(svg,x,H-8,Math.round(g*100)+"%",{"text-anchor":"middle"});}
  const tip=tipFor(box);
  rows.forEach((r,i)=>{const y=10+i*36;txt(svg,L-10,y+17,r.k,{"text-anchor":"end",fill:css("--ink2"),"font-size":12.5});
    const w=Math.max(2,(R-L)*r.p);const bar=el("rect",{x:L,y:y+4,width:w,height:20,rx:4,fill:css(r.c)},svg);
    txt(svg,L+w+6,y+19,fmtPct(r.p,r.p<0.01?2:0),{fill:css("--ink"),"font-weight":600,"font-family":"IBM Plex Mono, monospace"});
    const hit=el("rect",{x:0,y:y,width:W,height:30,fill:"transparent",tabindex:0},svg);
    hit.addEventListener("pointermove",e=>showTip(box,tip,e,[fmtPct(r.p,2),r.k]));hit.addEventListener("pointerleave",()=>tip.hidden=true);
    hit.addEventListener("focus",()=>{const rr=hit.getBoundingClientRect();showTip(box,tip,{clientX:rr.left+L,clientY:rr.top},[fmtPct(r.p,2),r.k]);});hit.addEventListener("blur",()=>tip.hidden=true);
  });
  // simulated year
  const rnd=rng(S.seed); const eps=[]; let t=0; while(true){t+=-Math.log(1-rnd())/lam; if(t>365)break; eps.push(t);}
  const visitDays=Array.from({length:visits},(_,i)=>(i+0.5)*365/visits);
  const wearStart=rnd()*365*(1-wear);
  const yb=$("#yearChart"), YW=widthOf(yb), YH=150, x0=16, x1=YW-16, X=v=>x0+(x1-x0)*v/365;
  const ys=svgIn(yb,YW,YH); ys.setAttribute("aria-label","Simulated year of episodes with recording windows");
  const lanes=[["Episodes",20],["Clinic ECG",62],["Smartwatch",104]];
  lanes.forEach(([n,y])=>{txt(ys,x0,y-6,n,{fill:css("--ink2"),"font-size":12});el("line",{x1:x0,x2:x1,y1:y+12,y2:y+12,stroke:css("--grid")},ys);});
  el("rect",{x:X(wearStart),y:104,width:Math.max(2,X(wearStart+365*wear)-X(wearStart)),height:24,rx:4,fill:css("--s1"),opacity:.18},ys);
  let capW=0,capC=0;
  eps.forEach(e=>{const w=Math.max(1.5,X(e+d)-X(e));el("rect",{x:X(e),y:22,width:w,height:18,fill:css("--ink2"),opacity:.75},ys);
    const inWear=e+d>wearStart&&e<wearStart+365*wear; if(inWear){capW++;el("rect",{x:X(e),y:106,width:w,height:20,fill:css("--s1")},ys);}
    if(visitDays.some(v=>v>=e&&v<=e+d+10/86400)){capC++;}});
  visitDays.forEach(v=>{const hit=visitDays.length&&eps.some(e=>v>=e&&v<=e+d);el("circle",{cx:X(v),cy:74,r:6,fill:hit?css("--s2"):"none",stroke:css("--base"),"stroke-width":2},ys);});
  ["Jan","Apr","Jul","Oct","Dec"].forEach((m,i)=>txt(ys,X([0,90,181,273,364][i]),YH-4,m,{"text-anchor":i===4?"end":"start","font-size":11}));
  const lg=$("#yearLegend");lg.replaceChildren();
  [["--ink2",eps.length+" episodes this year"],["--base","clinic visits: "+capC+" recorded"],["--s1","smartwatch: "+capW+" recorded"]].forEach(([c,s])=>{const sp=document.createElement("span");const i=document.createElement("i");i.className="sw";i.style.background=css(c);sp.append(i,document.createTextNode(s));lg.appendChild(sp);});
}
["#rate","#dur","#visits","#wear"].forEach(s=>$(s).addEventListener("input",sampling));
$("#resample").addEventListener("click",()=>{S.seed=(S.seed*48271+11)%2147483647;sampling();});

/* ---------- 2. screening ---------- */
const T5=[
 {n:"Deep-learning CNN",t:"Diabetic retinopathy · fundus images",se:90.5,sp:91.6,auc:"0.963",set:"Primary care clinics",poc:false},
 {n:"AI-Rad Companion (Siemens)",t:"Lung nodules · chest CT",se:92.0,sp:86.5,auc:"0.94",set:"Radiology",poc:false},
 {n:"Aidoc",t:"Intracranial hemorrhage · head CT",se:89.4,sp:93.6,auc:"0.91",set:"Emergency departments",poc:false},
 {n:"Google Health AI",t:"Breast cancer · mammography",se:89.0,sp:94.5,auc:"0.945",set:"Retrospective multicenter",poc:false},
 {n:"PathAI",t:"Breast histopathology · H&E slides",se:94.6,sp:93.8,auc:"0.98",set:"Pathology labs",poc:false},
 {n:"Tempus xT",t:"Oncology genomics · NGS + clinical",se:88.0,sp:85.0,auc:"0.87",set:"Clinical decision support",poc:false},
 {n:"SkinVision",t:"Melanoma risk · smartphone photos",se:95.1,sp:78.3,auc:"0.89",set:"Self-screening",poc:true},
 {n:"Eko AI",t:"Heart murmur · digital stethoscope",se:87.6,sp:91.1,auc:"0.90",set:"Point of care",poc:true}
];
const Z={sel:6};
const sel=$("#sys");
T5.forEach((r,i)=>{const o=document.createElement("option");o.value=i;o.textContent=r.n+" — "+r.t;sel.appendChild(o);});
const oc=document.createElement("option");oc.value="c";oc.textContent="Custom (use the sliders)";sel.appendChild(oc);
const tb=$("#t5 tbody");
T5.forEach((r,i)=>{const tr=document.createElement("tr");tr.dataset.i=i;tr.tabIndex=0;[r.n,r.t,r.se.toFixed(1),r.sp.toFixed(1),r.auc,r.set].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});tr.addEventListener("click",()=>pick(i));tr.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(i);}});tb.appendChild(tr);});
function pick(i){Z.sel=i;sel.value=String(i);$("#se").value=T5[i].se;$("#sp").value=T5[i].sp;screening();}
sel.addEventListener("change",()=>{if(sel.value==="c"){Z.sel=-1;screening();}else pick(+sel.value);});
["#se","#sp"].forEach(s=>$(s).addEventListener("input",()=>{Z.sel=-1;sel.value="c";screening();}));
$("#prev").addEventListener("input",screening);
const ppv=(se,sp,p)=>se*p/(se*p+(1-sp)*(1-p));
const npv=(se,sp,p)=>sp*(1-p)/(sp*(1-p)+(1-se)*p);
function fmtPrev(p){return p<0.01?(p*100).toFixed(2)+" %":(p*100).toFixed(1)+" %";}
function screening(){
  const se=+$("#se").value/100, sp=+$("#sp").value/100, p=Math.pow(10,+$("#prev").value);
  $("#seV").textContent=(se*100).toFixed(1)+" %";$("#spV").textContent=(sp*100).toFixed(1)+" %";$("#prevV").textContent=fmtPrev(p);
  [...tb.children].forEach(tr=>tr.classList.toggle("sel",+tr.dataset.i===Z.sel));
  const PPV=ppv(se,sp,p),NPV=npv(se,sp,p),fpPerTp=((1-sp)*(1-p))/(se*p);
  const ro=$("#ppvRO");ro.replaceChildren();
  [[fmtPct(PPV,1),"of positive alerts are true (PPV)"],[fmtPct(NPV,2),"of negatives are true (NPV)"],[fpPerTp<10?fpPerTp.toFixed(1):Math.round(fpPerTp).toString(),"false alarms per true case found"]].forEach(([n,l])=>{const b=document.createElement("div");b.className="ro";const a=document.createElement("div");a.className="n";a.textContent=n;const c=document.createElement("div");c.className="l";c.textContent=l;b.append(a,c);ro.appendChild(b);});
  drawROC(se,sp); drawPPV(se,sp,p); drawIcons(se,sp,p);
}
function drawROC(se,sp){
  const box=$("#rocChart"),W=widthOf(box),H=Math.round(W*0.66),L=48,Rr=W-16,Tp=14,B=H-40;
  const fx=f=>L+(Rr-L)*f/0.3, fy=t=>Tp+(B-Tp)*(1-t)/0.2;
  const s=svgIn(box,W,H);s.setAttribute("aria-label","ROC scatter of Table 5 systems");
  el("rect",{x:fx(0),y:fy(1),width:fx(0.2)-fx(0),height:fy(0.99)-fy(1),fill:css("--zone"),stroke:css("--zone-line"),"stroke-dasharray":"5 4"},s);
  for(let f=0;f<=0.3001;f+=0.05){el("line",{x1:fx(f),x2:fx(f),y1:Tp,y2:B,stroke:css("--grid")},s);txt(s,fx(f),B+16,f.toFixed(2),{"text-anchor":"middle"});}
  for(let t=0.8;t<=1.0001;t+=0.05){el("line",{x1:L,x2:Rr,y1:fy(t),y2:fy(t),stroke:css("--grid")},s);txt(s,L-8,fy(t)+4,t.toFixed(2),{"text-anchor":"end"});}
  txt(s,(L+Rr)/2,H-4,"False-positive rate (1 − specificity)",{"text-anchor":"middle",fill:css("--ink2")});
  txt(s,L+6,B-8,"Sensitivity ↑",{fill:css("--ink2")});
  txt(s,fx(0.2)-4,fy(0.99)+14,"benchmark zone: empty",{"text-anchor":"end",fill:css("--ink2"),"font-size":11.5});
  const tip=tipFor(box);
  T5.forEach((r,i)=>{const cx=fx(1-r.sp/100),cy=fy(r.se/100),on=i===Z.sel;
    el("circle",{cx,cy,r:on?9:6,fill:css(r.poc?"--s1":"--s2"),stroke:css("--surface"),"stroke-width":2},s);
    if(on)el("circle",{cx,cy,r:14,fill:"none",stroke:css("--ink"),"stroke-width":1.5},s);
    const h=el("circle",{cx,cy,r:14,fill:"transparent",tabindex:0,style:"cursor:pointer"},s);
    const lines=["Se "+r.se.toFixed(1)+" % · Sp "+r.sp.toFixed(1)+" %",r.n,r.t];
    h.addEventListener("pointermove",e=>showTip(box,tip,e,lines));h.addEventListener("pointerleave",()=>tip.hidden=true);
    h.addEventListener("click",()=>pick(i));h.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(i);}});
  });
  if(Z.sel===-1){el("path",{d:`M${fx(1-sp)-7},${fy(se)} h14 M${fx(1-sp)},${fy(se)-7} v14`,stroke:css("--ink"),"stroke-width":2},s);}
}
function drawPPV(se,sp,p){
  const box=$("#ppvChart"),W=widthOf(box),H=Math.round(W*0.6),L=46,Rr=W-14,Tp=12,B=H-40;
  const lx=v=>L+(Rr-L)*(Math.log10(v)+3)/2.7, ly=v=>Tp+(B-Tp)*(1-v);
  const s=svgIn(box,W,H);s.setAttribute("aria-label","PPV versus prevalence");
  [0.001,0.003,0.01,0.03,0.1,0.3,0.5].forEach(v=>{el("line",{x1:lx(v),x2:lx(v),y1:Tp,y2:B,stroke:css("--grid")},s);txt(s,lx(v),B+16,(v*100)+"%",{"text-anchor":"middle"});});
  [0,.25,.5,.75,1].forEach(v=>{el("line",{x1:L,x2:Rr,y1:ly(v),y2:ly(v),stroke:css("--grid")},s);txt(s,L-8,ly(v)+4,Math.round(v*100)+"%",{"text-anchor":"end"});});
  txt(s,(L+Rr)/2,H-4,"Prevalence among people tested (log scale)",{"text-anchor":"middle",fill:css("--ink2")});
  const curve=(a,b)=>{let d="";for(let k=0;k<=120;k++){const v=Math.pow(10,-3+2.7*k/120);d+=(k?"L":"M")+lx(v).toFixed(1)+","+ly(ppv(a,b,v)).toFixed(1);}return d;};
  T5.forEach((r,i)=>{if(i!==Z.sel)el("path",{d:curve(r.se/100,r.sp/100),fill:"none",stroke:css("--base"),"stroke-width":1,opacity:.6},s);});
  el("path",{d:curve(se,sp),fill:"none",stroke:css("--s1"),"stroke-width":2.5},s);
  el("line",{x1:lx(p),x2:lx(p),y1:Tp,y2:B,stroke:css("--ink2"),"stroke-dasharray":"4 4"},s);
  el("circle",{cx:lx(p),cy:ly(ppv(se,sp,p)),r:6,fill:css("--s1"),stroke:css("--surface"),"stroke-width":2},s);
  const tip=tipFor(box), cross=el("line",{x1:0,x2:0,y1:Tp,y2:B,stroke:css("--muted"),"stroke-width":1,opacity:0},s);
  const hit=el("rect",{x:L,y:Tp,width:Rr-L,height:B-Tp,fill:"transparent"},s);
  hit.addEventListener("pointermove",e=>{const r=s.getBoundingClientRect(),sx=(e.clientX-r.left)*W/r.width;const v=Math.pow(10,(sx-L)/(Rr-L)*2.7-3);cross.setAttribute("x1",sx);cross.setAttribute("x2",sx);cross.setAttribute("opacity",1);showTip(box,tip,e,["PPV "+fmtPct(ppv(se,sp,v),1),"at prevalence "+fmtPrev(v),Z.sel>=0?T5[Z.sel].n:"Custom Se/Sp"]);});
  hit.addEventListener("pointerleave",()=>{tip.hidden=true;cross.setAttribute("opacity",0);});
}
function drawIcons(se,sp,p){
  const N=1000,pos=Math.round(N*p),tp=Math.round(pos*se),fn=pos-tp,neg=N-pos,fp=Math.round(neg*(1-sp)),tn=neg-fp;
  const box=$("#icons");box.replaceChildren();
  const cats=[["--s3",tp,"true positives"],["--s4",fn,"missed cases (false negatives)"],["--s1",fp,"false alarms (false positives)"],["--tn",tn,"true negatives"]];
  for(const [c,n] of cats)for(let k=0;k<n;k++){const i=document.createElement("i");i.style.background=css(c);box.appendChild(i);}
  box.setAttribute("aria-label",`Of 1,000 people: ${tp} true positives, ${fn} missed, ${fp} false alarms, ${tn} true negatives`);
  const lg=$("#iconLegend");lg.replaceChildren();
  cats.forEach(([c,n,l])=>{const sp_=document.createElement("span");const i=document.createElement("i");i.className="sw";i.style.background=css(c);i.style.borderRadius="50%";const b=document.createElement("b");b.textContent=n;sp_.append(i,b,document.createTextNode(" "+l));lg.appendChild(sp_);});
}

/* ---------- 3. power ---------- */
const TIERS=[
 {k:"100 mW",w:0.1,l:"Earlier cloud-dependent analysis cycle"},
 {k:"5 mW",w:0.005,l:"TinyML / spiking network per analysis"},
 {k:"1 mW",w:0.001,l:"Continuous multi-analyte system"},
 {k:"10 µW",w:0.00001,l:"Neuromorphic target (2027–29)"}
];
const Pw={sel:1};
const seg=$("#tierSeg");
TIERS.forEach((t,i)=>{const b=document.createElement("button");b.type="button";b.textContent=t.k;b.setAttribute("aria-pressed",i===Pw.sel);b.addEventListener("click",()=>{Pw.sel=i;[...seg.children].forEach((c,j)=>c.setAttribute("aria-pressed",j===i));power();});seg.appendChild(b);});
function fmtTime(h){if(h<48)return h.toFixed(h<10?1:0)+" h";const d=h/24;if(d<60)return d.toFixed(d<10?1:0)+" days";if(d<730)return (d/30.44).toFixed(1)+" months";return (d/365.25).toFixed(d/365.25<10?1:0)+" years";}
function power(){
  const mah=+$("#mah").value, duty=+$("#duty").value/100, Wh=mah*3.7/1000;
  $("#mahV").textContent=mah+" mAh · "+Wh.toFixed(2)+" Wh";$("#dutyV").textContent=Math.round(duty*100)+" %";
  const rows=TIERS.map(t=>({...t,h:Wh/(t.w*duty)}));
  const s=rows[Pw.sel];
  const ro=$("#powRO");ro.replaceChildren();
  [[fmtTime(s.h),"runtime at "+s.k+" · "+s.l],[(rows[0].h>0?(s.h/rows[0].h):0).toFixed(0)+"×","longer than the 100 mW cloud-era cycle"],[(Wh*1000).toFixed(0)+" mWh","energy in the battery"]].forEach(([n,l])=>{const b=document.createElement("div");b.className="ro";const a=document.createElement("div");a.className="n";a.textContent=n;const c=document.createElement("div");c.className="l";c.textContent=l;b.append(a,c);ro.appendChild(b);});
  const box=$("#powChart"),W=widthOf(box),H=44*rows.length+48,L=Math.min(250,W*0.4),R=W-70;
  const lo=0,hi=6; // log10 hours: 1 h .. 1e6 h (~114 yr)
  const X=h=>L+(R-L)*(Math.min(hi,Math.max(lo,Math.log10(h)))-lo)/(hi-lo);
  const svg=svgIn(box,W,H);svg.setAttribute("aria-label","Runtime by power tier, log scale");
  [[1,"1 h"],[24,"1 day"],[168,"1 wk"],[730,"1 mo"],[8766,"1 yr"],[87660,"10 yr"],[876600,"100 yr"]].forEach(([h,l])=>{el("line",{x1:X(h),x2:X(h),y1:6,y2:H-28,stroke:css("--grid")},svg);txt(svg,X(h),H-10,l,{"text-anchor":"middle"});});
  const tip=tipFor(box);
  rows.forEach((r,i)=>{const y=10+i*44,on=i===Pw.sel;txt(svg,L-10,y+14,r.k,{"text-anchor":"end",fill:css("--ink"),"font-weight":600,"font-family":"IBM Plex Mono, monospace"});txt(svg,L-10,y+30,r.l,{"text-anchor":"end","font-size":11});
    const w=Math.max(3,X(r.h)-L);el("rect",{x:L,y:y+6,width:w,height:22,rx:4,fill:css(on?"--s1":"--base")},svg);
    txt(svg,L+w+6,y+22,fmtTime(r.h),{fill:css("--ink"),"font-weight":600,"font-family":"IBM Plex Mono, monospace"});
    const hit=el("rect",{x:0,y:y,width:W,height:40,fill:"transparent"},svg);
    hit.addEventListener("pointermove",e=>showTip(box,tip,e,[fmtTime(r.h),r.k+" · "+r.l]));hit.addEventListener("pointerleave",()=>tip.hidden=true);
  });
}
["#mah","#duty"].forEach(s=>$(s).addEventListener("input",power));

function all(){sampling();screening();power();}
pick(6); sampling(); power();
let rt;window.addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(all,120);});
if(window.matchMedia)matchMedia("(prefers-color-scheme: dark)").addEventListener("change",all);
new MutationObserver(all).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
})();

/* ---------- theme switch ----------
   On claude.ai the host page offered a light/dark switch; on GitHub Pages the page provides its own.
   Auto follows the operating system. The charts redraw on change through the observer above. */
(function(){
  const btn=document.getElementById("themeBtn"); if(!btn) return;
  const root=document.documentElement, order=["auto","light","dark"];
  const name={auto:"Auto",light:"Light",dark:"Dark"};
  const current=()=>{const t=root.getAttribute("data-theme");return t==="light"||t==="dark"?t:"auto";};
  function render(){const m=current();btn.querySelector("span").textContent="Theme: "+name[m];btn.setAttribute("aria-label","Colour theme: "+name[m]+". Select to change.");}
  btn.addEventListener("click",()=>{
    const next=order[(order.indexOf(current())+1)%order.length];
    if(next==="auto")root.removeAttribute("data-theme");else root.setAttribute("data-theme",next);
    try{if(next==="auto")localStorage.removeItem("wax-theme");else localStorage.setItem("wax-theme",next);}catch(e){}
    render();
  });
  render();
})();
