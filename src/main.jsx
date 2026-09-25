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

const ASC_PROFILES = {
  Ariete: { mind:"Diretto e reattivo. Ti muovi con iniziativa e preferisci passare all’azione invece di aspettare.", love:"In amore sei spontaneo e intenso. Hai bisogno di entusiasmo, sincerità e di sentirti libero di essere te stesso.", others:"Vieni percepito come energico, deciso e difficile da ignorare. La tua immediatezza può colpire al primo incontro.", strengths:["Iniziativa", "Coraggio", "Spontaneità", "Determinazione"], challenges:["Impazienza", "Impulsività", "Reazioni rapide"], advice:"Usa la tua energia per aprire strade, lasciando però spazio all’ascolto e alla pazienza." },
  Toro: { mind:"Concreto e paziente. Preferisci costruire qualcosa di solido e tendi a fidarti di ciò che puoi verificare.", love:"Cerchi stabilità, presenza e gesti concreti. Quando ti leghi, puoi essere molto costante e protettivo.", others:"Trasmetti calma, affidabilità e una certa solidità. Puoi apparire più tranquillo di quanto tu sia interiormente.", strengths:["Costanza", "Affidabilità", "Praticità", "Pazienza"], challenges:["Testardaggine", "Resistenza al cambiamento", "Possessività"], advice:"La tua stabilità è una risorsa: ricordati però che cambiare direzione non significa perdere sicurezza." },
  Gemelli: { mind:"Curioso e rapido. Hai bisogno di stimoli, confronto e nuove informazioni per sentirti davvero coinvolto.", love:"Ti conquista la mente prima di tutto. Cerchi dialogo, ironia e una relazione che non diventi monotona.", others:"Appari socievole, brillante e mentalmente veloce. Le persone possono percepirti come difficile da incasellare.", strengths:["Curiosità", "Comunicazione", "Adattabilità", "Prontezza"], challenges:["Discontinuità", "Nervosismo", "Eccesso di pensieri"], advice:"Scegli gli stimoli che meritano davvero la tua attenzione e porta fino in fondo le idee più importanti." },
  Cancro: { mind:"Sensibile e intuitivo. Leggi facilmente l’atmosfera e spesso percepisci ciò che gli altri non dicono.", love:"Hai bisogno di fiducia e sicurezza emotiva. Quando ti senti accolto, sai essere profondamente presente.", others:"Puoi apparire accogliente, prudente e molto percettivo. Non concedi subito accesso alla tua parte più privata.", strengths:["Empatia", "Intuito", "Protezione", "Memoria"], challenges:["Permalosità", "Chiusura", "Eccessiva prudenza"], advice:"Proteggi la tua sensibilità senza trasformarla in una barriera: scegliere chi far entrare è diverso dal chiudersi." },
  Leone: { mind:"Caloroso, creativo e sicuro della tua presenza. Hai bisogno di esprimerti e di lasciare un’impronta personale.", love:"Cerchi autenticità, lealtà e coinvolgimento. Ti piace sentirti scelto e apprezzato senza rinunciare alla tua autonomia.", others:"Forte, solare e magnetico. Trasmetti energia e creatività e spesso vieni notato anche senza cercarlo.", strengths:["Carisma", "Creatività", "Generosità", "Presenza"], challenges:["Orgoglio", "Bisogno di approvazione", "Difficoltà con le critiche"], advice:"Fai brillare la tua personalità senza dover dimostrare continuamente il tuo valore: la tua presenza parla già per te." },
  Vergine: { mind:"Analitico e osservatore. Noti dettagli, incongruenze e possibilità di miglioramento prima di molti altri.", love:"Preferisci gesti concreti alle grandi dichiarazioni. La fiducia cresce con il tempo e con la coerenza.", others:"Preciso, composto e affidabile. Puoi apparire molto esigente, soprattutto quando qualcosa ti sta davvero a cuore.", strengths:["Analisi", "Precisione", "Organizzazione", "Affidabilità"], challenges:["Autocritica", "Perfezionismo", "Eccesso di controllo"], advice:"Non aspettare che tutto sia perfetto per goderti ciò che hai costruito: lascia spazio anche all’imprevisto." },
  Bilancia: { mind:"Diplomatico e relazionale. Valuti più prospettive e cerchi un equilibrio che non sia solo apparente.", love:"La relazione per te è dialogo, complicità e reciprocità. Ti attrae chi sa parlare e ascoltare.", others:"Elegante, disponibile e socievole. Puoi trasmettere equilibrio anche quando dentro stai ancora valutando cosa scegliere.", strengths:["Diplomazia", "Empatia", "Gusto", "Mediazione"], challenges:["Indecisione", "Eccesso di compromesso", "Evitare il conflitto"], advice:"Cercare armonia non significa rinunciare alla tua posizione: impara a dire ciò che vuoi con chiarezza." },
  Scorpione: { mind:"Intenso e penetrante. Preferisci capire davvero le persone e le situazioni prima di mostrare completamente le tue carte.", love:"Cerchi profondità, lealtà e autenticità. Le relazioni superficiali tendono a interessarti poco.", others:"Magnetico, riservato e difficile da leggere. La tua intensità può creare curiosità anche quando parli poco.", strengths:["Profondità", "Determinazione", "Intuito", "Lealtà"], challenges:["Diffidenza", "Rigidità", "Tendenza a trattenere"], advice:"La tua profondità è potente: usala per comprendere, non per proteggerti da ogni possibile delusione." },
  Sagittario: { mind:"Espansivo e curioso. Hai bisogno di prospettive ampie, esperienze e della sensazione di poter scegliere la tua direzione.", love:"Cerchi complicità, sincerità e spazio personale. Ti innamora chi sa condividere entusiasmo senza soffocarti.", others:"Solare, diretto e avventuroso. Puoi dare l’impressione di avere sempre una nuova idea o una nuova strada davanti.", strengths:["Ottimismo", "Visione", "Entusiasmo", "Sincerità"], challenges:["Irrequietezza", "Eccesso di franchezza", "Discontinuità"], advice:"Conserva il tuo slancio, ma ricorda che anche la libertà cresce quando impari a portare a termine ciò che inizi." },
  Capricorno: { mind:"Concreto e strategico. Valuti obiettivi, tempi e conseguenze prima di muoverti.", love:"Dimostri affetto soprattutto con presenza e responsabilità. La fiducia per te si costruisce con i fatti.", others:"Serio, composto e affidabile. Puoi sembrare più controllato di quanto sia il tuo mondo interiore.", strengths:["Disciplina", "Responsabilità", "Resistenza", "Strategia"], challenges:["Rigidità", "Eccesso di controllo", "Difficoltà a mostrarti vulnerabile"], advice:"La tua capacità di reggere il peso delle cose è preziosa: concediti anche leggerezza e spontaneità." },
  Acquario: { mind:"Indipendente e originale. Ti piace osservare il mondo da una prospettiva diversa e mettere in discussione ciò che dai per scontato.", love:"Cerchi complicità mentale e libertà. Hai bisogno di sentirti scelto senza percepire la relazione come una gabbia.", others:"Originale, indipendente e imprevedibile. Puoi lasciare l’impressione di essere sempre un passo fuori dagli schemi.", strengths:["Originalità", "Visione", "Autonomia", "Creatività"], challenges:["Distacco", "Testardaggine mentale", "Bisogno di spazio"], advice:"Difendi la tua unicità, ma ricorda che lasciarsi coinvolgere non significa perdere la propria libertà." },
  Pesci: { mind:"Ricettivo e immaginativo. Assorbi facilmente atmosfere e sfumature e spesso segui ciò che senti prima di razionalizzarlo.", love:"Hai bisogno di connessione emotiva, gentilezza e comprensione. Quando ti senti al sicuro, dai molto.", others:"Dolce, intuitivo e sfuggente. Le persone possono percepire una sensibilità che non mostri subito a parole.", strengths:["Empatia", "Immaginazione", "Intuito", "Sensibilità"], challenges:["Confini deboli", "Idealizzazione", "Sovraccarico emotivo"], advice:"La sensibilità è una bussola, non un limite: proteggila con confini chiari e scelte concrete." }
};

