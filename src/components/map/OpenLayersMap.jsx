import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Fill, Stroke, Style, Circle as CircleStyle, Text, Icon } from 'ol/style';
import Cluster from 'ol/source/Cluster';
import 'ol/ol.css';
import { CATEGORY_COLORS } from '../../constants';
import SafeImage from '../common/SafeImage';

const HATAY_CENTER = fromLonLat([36.16, 36.20]);
const DEFAULT_ZOOM = 11;
const markerStyleCache = new globalThis.Map();
const CATEGORY_LABELS = {
  camii: 'Cami', kilise: 'Kilise', muze: 'Müze', han: 'Han',
  kale: 'Kale', kopru: 'Köprü', doga: 'Doğal Alan', diger: 'Tarihi Eser',
};

function getCategorySymbol(category) {
  const symbols = {
    camii: '<path d="M11 27h18M13 27v-7h14v7M14 20c1-6 11-6 12 0M29 27V11h3v16M28 11h5M30.5 7v4"/>',
    kilise: '<path d="M12 29h16V18l-8-6-8 6zM20 8v10M16 12h8M17 29v-7h6v7"/>',
    muze: '<path d="M9 15h22l-11-6zM11 18h18M12 28h16M14 18v10M20 18v10M26 18v10M9 31h22"/>',
    han: '<path d="M10 30h20V14H10zM15 30V20c0-7 10-7 10 0v10M10 17h20"/>',
    kale: '<path d="M10 29h20V15h-4v4h-4v-4h-4v4h-4v-4h-4zM15 29v-6h10v6"/>',
    kopru: '<path d="M8 27h24M10 27v-5c5-9 15-9 20 0v5M14 25c2-6 10-6 12 0"/>',
    doga: '<path d="M12 27c12 1 17-7 16-17-10 1-17 5-16 17zM13 26c4-6 8-9 13-13M19 20v10"/>',
    diger: '<path d="M20 9l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  };
  return symbols[category] || symbols.diger;
}

function createMarkerStyle(category, color) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">'
    + '<path d="M20 1C9.5 1 2 8.7 2 18.5 2 31 20 47 20 47s18-16 18-28.5C38 8.7 30.5 1 20 1z" fill="' + color + '" stroke="#fff" stroke-width="2"/>'
    + '<circle cx="20" cy="19" r="14" fill="#fff" opacity=".14"/>'
    + '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + getCategorySymbol(category) + '</g></svg>';
  return new Style({
    image: new Icon({
      src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      anchor: [0.5, 1],
      scale: 0.92,
    }),
  });
}

