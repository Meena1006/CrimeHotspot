import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const crimeIcon = L.divIcon({
  className: 'crime-marker-icon',
  html: '<div style="width:10px;height:10px;background:#60a5fa;border:2px solid #3b82f6;border-radius:50%;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});
const CHENNAI_CENTER = [13.0827, 80.2707];
const DEFAULT_ZOOM = 11;

const getHotspotColor = (count) => {
  if (count <= 5) return '#22c55e';
  if (count <= 15) return '#eab308';
  if (count <= 30) return '#f97316';
  return '#ef4444';
};

const getRadius = (count) => {
  return Math.max(12, Math.min(count * 2, 40));
};

const HeatmapLayer = ({ crimes }) => {
  const map = useMap();

  useEffect(() => {
    if (!crimes.length) return;

    import('leaflet.heat').then(() => {
      const heatPoints = crimes.map((crime) => [
        crime.latitude,
        crime.longitude,
        crime.severity === 'Critical' ? 1 : crime.severity === 'High' ? 0.8 : crime.severity === 'Medium' ? 0.5 : 0.3,
      ]);

      const heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.2: '#22c55e',
          0.4: '#eab308',
          0.6: '#f97316',
          0.8: '#ef4444',
          1.0: '#991b1b',
        },
      });

      heatLayer.addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    });
  }, [map, crimes]);

  return null;
};

const FullscreenControl = () => {
  const map = useMap();

  useEffect(() => {
    const fullscreenBtn = L.control({ position: 'topright' });
    fullscreenBtn.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('a', '', div);
      btn.innerHTML = '⛶';
      btn.href = '#';
      btn.title = 'Toggle Fullscreen';
      btn.style.cssText =
        'width:30px;height:30px;line-height:30px;text-align:center;background:#1e293b;color:#fff;font-size:18px;display:block;text-decoration:none;';
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        const container = map.getContainer();
        if (!document.fullscreenElement) {
          container.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      });
      return div;
    };
    fullscreenBtn.addTo(map);
    return () => fullscreenBtn.remove();
  }, [map]);

  return null;
};

const HotspotMarkers = ({ hotspots }) => {
  return hotspots.map((spot) => (
    <CircleMarker
      key={spot.area}
      center={[spot.lat, spot.lng]}
      radius={getRadius(spot.count)}
      pathOptions={{
        color: getHotspotColor(spot.count),
        fillColor: getHotspotColor(spot.count),
        fillOpacity: 0.6,
        weight: 2,
      }}
    >
      <Popup>
        <div className="map-popup">
          <h4>{spot.area}</h4>
          <p><strong>Crime Count:</strong> {spot.count}</p>
          <p><strong>Most Frequent Crime:</strong> {spot.topCrime}</p>
          <p><strong>Peak Time:</strong> {spot.peakTime}</p>
          <p><strong>Avg Severity:</strong> {spot.avgSeverity}</p>
        </div>
      </Popup>
    </CircleMarker>
  ));
};

const CrimeMap = ({ hotspots, crimes }) => {
  const clusterCrimes = useMemo(
    () =>
      crimes.map((crime) => ({
        ...crime,
        position: [crime.latitude, crime.longitude],
      })),
    [crimes]
  );

  return (
    <div className="map-container">
      <MapContainer center={CHENNAI_CENTER} zoom={DEFAULT_ZOOM} className="crime-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer crimes={crimes} />
        <HotspotMarkers hotspots={hotspots} />
        <MarkerClusterGroup chunkedLoading>
          {clusterCrimes.map((crime) => (
            <Marker key={crime._id} position={crime.position} icon={crimeIcon}>
              <Popup>
                <div className="map-popup">
                  <h4>{crime.crimeType}</h4>
                  <p><strong>Location:</strong> {crime.locationName}</p>
                  <p><strong>Date:</strong> {new Date(crime.crimeDate).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {crime.crimeTime}</p>
                  <p><strong>Severity:</strong> {crime.severity}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        <FullscreenControl />
      </MapContainer>

      <div className="map-legend">
        <span className="legend-item"><span className="dot green"></span> 0–5 crimes</span>
        <span className="legend-item"><span className="dot yellow"></span> 6–15 crimes</span>
        <span className="legend-item"><span className="dot orange"></span> 16–30 crimes</span>
        <span className="legend-item"><span className="dot red"></span> 31+ crimes</span>
      </div>
    </div>
  );
};

export default CrimeMap;
