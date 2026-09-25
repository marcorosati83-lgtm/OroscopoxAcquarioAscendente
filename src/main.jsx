import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import tzlookup from "tz-lookup";
import "./styles.css";

const SIGNS = [
  { name: "Ariete", symbol: "♈", start: [3,21], end: [4,19], element:"Fuoco", modality:"Cardinale", ruler:"Marte" },
  { name: "Toro", symbol: "♉", start: [4,20], end: [5,20], element:"Terra", modality:"Fisso", ruler:"Venere" },
  { name: "Gemelli", symbol: "♊", start: [5,21], end: [6,20], element:"Aria", modality:"Mutevole", ruler:"Mercurio" },
  { name: "Cancro", symbol: "♋", start: [6,21], end: [7,22], element:"Acqua", modality:"Cardinale", ruler:"Luna" },
  { name: "Leone", symbol: "♌", start: [7,23], end: [8,22], element:"Fuoco", modality:"Fisso", ruler:"Sole" },
  { name: "Vergine", symbol: "♍", start: [8,23], end: [9,22], element:"Terra", modality:"Mutevole", ruler:"Mercurio" },
  { name: "Bilancia", symbol: "♎", start: [9,23], end: [10,22], element:"Aria", modality:"Cardinale", ruler:"Venere" },
  { name: "Scorpione", symbol: "♏", start: [10,23], end: [11,21], element:"Acqua", modality:"Fisso", ruler:"Plutone" },
  { name: "Sagittario", symbol: "♐", start: [11,22], end: [12,21], element:"Fuoco", modality:"Mutevole", ruler:"Giove" },
  { name: "Capricorno", symbol: "♑", start: [12,22], end: [1,19], element:"Terra", modality:"Cardinale", ruler:"Saturno" },
  { name: "Acquario", symbol: "♒", start: [1,20], end: [2,18], element:"Aria", modality:"Fisso", ruler:"Urano" },
  { name: "Pesci", symbol: "♓", start: [2,19], end: [3,20], element:"Acqua", modality:"Mutevole", ruler:"Nettuno" }
];

const SIGN_TEXT = {
  Ariete:"Diretto, energico e spontaneo. Tendi a mostrare iniziativa e a reagire rapidamente.",
  Toro:"Concreto, stabile e sensuale. Trasmetti affidabilità e ami costruire con calma.",
  Gemelli:"Curioso, comunicativo e dinamico. La tua presenza appare vivace e mentalmente agile.",
  Cancro:"Sensibile, protettivo e intuitivo. Puoi apparire accogliente ma anche molto selettivo.",
  Leone:"Caloroso, creativo e sicuro di sé. Hai una presenza che tende a farsi notare.",
  Vergine:"Attento, analitico e pratico. Trasmetti precisione e capacità di osservazione.",
  Bilancia:"Diplomatico, elegante e relazionale. Cerchi armonia e sai adattarti alle situazioni sociali.",
  Scorpione:"Intenso, riservato e penetrante. Puoi trasmettere profondità e magnetismo.",
  Sagittario:"Espansivo, sincero e avventuroso. Trasmetti entusiasmo e desiderio di esplorare.",
  Capricorno:"Riservato, concreto e determinato. Dai un'impressione di serietà e autocontrollo.",
  Acquario:"Indipendente, originale e anticonvenzionale. Trasmetti libertà mentale e autenticità.",
  Pesci:"Empatico, ricettivo e immaginativo. Puoi apparire sensibile e molto percettivo."
};

function norm360(x){ return ((x % 360) + 360) % 360; }

function sunSign(month, day){
  const md = month * 100 + day;
  const ranges = [
    [321,419,0],[420,520,1],[521,620,2],[621,722,3],[723,822,4],[823,922,5],
    [923,1022,6],[1023,1121,7],[1122,1221,8],[1222,1231,9],[101,119,9],
    [120,218,10],[219,320,11]
  ];
  return SIGNS[ranges.find(([a,b]) => md>=a && md<=b)?.[2] ?? 11];
}

// Julian Day from a UTC Date.
function julianDay(date){
  return date.getTime()/86400000 + 2440587.5;
}

// GMST in degrees, Meeus-style approximation.
function gmstDegrees(jd){
  const T = (jd - 2451545.0) / 36525;
  return norm360(
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933*T*T -
    (T*T*T)/38710000
  );
}

