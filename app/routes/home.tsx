import { useState, useEffect, useCallback } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface WeatherData {
  temperature: number;
  symbolCode: string;
}

interface AdressData {
  adressetekst: string;
}

export default function Home() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [adress, setAdress] = useState<AdressData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [adressError, setAdressError] = useState<string | null>(null);
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
}
