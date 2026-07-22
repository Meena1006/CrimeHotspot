import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

const CHENNAI_CENTER = [13.0827, 80.2707];

const makeIcon = (color, label, checked = false) =>
  L.divIcon({
    className: 'patrol-marker-icon',
    html: `
      <div class="patrol-pin ${checked ? 'patrol-pin-checked' : ''}" style="--pin-color:${color}">
        ${checked ? '<span class="patrol-check">✓</span>' : ''}
        <span class="patrol-pin-dot"></span>
        <span class="patrol-pin-label">${label}</span>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 42],
    popupAnchor: [0, -36],
  });

const FitBounds = ({ geometry, stops }) => {
  const map = useMap();

  useEffect(() => {
    const points = geometry?.length
      ? geometry
      : (stops || []).map((s) => [s.lat, s.lng]);
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.2), { animate: true, duration: 0.8 });
  }, [map, geometry, stops]);

  return null;
};

const RoutingMachine = ({ stops, locked }) => {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    if (!stops?.length || stops.length < 2) return undefined;

    if (controlRef.current) {
      map.removeControl(controlRef.current);
      controlRef.current = null;
    }

    const waypoints = stops.map((s) => L.latLng(s.lat, s.lng));

    const control = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      show: false,
      lineOptions: {
        styles: [
          { color: '#1e3a5f', opacity: 0.35, weight: 8 },
          { color: '#3b82f6', opacity: 0.95, weight: 5 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: () => null,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
      }),
    });

    control.addTo(map);
    controlRef.current = control;

    // Hide default itinerary panel
    const container = control.getContainer();
    if (container) container.style.display = 'none';

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, stops, locked]);

  return null;
};

const AnimatedRoute = ({ geometry }) => {
  if (!geometry?.length) return null;
  return (
    <Polyline
      positions={geometry}
      pathOptions={{
        color: '#60a5fa',
        weight: 4,
        opacity: 0.55,
        dashArray: '10 8',
        className: 'patrol-route-animated',
      }}
    />
  );
};

const getStopColor = (stop) => {
  if (stop.status === 'Visited') return '#22c55e';
  if (stop.role === 'start') return '#22c55e';
  if (stop.role === 'destination') return '#ef4444';
  if (stop.status === 'Current') return '#3b82f6';
  return '#f97316';
};

const getStopLabel = (stop) => {
  if (stop.role === 'start') return 'S';
  if (stop.role === 'destination') return 'D';
  return String(stop.order);
};

const PatrolMap = ({
  stops = [],
  geometry = [],
  locked = false,
  onGuard,
  guardingOrder = null,
}) => {
  const intermediates = stops.filter((s) => s.role === 'intermediate');

  return (
    <div className="patrol-map-wrap">
      <MapContainer
        center={CHENNAI_CENTER}
        zoom={11}
        className="patrol-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {(geometry.length > 0 || stops.length > 1) && (
          <FitBounds geometry={geometry} stops={stops} />
        )}

        {stops.length >= 2 && <RoutingMachine stops={stops} locked={locked} />}
        <AnimatedRoute geometry={geometry} />

        {stops.map((stop) => {
          const color = getStopColor(stop);
          const checked = stop.status === 'Visited';
          const canGuard =
            locked &&
            stop.status !== 'Visited' &&
            (stop.role === 'intermediate' || stop.role === 'destination' || stop.role === 'start');

          return (
            <Marker
              key={`${stop.order}-${stop.locationName}-${stop.status}`}
              position={[stop.lat, stop.lng]}
              icon={makeIcon(color, getStopLabel(stop), checked)}
            >
              <Popup className="patrol-popup">
                <div className="patrol-popup-body">
                  <strong>{stop.locationName}</strong>
                  <p>
                    Risk: <span className={`risk-badge risk-${(stop.riskLevel || 'Low').toLowerCase()}`}>{stop.riskLevel}</span>
                  </p>
                  <p>Crimes: {stop.crimeCount}</p>
                  <p>Arrival: {stop.arrivalTime || '—'}</p>
                  <p>Departure: {stop.departureTime || '—'}</p>
                  <p>Stop: {stop.stopDuration} min</p>
                  <p>Status: {stop.status}</p>
                  {canGuard && (
                    <button
                      type="button"
                      className={`btn-guarded ${stop.status === 'Visited' ? 'guarded-done' : ''}`}
                      disabled={guardingOrder === stop.order}
                      onClick={() => onGuard?.(stop.order)}
                    >
                      {guardingOrder === stop.order ? 'Saving…' : 'Guarded'}
                    </button>
                  )}
                  {stop.status === 'Visited' && (
                    <button type="button" className="btn-guarded guarded-done" disabled>
                      Guarded ✓
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="patrol-map-legend">
        <span><i style={{ background: '#22c55e' }} /> Start / Visited</span>
        <span><i style={{ background: '#ef4444' }} /> Destination</span>
        <span><i style={{ background: '#f97316' }} /> Intermediate</span>
        <span><i style={{ background: '#3b82f6' }} /> Route / Current</span>
        {intermediates.length > 0 && (
          <span className="legend-note">{intermediates.length} patrol stops</span>
        )}
      </div>
    </div>
  );
};

export default PatrolMap;