// Mean obliquity of the ecliptic.
function obliquityDeg(jd){
  const T = (jd - 2451545.0)/36525;
  return 23.439291111 - 0.013004167*T - 1.64e-7*T*T + 5.04e-7*T*T*T;
}

// Ascendant from local sidereal time, latitude and obliquity.
// Tropical zodiac. Longitude is degrees east.
function ascendantLongitude(lstDeg, latDeg, epsDeg){
  // Standard tropical Ascendant formula using local sidereal time (RAMC).
  // atan2 resolves the quadrant; the result is the eastern/rising point.
  const th = lstDeg * Math.PI / 180;
  const phi = latDeg * Math.PI / 180;
  const eps = epsDeg * Math.PI / 180;
  const asc = Math.atan2(
    Math.cos(th),
    -(Math.sin(th) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))
  ) * 180 / Math.PI;
  return norm360(asc);
}

function degreeToSign(lon){
  const idx = Math.floor(norm360(lon)/30);
  const within = norm360(lon) - idx*30;
  const deg = Math.floor(within);
  const min = Math.round((within-deg)*60);
  const finalDeg = min === 60 ? deg+1 : deg;
  return { sign: SIGNS[idx], degree: finalDeg % 30, minute: min % 60, longitude: norm360(lon) };
}

function localDateToUTC(dateStr, timeStr, timeZone){
  // Iteratively resolve the UTC instant for the supplied local civil time.
  const [y,m,d] = dateStr.split("-").map(Number);
  const [hh,mm] = timeStr.split(":").map(Number);
  let guess = new Date(Date.UTC(y,m-1,d,hh,mm,0));
  for(let i=0;i<4;i++){
    const parts = new Intl.DateTimeFormat("en-US",{
      timeZone, year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", hourCycle:"h23"
    }).formatToParts(guess);
    const get = t => Number(parts.find(p=>p.type===t).value);
    const shown = Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"));
    const desired = Date.UTC(y,m-1,d,hh,mm);
    guess = new Date(guess.getTime() + desired - shown);
  }
  return guess;
}

function calculateAscendant(dateStr,timeStr,lat,lon,timeZone){
  const utc = localDateToUTC(dateStr,timeStr,timeZone);
  const jd = julianDay(utc);
  const lst = norm360(gmstDegrees(jd) + lon);
  const ascLon = ascendantLongitude(lst, lat, obliquityDeg(jd));
  return { ...degreeToSign(ascLon), utc, timeZone };
}