function buildCombination(sun, asc){
  const p=ASC_PROFILES[asc.name];
  return {
    headline:`${sun.name} con Ascendente ${asc.name}`,
    intro:`La tua identità solare in ${sun.name} incontra il modo di mostrarti al mondo tipico dell’Ascendente ${asc.name}. ${p.others}`
  };
}

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
    setResult({sun,asc,form,profile:ASC_PROFILES[asc.sign.name],combo:buildCombination(sun,asc.sign)});
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
        <h3>{result.sun.symbol} {result.combo.headline}</h3>
        <p>{result.combo.intro}</p>
      </div>

      <div className="actions">
        <button className="primary" onClick={savePng}>SALVA CARD</button>
        <button className="secondary" onClick={savePdf}>STAMPA / PDF</button>
      </div>

      <div className="astro-card" ref={cardRef}>
        <div className="card-hero">
          <img src="/assets/kairo-panda.png" alt="Kairo Panda" />
          <div className="hero-overlay"></div>
          <div className="card-hero-copy">
            <div className="card-kicker">IL MIO PROFILO</div>
            <div className="card-title">ASTROLOGICO</div>
            {result.form.name && <div className="card-name">{result.form.name}</div>}
          </div>
          <div className="card-birth">
            <span>DATA <b>{new Date(result.form.date+"T12:00").toLocaleDateString("it-IT")}</b></span>
            <span>ORA <b>{result.form.time}</b></span>
            <span>LUOGO <b>{result.form.city}</b></span>
          </div>
        </div>

        <div className="card-signs">
          <div className="card-sign solar"><div className="sign-orb">{result.sun.symbol}</div><div><small>SEGNO SOLARE</small><b>{result.sun.name}</b><span>{result.sun.element} · {result.sun.modality} · {result.sun.ruler}</span></div></div>
          <div className="plus">+</div>
          <div className="card-sign rising"><div className="sign-orb">{result.asc.sign.symbol}</div><div><small>ASCENDENTE</small><b>{result.asc.sign.name}</b><span>{result.asc.sign.element} · {result.asc.sign.modality} · {result.asc.sign.ruler}</span></div><strong>{result.asc.degree}° {String(result.asc.minute).padStart(2,"0")}'</strong></div>
        </div>

        <div className="card-combo">
          <div className="mini-label">LA TUA COMBINAZIONE</div>
          <h4>{result.sun.name} con Ascendente {result.asc.sign.name}</h4>
          <p>{result.combo.intro}</p>
        </div>

        <div className="profile-grid">
          <article><h5>MENTALITÀ</h5><p>{result.profile.mind}</p></article>
          <article><h5>NELLE RELAZIONI</h5><p>{result.profile.love}</p></article>
          <article><h5>COME TI VEDONO GLI ALTRI</h5><p>{result.profile.others}</p></article>
          <article><h5>I TUOI PUNTI DI FORZA</h5><ul>{result.profile.strengths.map(x=><li key={x}>{x}</li>)}</ul></article>
          <article><h5>LE TUE SFIDE</h5><ul>{result.profile.challenges.map(x=><li key={x}>{x}</li>)}</ul></article>
          <article><h5>CONSIGLIO PER TE</h5><p>{result.profile.advice}</p></article>
        </div>

        <div className="card-footer"><b>@oroscopoxacquario</b><span>Instagram · Facebook</span></div>
      </div>
    </section>}
  </main>
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

createRoot(document.getElementById("root")).render(<App />);