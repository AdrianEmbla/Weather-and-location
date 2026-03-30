import { useState, useEffect, useCallback } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface WeatherData {
  temperature: number;
  symbolCode: string;
}

interface AddressData {
  addressetekst: string;
}

export default function Home() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setWeatherError(null);
      const res = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
        { headers: { "User-Agent": "Vær og Lokasjon App" } },
      );
      if (!res.ok) throw new Error(`Yr API feil: ${res.status}`);
      const data = await res.json();
      const timeseries = data.properties.timeseries[0];
      const temperature = timeseries.data.instant.details.air_temperature;
      const symbolCode =
        timeseries.data.next_1_hours?.summary.symbol_code || "unknown";
      setWeather({ temperature, symbolCode });
    } catch (err: any) {
      setWeatherError(err.message || "Feil ved henting av værdata");
    }
  };

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      setAddressError(null);
      const res = await fetch(
        `https://ws.geonorge.no/adresser/v1/punktsok?lon=${lon}&lat=${lat}&radius=50`,
      );
      if (!res.ok) throw new Error(`GeoNorge API feil: ${res.status}`);
      const data = await res.json();
      if (data.addresser && data.addresser.length > 0) {
        setAddress(data.addresser[0].addresstekst);
      } else {
        setAddressError("Ingen adresse funnet i nærheten");
      }
    } catch (err: any) {
      setAddressError(err.message || "Kunne ikke hente adresse");
    }
  };

  const updatePosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolokasjon støttes ikke av nettleseren");
      return;
    }
    setLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        fetchWeather(latitude, longitude);
        fetchAddress(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Nektet tilgang til posisjon");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Posisjoninformasjon er ikke tilgjengelig");
            break;
          case error.TIMEOUT:
            setLocationError("Forespørsel om posisjon ble tidsavbrutt");
            break;
          default:
            setLocationError("En ukjent feil oppsto");
        }
        setLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="bg-white flex flex-col items-center h-auto w-140 p-6 gap-4 rounded-t-2xl">
        <h1 className="text-2xl font-bold text-black">Vær og Lokasjon</h1>

        {/* GPS Lokasjon */}
        <div className="bg-black text-white flex flex-col items-center w-100 p-4 rounded-2xl">
          <h2 className="text-lg font-semibold">GPS-Lokasjon</h2>
          {locationError ?
            <p className="text-red-300">{locationError}</p>
          : location ?
            <>
              <p>Breddegrad: {location.latitude.toFixed(5)}</p>
              <p>Lengegrad: {location.longitude.toFixed(5)} </p>
            </>
          : <p>Henter posisjon...</p>}
        </div>
      </div>

      {/* Vær */}
      <div className="bg-white text-black flex flex-col items-center w-140 p-4 ">
        <h2 className="text-lg font-semibold">Vær (Yr)</h2>
        {weatherError ?
          <p className="text-red-300">{weatherError}</p>
        : weather ?
          <>
            <img
              src={`https://raw.githubusercontent.com/metno/weathericons/main/weather/png/${weather.symbolCode}.png`}
              alt={weather.symbolCode}
              className="w-16 h-16"
            />
            <p>Temperatur: {weather.temperature}°C</p>
          </>
        : location ?
          <p>Henter værdata</p>
        : <p>Venter på posisjon...</p>}
      </div>
    </div>
  );
}