function App(){
  const [form,setForm] = useState({name:"",date:"",time:"12:00",city:"",lat:"",lon:"",timezone:""});
  const [result,setResult] = useState(null);
  const [cityQuery,setCityQuery] = useState("");
  const [cities,setCities] = useState([]);
  const [loadingCities,setLoadingCities] = useState(false);
  const cardRef = useRef(null);

  async function searchCity(){
    if(cityQuery.trim().length < 3) return;
    setLoadingCities(true);
    try{
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(cityQuery)}`;
      const r = await fetch(url, {headers:{Accept:"application/json"}});
      const data = await r.json();
      setCities(data.map(x=>({
        label:x.display_name,
        city:x.address?.city || x.address?.town || x.address?.village || x.address?.municipality || x.name,
        lat:Number(x.lat), lon:Number(x.lon)
      })));
    }catch(e){ setCities([]); }
    finally{ setLoadingCities(false); }
  }

  function selectCity(c){
    const timezone = tzlookup(c.lat,c.lon);
    setForm(f=>({...f,city:c.city || c.label,lat:String(c.lat),lon:String(c.lon),timezone}));
    setCityQuery(c.label);
    setCities([]);
  }

  function calculate(){
    if(!form.date || !form.time || !form.lat || !form.lon) return;
    const [y,m,d] = form.date.split("-").map(Number);
    const sun = sunSign(m,d);
    const asc = calculateAscendant(form.date,form.time,Number(form.lat),Number(form.lon),form.timezone);
    setResult({sun,asc,form});
  }

  async function savePng(){
    if(!cardRef.current) return;
    const data = await toPng(cardRef.current,{pixelRatio:3,cacheBust:true});
    const a=document.createElement("a"); a.download="profilo-astrologico.png"; a.href=data; a.click();
  }

  async function savePdf(){
    if(!cardRef.current) return;
    const data=await toPng(cardRef.current,{pixelRatio:3,cacheBust:true});
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a5"});
    const w=148, h=210;
    pdf.addImage(data,"PNG",0,0,w,h);
    pdf.save("profilo-astrologico.pdf");
  }

  return <main>
    <section className="hero">
      <div className="eyebrow">OROSCOPO ACQUARIO</div>
      <h1>Calcola il tuo<br/><span>Ascendente</span></h1>
      <p>Scopri il tuo segno zodiacale e il tuo Ascendente partendo dai tuoi dati di nascita.</p>
    </section>

    <section className="panel">
      <div className="section-title">I tuoi dati di nascita</div>
      <div className="grid">
        <label>Nome <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Come vuoi apparire nella card"/></label>
        <label>Data di nascita <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label>Ora di nascita <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label>
        <label className="city-field">Luogo di nascita
          <div className="city-search">
            <input value={cityQuery} onChange={e=>setCityQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchCity()} placeholder="Es. Roma, Italia"/>
            <button className="small-btn" onClick={searchCity}>{loadingCities?"…":"Cerca"}</button>
          </div>
          {cities.length>0 && <div className="suggestions">{cities.map((c,i)=><button key={i} onClick={()=>selectCity(c)}>{c.label}</button>)}</div>}
          {form.city && <div className="selected-city">{form.city} · {form.timezone}</div>}
        </label>
      </div>
      <button className="primary" onClick={calculate}>CALCOLA IL MIO PROFILO</button>
      <div className="privacy">Il calcolo viene eseguito nel browser. I dati non vengono salvati automaticamente.</div>
    </section>

    {result && <section className="results">
      <div className="result-card">
        <div className="mini-label">SEGNO ZODIACALE</div>
        <div className="sign-symbol">{result.sun.symbol}</div>
        <h2>{result.sun.name}</h2>
        <p>{SIGN_TEXT[result.sun.name]}</p>
      </div>

      <div className="result-card featured">
        <div className="mini-label">IL TUO ASCENDENTE</div>
        <div className="sign-symbol">{result.asc.sign.symbol}</div>
        <h2>{result.asc.sign.name}</h2>
        <div className="degree">{result.asc.degree}° {String(result.asc.minute).padStart(2,"0")}'</div>
        <div className="facts">
          <span><b>Elemento</b>{result.asc.sign.element}</span>
          <span><b>Modalità</b>{result.asc.sign.modality}</span>
          <span><b>Governatore</b>{result.asc.sign.ruler}</span>
        </div>
        <p>{SIGN_TEXT[result.asc.sign.name]}</p>
      </div>

      <div className="combination">
        <div className="mini-label">LA TUA COMBINAZIONE</div>
        <h3>{result.sun.symbol} {result.sun.name} <span>+</span> ↑ {result.asc.sign.name}</h3>
        <p>Il segno solare descrive la tua identità di base; l'Ascendente rappresenta il modo in cui ti presenti e il primo impatto che puoi trasmettere agli altri.</p>
      </div>

      <div className="actions">
        <button className="primary" onClick={savePng}>SALVA CARD</button>
        <button className="secondary" onClick={savePdf}>STAMPA / PDF</button>
      </div>

      <div className="astro-card" ref={cardRef}>
        <div className="card-brand">@oroscopoxacquario</div>
        <div className="card-title">IL MIO PROFILO<br/>ASTROLOGICO</div>
        {result.form.name && <div className="card-name">{result.form.name}</div>}
        <div className="card-pair">
          <div><span>☀</span><b>{result.sun.symbol} {result.sun.name}</b><small>SEGNO SOLARE</small></div>
          <div><span>↑</span><b>{result.asc.sign.symbol} {result.asc.sign.name}</b><small>ASCENDENTE</small><strong>{result.asc.degree}° {String(result.asc.minute).padStart(2,"0")}'</strong></div>
        </div>
        <div className="card-data">
          <span>DATA <b>{new Date(result.form.date+"T12:00").toLocaleDateString("it-IT")}</b></span>
          <span>ORA <b>{result.form.time}</b></span>
          <span>LUOGO <b>{result.form.city}</b></span>
        </div>
        <div className="card-footer">Instagram · Facebook</div>
      </div>
    </section>}
  </main>
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

createRoot(document.getElementById("root")).render(<App />);