# Vær og Lokasjon

En webapplikasjon som viser brukerens nåværende geografiske posisjon, været på stedet, og nærmeste adresse.

## Funksjoner

- **GPS-Lokasjon** — Henter brukerens posisjon via `navigator.geolocation` og viser breddegrad/lengdegrad.
- **Vær fra Yr** — Henter værdata fra [MET Norway API](https://api.met.no/) og viser temperatur med værikon.
- **Adresse fra GeoNorge** — Slår opp nærmeste adresse via [GeoNorge punktsøk](https://ws.geonorge.no/adresser/v1/).
- **Oppdater-knapp** — Lar brukeren oppdatere posisjon, vær og adresse på nytt.
- **Feilhåndtering** — Håndterer nektet GPS-tilgang, utilgjengelig posisjon, tidsavbrudd og API-feil.

## API-er

| Tjeneste              | URL                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Yr (Locationforecast) | `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={lat}&lon={lon}`         |
| GeoNorge (Punktsøk)   | `https://ws.geonorge.no/adresser/v1/punktsok?lon={lon}&lat={lat}&radius=50`              |
| Værikon               | `https://raw.githubusercontent.com/metno/weathericons/main/weather/png/{symbolCode}.png` |

## Teknologi

- React 19
- React Router 7
- Tailwind CSS 4
- Vite 7
- TypeScript

## Kom i gang

```bash
npm install
npm run dev
```

Åpne [http://localhost:5173](http://localhost:5173) i nettleseren. Tillat lokasjon når nettleseren spør.

## Bygg for produksjon

```bash
npm run build
npm start
```
