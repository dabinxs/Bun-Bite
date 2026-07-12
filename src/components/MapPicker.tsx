import { useEffect, useMemo, useState } from "react";
import L, { type LeafletEvent } from "leaflet";
import { LocateFixed } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

type LocationValue = {
  lat: number;
  lng: number;
};

type MapPickerProps = {
  value?: LocationValue;
  onChange: (location: LocationValue) => void;
};

const DEFAULT_LOCATION: LocationValue = {
  lat: 14.3036,
  lng: 121.0781,
};

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const location = value ?? DEFAULT_LOCATION;
  const [geoStatus, setGeoStatus] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `
          <div style="
            width: 30px;
            height: 30px;
            border-radius: 9999px 9999px 9999px 0;
            background: linear-gradient(135deg, #ff3b3b, #ff7a1a);
            border: 3px solid #ffffff;
            box-shadow: 0 12px 28px rgba(255, 59, 59, 0.45);
            transform: rotate(-45deg);
            display: grid;
            place-items: center;
          ">
            <span style="
              width: 9px;
              height: 9px;
              border-radius: 9999px;
              background: #050505;
              display: block;
            "></span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    [],
  );

  const handleUseCurrentLocation = async () => {
    setGeoStatus("");

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setGeoStatus("Location only works on HTTPS or localhost.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setGeoStatus("This browser does not support geolocation. You can still drag the pin manually.");
      return;
    }

    setIsLocating(true);
    setGeoStatus("Getting your location...");

    try {
      let position: GeolocationPosition;

      try {
        position = await getBrowserLocation({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      } catch (error) {
        if (!shouldTryFallbackLocation(error)) {
          throw error;
        }

        position = await getBrowserLocation({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        });
      }

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      onChange(userLocation);
      setGeoStatus("Location detected. You can still drag the pin to adjust.");
    } catch (error) {
      setGeoStatus(getLocationErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-[260px] w-full"
          style={{ height: 260, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onChange={onChange} />
          <MapRecenter location={location} />
          <Marker
            draggable
            eventHandlers={{
              dragend: (event: LeafletEvent) => {
                if (!(event.target instanceof L.Marker)) return;

                const nextLocation = event.target.getLatLng();
                onChange({
                  lat: nextLocation.lat,
                  lng: nextLocation.lng,
                });
              },
            }}
            icon={markerIcon}
            position={[location.lat, location.lng]}
          />
        </MapContainer>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#FF3B3B]/30 bg-[#FF3B3B]/10 px-4 text-sm font-black text-white transition-all hover:border-[#FF3B3B]/55 hover:bg-[#FF3B3B]/18 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4 text-[#FF8A80]" />
          {isLocating ? "Detecting location..." : "Use my current location"}
        </button>

        <p className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/45">
          Lat {location.lat.toFixed(6)} / Lng {location.lng.toFixed(6)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-white/35">
          If location was blocked before, click the lock icon beside the browser URL, allow Location, then refresh.
        </p>
        {geoStatus && <p className="text-xs font-bold text-white/45">{geoStatus}</p>}
      </div>
    </div>
  );
}

function getBrowserLocation(options: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function shouldTryFallbackLocation(error: unknown) {
  if (!isGeolocationPositionError(error)) return false;

  return error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT;
}

function getLocationErrorMessage(error: unknown) {
  if (!isGeolocationPositionError(error)) {
    return "We could not get your location. You can still drag the pin manually.";
  }

  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Please allow location access in your browser site settings, then try again. You can still drag the pin manually.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your position is currently unavailable. Please check device location services or drag the pin manually.";
  }

  if (error.code === error.TIMEOUT) {
    return "Getting your location took too long. Please try again or drag the pin manually.";
  }

  return "We could not get your location. You can still drag the pin manually.";
}

function isGeolocationPositionError(error: unknown): error is GeolocationPositionError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number" &&
    "PERMISSION_DENIED" in error &&
    "POSITION_UNAVAILABLE" in error &&
    "TIMEOUT" in error
  );
}

function MapClickHandler({ onChange }: { onChange: (location: LocationValue) => void }) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapRecenter({ location }: { location: LocationValue }) {
  const map = useMap();

  useEffect(() => {
    map.setView([location.lat, location.lng], map.getZoom() || 15, {
      animate: true,
    });
  }, [location.lat, location.lng, map]);

  return null;
}
