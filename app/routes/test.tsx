import { useState, useEffect, useCallback } from "react";

interface Coords {
  latitude: number;
  longitude: number;
}

interface Weather {
  temperature: number;
  symbolCode: string;
}

interface Address {
  adressetekst: string;
  postnummer: string;
  poststed: string;
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Du har nektet tilgang til posisjonen din. Vennligst aktiver posisjonstjenester i nettleseren.";
    case error.POSITION_UNAVAILABLE:
      return "Posisjonsinformasjon er ikke tilgjengelig.";
    case error.TIMEOUT:
      return "Forespørselen om posisjon tok for lang tid.";
    default:
      return "En ukjent feil oppstod ved henting av posisjon.";
  }
}

export default function Home() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [coordsLoading, setCoordsLoading] = useState(true);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [address, setAddress] = useState<Address | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setCoordsError("Nettleseren din støtter ikke GPS-lokalisering.");
      setCoordsLoading(false);
      return;
    }

    setCoordsLoading(true);
    setCoordsError(null);
    setWeather(null);
    setWeatherError(null);
    setAddress(null);
    setAddressError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setCoordsLoading(false);
      },
      (error) => {
        setCoordsError(getGeolocationErrorMessage(error));
        setCoordsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Fetch location on mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Fetch weather and address when coords change
  useEffect(() => {
    if (!coords) return;

    const controller = new AbortController();
    const { latitude, longitude } = coords;

    // Fetch weather from Yr
    async function fetchWeather() {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const res = await fetch(
          `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Yr API feil: ${res.status}`);
        const data = await res.json();
        const timeserie = data.properties.timeseries[0];
        const temperature: number =
          timeserie.data.instant.details.air_temperature;
        const symbolCode: string =
          timeserie.data.next_1_hours?.summary?.symbol_code ??
          timeserie.data.next_6_hours?.summary?.symbol_code ??
          "cloudy";
        setWeather({ temperature, symbolCode });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setWeatherError(err.message || "Kunne ikke hente værdata.");
        }
      } finally {
        setWeatherLoading(false);
      }
    }

    // Fetch address from GeoNorge
    async function fetchAddress() {
      setAddressLoading(true);
      setAddressError(null);
      try {
        const res = await fetch(
          `https://ws.geonorge.no/adresser/v1/punktsok?lon=${longitude}&lat=${latitude}&radius=50`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`GeoNorge API feil: ${res.status}`);
        const data = await res.json();
        if (!data.adresser || data.adresser.length === 0) {
          setAddressError("Ingen adresse funnet i nærheten.");
          return;
        }
        const a = data.adresser[0];
        setAddress({
          adressetekst: a.adressetekst,
          postnummer: a.postnummer,
          poststed: a.poststed,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setAddressError(err.message || "Kunne ikke hente adresse.");
        }
      } finally {
        setAddressLoading(false);
      }
    }

    fetchWeather();
    fetchAddress();

    return () => controller.abort();
  }, [coords]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="bg-white flex flex-col items-center w-full max-w-xl rounded-lg overflow-hidden">
        {/* GPS-Lokasjon */}
        <div className="bg-stone-500 text-white flex flex-col items-center justify-center w-11/12 mt-4 p-6 rounded">
          <h2 className="text-xl font-bold mb-2">GPS-Lokasjon</h2>
          {coordsLoading && <p>Henter posisjon...</p>}
          {coordsError && <p className="text-red-300">{coordsError}</p>}
          {coords && (
            <div className="text-center">
              <p>Breddegrad: {coords.latitude.toFixed(5)}</p>
              <p>Lengdegrad: {coords.longitude.toFixed(5)}</p>
            </div>
          )}
        </div>

        {/* Vær */}
        <div className="bg-stone-500 text-white flex flex-col items-center justify-center w-11/12 mt-4 p-6 rounded">
          <h2 className="text-xl font-bold mb-2">Vær</h2>
          {weatherLoading && <p>Henter værdata...</p>}
          {weatherError && <p className="text-red-300">{weatherError}</p>}
          {!weatherLoading && !weatherError && !weather && !coords && (
            <p className="text-stone-300">Venter på posisjon...</p>
          )}
          {weather && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={`https://raw.githubusercontent.com/metno/weathericons/main/weather/png/${weather.symbolCode}.png`}
                alt={weather.symbolCode}
                className="w-20 h-20"
              />
              <p className="text-3xl font-semibold">{weather.temperature}°C</p>
            </div>
          )}
        </div>

        {/* Adresse */}
        <div className="bg-stone-500 text-white flex flex-col items-center justify-center w-11/12 mt-4 p-6 rounded">
          <h2 className="text-xl font-bold mb-2">Adresse</h2>
          {addressLoading && <p>Henter adresse...</p>}
          {addressError && <p className="text-red-300">{addressError}</p>}
          {!addressLoading && !addressError && !address && !coords && (
            <p className="text-stone-300">Venter på posisjon...</p>
          )}
          {address && (
            <div className="text-center">
              <p>{address.adressetekst}</p>
              <p>
                {address.postnummer} {address.poststed}
              </p>
            </div>
          )}
        </div>

        {/* Oppdater-knapp */}
        <button
          onClick={fetchLocation}
          disabled={coordsLoading}
          className="my-4 px-6 py-2 bg-stone-700 text-white rounded hover:bg-stone-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors">
          {coordsLoading ? "Henter posisjon..." : "Oppdater posisjon"}
        </button>
      </div>
    </div>
  );
}
