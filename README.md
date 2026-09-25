# Calcolo Ascendente — Oroscopo Acquario

Calcolatore web dell'Ascendente con React + Vite, pubblicato tramite GitHub e Vercel.

## Stack
- React + Vite
- Supabase
- GitHub
- Vercel
- PWA / Service Worker

## Avvio locale
```bash
npm install
npm run dev
```

## Funzionamento
- Il calcolo viene eseguito nel browser.
- La ricerca delle città usa Nominatim/OpenStreetMap.
- Il fuso orario viene ricavato localmente dalle coordinate con `tz-lookup`.
- L'Ascendente viene calcolato a partire da data, ora locale, coordinate, conversione UTC, GMST, tempo siderale locale e obliquità dell'eclittica.
- Il salvataggio su Supabase avviene solo se l'utente seleziona esplicitamente l'opzione di salvataggio.

## Output
- Profilo astrologico dinamico.
- Download PDF A5.
- Download sfondo cellulare 1440×2560.

## Note tecniche
La chiave Supabase utilizzata dal frontend è una publishable key, progettata per essere utilizzabile lato client. La tabella Supabase è protetta da RLS e il frontend non espone dati salvati ad altri utenti.

Prima di introdurre nuove funzioni astrologiche, è consigliato mantenere una suite di test con date, orari e località di riferimento.
