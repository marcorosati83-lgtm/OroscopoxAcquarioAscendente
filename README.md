# Calcolo Ascendente — React

Stack:
- React + Vite
- Supabase (predisposto, non necessario per il calcolo V1)
- GitHub
- Vercel
- PWA da aggiungere nel prossimo passaggio

## Avvio locale

```bash
npm install
npm run dev
```

## GitHub

1. Crea un repository vuoto, ad esempio `ascendente`.
2. Carica tutti i file.
3. Collega il repository a Vercel.
4. Imposta su Vercel, se necessario:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Note

La ricerca delle città usa Nominatim/OpenStreetMap e il fuso orario viene ricavato localmente dalle coordinate con `tz-lookup`.

Il calcolo dell'Ascendente usa data/ora locale, conversione al tempo UTC, GMST, tempo siderale locale, obliquità dell'eclittica e intersezione dell'orizzonte orientale con l'eclittica tropicale.

Prima della pubblicazione definitiva è consigliato validare il risultato contro un calcolatore astrologico di riferimento su un set di date/luoghi di test.