function getPinStyle(feature, clustered = false) {
  const props = feature.get('features')
    ? feature.get('features')[0]?.getProperties()
    : feature.getProperties();
  const size = feature.get('features')?.length;
  const category = props?.category || 'diger';
  const color = CATEGORY_COLORS[category] || '#64748b';

  if (clustered && size > 1) {
    return new Style({
      image: new CircleStyle({
        radius: 16,
        fill: new Fill({ color: '#1e3a5f' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
      text: new Text({
        text: String(size),
        fill: new Fill({ color: '#fff' }),
        font: 'bold 12px Inter, sans-serif',
      }),
    });
  }

  if (!markerStyleCache.has(category)) {
    markerStyleCache.set(category, createMarkerStyle(category, color));
  }
  return markerStyleCache.get(category);
}

function getRouteStyle(feature) {
  const type = feature.get('type');
  if (type === 'route-line') {
    return new Style({
      stroke: new Stroke({ color: '#7c3aed', width: 4 }),
    });
  }
  if (type === 'route-stop') {
    return new Style({
      image: new CircleStyle({
        radius: 12,
        fill: new Fill({ color: '#2563eb' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
      text: new Text({
        text: String(feature.get('stopNumber')),
        fill: new Fill({ color: '#fff' }),
        font: 'bold 11px Inter, sans-serif',
      }),
    });
  }
  return getPinStyle(feature);
}

export default function OpenLayersMap({
  geojson,
  className = '',
  showControls = true,
  mapType = 'map',
  onMapTypeChange,
  cluster = false,
  onFeatureClick,
  showFeatureTooltip = false,
  routeMode = false,
  heatmap = false,
  fitToData = false,
  height = '100%',
}) {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const osmLayerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const mapReadyRef = useRef(false);

  useEffect(() => {
    const initMap = () => {
      const container = containerRef.current;
      if (!container || mapReadyRef.current) return false;

      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return false;

      vectorSourceRef.current = new VectorSource();
      const layerSource = cluster ? new Cluster({ distance: 40, source: vectorSourceRef.current }) : vectorSourceRef.current;
      const vectorLayer = heatmap
        ? new HeatmapLayer({ source: layerSource, blur: 22, radius: 16, weight: (feature) => Number(feature.get('weight') || 0.72) })
        : new VectorLayer({ source: layerSource, style: (f) => routeMode ? getRouteStyle(f) : getPinStyle(f, cluster) });

      osmLayerRef.current = new TileLayer({ source: new OSM(), visible: mapType !== 'satellite' });
      satelliteLayerRef.current = new TileLayer({
        source: new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
        }),
        visible: mapType === 'satellite',
      });

      mapRef.current = new Map({
        target: container,
        layers: [osmLayerRef.current, satelliteLayerRef.current, vectorLayer],
        view: new View({ center: HATAY_CENTER, zoom: DEFAULT_ZOOM }),
        controls: [],
      });

      mapReadyRef.current = true;
      requestAnimationFrame(() => {
        mapRef.current?.updateSize();
      });

      if (onFeatureClick) {
        mapRef.current.on('click', (evt) => {
          const feature = mapRef.current.forEachFeatureAtPixel(evt.pixel, (f) => f);
          if (feature) {
            const props = feature.get('features')
              ? feature.get('features')[0]?.getProperties()
              : feature.getProperties();
            onFeatureClick(props);
          }
        });
      }

      if (showFeatureTooltip) {
        mapRef.current.on('pointermove', (evt) => {
          if (evt.dragging || evt.originalEvent?.pointerType === 'touch') {
            setHoveredFeature(null);
            return;
          }
          const feature = mapRef.current?.forEachFeatureAtPixel(evt.pixel, (item) => item);
          const groupedFeatures = feature?.get('features');
          const target = mapRef.current?.getTargetElement();
          if (!feature || groupedFeatures?.length > 1) {
            if (target) target.style.cursor = '';
            setHoveredFeature(null);
            return;
          }
          const properties = groupedFeatures?.[0]?.getProperties() || feature.getProperties();
          if (properties.type === 'route-line' || !properties.name) {
            if (target) target.style.cursor = '';
            setHoveredFeature(null);
            return;
          }
          if (target) target.style.cursor = 'pointer';
          const tooltipWidth = 218;
          const x = Math.max(8, Math.min(evt.pixel[0] + 14, container.clientWidth - tooltipWidth - 8));
          const y = Math.max(8, Math.min(evt.pixel[1] - 64, container.clientHeight - 76));
          setHoveredFeature({ properties, x, y });
        });
      }

      return true;
    };

    if (!initMap() && containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (!mapReadyRef.current && initMap()) {
          resizeObserverRef.current?.disconnect();
        }
        mapRef.current?.updateSize();
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      mapRef.current?.setTarget(null);
      mapRef.current = null;
      mapReadyRef.current = false;
      vectorSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!vectorSourceRef.current || !geojson) return;
    vectorSourceRef.current.clear();
    if (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature') {
      console.error('Unsupported GeoJSON payload:', geojson);
      return;
    }
    try {
      const features = new GeoJSON().readFeatures(geojson, {
        featureProjection: 'EPSG:3857',
      });
      vectorSourceRef.current.addFeatures(features);
      if (fitToData && features.length && mapRef.current) {
        requestAnimationFrame(() => {
          mapRef.current?.getView().fit(vectorSourceRef.current.getExtent(), {
            padding: [48, 48, 48, 48],
            duration: 250,
            maxZoom: 15,
          });
        });
      }
    } catch (error) {
      console.error('GeoJSON parse error:', error, geojson);
    }
  }, [geojson, fitToData]);

  useEffect(() => {
    if (osmLayerRef.current && satelliteLayerRef.current) {
      osmLayerRef.current.setVisible(mapType !== 'satellite');
      satelliteLayerRef.current.setVisible(mapType === 'satellite');
    }
  }, [mapType]);

  const zoom = (delta) => {
    const view = mapRef.current?.getView();
    if (view) view.setZoom(view.getZoom() + delta);
  };

  return (
    <div className={`ol-map-wrapper ${className}`} style={{ height }}>
      {showControls && (
        <>
          {onMapTypeChange && (
            <div className="map-type-toggle">
              <button type="button" className={mapType === 'map' ? 'active' : ''} onClick={() => onMapTypeChange('map')}>Harita</button>
              <button type="button" className={mapType === 'satellite' ? 'active' : ''} onClick={() => onMapTypeChange('satellite')}>Uydu</button>
            </div>
          )}
          <div className="map-zoom-controls">
            <button type="button" onClick={() => zoom(1)}>+</button>
            <button type="button" onClick={() => zoom(-1)}>−</button>
          </div>
        </>
      )}
      <div ref={containerRef} className="ol-map-container" />
      {hoveredFeature && <div className="ol-feature-tooltip" style={{ left: hoveredFeature.x, top: hoveredFeature.y }} aria-hidden="true">
        <SafeImage src={hoveredFeature.properties.image} alt="" />
        <div>
          <small>{hoveredFeature.properties.stopNumber ? `${hoveredFeature.properties.stopNumber}. rota durağı` : (hoveredFeature.properties.categoryLabel || CATEGORY_LABELS[hoveredFeature.properties.category] || 'Kültürel miras')}</small>
          <strong>{hoveredFeature.properties.name}</strong>
          <span>{hoveredFeature.properties.district || 'Hatay'}</span>
        </div>
      </div>}
    </div>
  );
}
