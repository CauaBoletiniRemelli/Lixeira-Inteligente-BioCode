import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface MapPressEvent {
    nativeEvent: {
        coordinate: Coordinate;
    };
}

export interface MarkerProps {
    coordinate: Coordinate;
    title?: string;
    description?: string;
    pinColor?: string;
    onPress?: () => void;
    identifier?: string;
}

export interface MapViewProps {
    style?: any;
    initialRegion?: Region;
    region?: Region;
    showsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    onPress?: (event: MapPressEvent) => void;
    onMapReady?: () => void;
    children?: React.ReactNode;
}

export interface MapViewRef {
    animateToRegion: (region: Region, duration?: number) => void;
    setCamera: (camera: any) => void;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(({
    style,
    initialRegion = { latitude: -23.5013, longitude: -47.4526, latitudeDelta: 0.01, longitudeDelta: 0.01 },
    region,
    showsUserLocation = false,
    onPress,
    onMapReady,
    children
}, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
    const markers = React.Children.toArray(children).filter(
        (child: any) => child?.type?.displayName === 'Marker'
    ) as React.ReactElement<MarkerProps>[];

    const currentRegion = region || initialRegion;

    useEffect(() => {
        if (showsUserLocation) {
            (async () => {
                try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        console.warn('Permissão de localização negada');
                        return;
                    }

                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });

                    const userCoords = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };

                    setUserLocation(userCoords);

                    webViewRef.current?.injectJavaScript(`
                        window.postMessage(JSON.stringify({
                            type: 'setUserLocation',
                            latitude: ${userCoords.latitude},
                            longitude: ${userCoords.longitude}
                        }), '*');
                        true;
                    `);
                } catch (error) {
                    console.warn('Erro ao obter localização:', error);
                }
            })();
        }
    }, [showsUserLocation]);

    useImperativeHandle(ref, () => ({
        animateToRegion: (newRegion: Region, duration: number = 1000) => {
            const zoom = Math.round(Math.log(360 / newRegion.latitudeDelta) / Math.LN2);
            webViewRef.current?.injectJavaScript(`
                if (window.map) {
                    window.map.flyTo([${newRegion.latitude}, ${newRegion.longitude}], ${zoom}, {
                        duration: ${duration / 1000}
                    });
                }
                true;
            `);
        },
        setCamera: (camera: any) => {
            if (camera.center) {
                const zoom = camera.zoom || 13;
                webViewRef.current?.injectJavaScript(`
                    if (window.map) {
                        window.map.setView([${camera.center.latitude}, ${camera.center.longitude}], ${zoom});
                    }
                    true;
                `);
            }
        }
    }));

    useEffect(() => {
        if (region && webViewRef.current) {
            const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
            webViewRef.current.injectJavaScript(`
                if (window.map) {
                    window.map.setView([${region.latitude}, ${region.longitude}], ${zoom});
                }
                true;
            `);
        }
    }, [region]);

    const zoom = Math.round(Math.log(360 / currentRegion.latitudeDelta) / Math.LN2);

    const markerCallbacks = useRef<Map<string, () => void>>(new Map());
    
    const markersData = markers.map((marker, index) => {
        const id = marker.props.identifier || `marker-${index}`;
        
        if (marker.props.onPress) {
            markerCallbacks.current.set(id, marker.props.onPress);
        }
        
        return {
            lat: marker.props.coordinate.latitude,
            lng: marker.props.coordinate.longitude,
            title: marker.props.title || '',
            description: marker.props.description || '',
            color: marker.props.pinColor || '#FF0000',
            id: id
        };
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
        }
        html, body { 
            height: 100%; 
            width: 100%; 
            overflow: hidden;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }
        #map { 
            height: 100%; 
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
        }
        .custom-marker {
            background-color: var(--marker-color);
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            border: 3px solid white;
            transform: rotate(-45deg);
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            cursor: pointer;
        }
        .user-marker {
            background-color: #4285F4;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 0 12px rgba(66,133,244,0.8), 0 2px 6px rgba(0,0,0,0.3);
            position: relative;
        }
        .user-marker::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .leaflet-popup {
            margin-bottom: 20px;
        }
        .leaflet-container a.leaflet-popup-close-button {
            color: #333;
            font-size: 20px;
            padding: 4px 8px;
        }
        .locate-button {
            position: absolute;
            bottom: 80px;
            right: 10px;
            width: 40px;
            height: 40px;
            background: white;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }
        .locate-button:hover {
            background-color: #f4f4f4;
        }
        .locate-button:active {
            background-color: #e8e8e8;
        }
        .locate-icon {
            width: 20px;
            height: 20px;
            fill: #4285F4;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    ${showsUserLocation ? `
    <button id="locateBtn" class="locate-button" title="Centralizar na minha localização">
        <svg class="locate-icon" viewBox="0 0 24 24">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
        </svg>
    </button>
    ` : ''}
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
        try {
            window.map = L.map('map', {
                zoomControl: true,
                attributionControl: true,
                preferCanvas: true,
                tap: true,
                tapTolerance: 20,
                touchZoom: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: false,
                keyboard: false
            }).setView([${currentRegion.latitude}, ${currentRegion.longitude}], ${zoom});

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
                crossOrigin: true
            }).addTo(window.map);

            window.markerObjects = [];
            const markers = ${JSON.stringify(markersData)};
            
            markers.forEach(function(markerData) {
                const icon = L.divIcon({
                    className: '',
                    html: '<div class="custom-marker" style="--marker-color: ' + markerData.color + '"></div>',
                    iconSize: [28, 28],
                    iconAnchor: [14, 28],
                    popupAnchor: [0, -28]
                });

                const marker = L.marker([markerData.lat, markerData.lng], { 
                    icon: icon,
                    riseOnHover: true,
                    bubblingMouseEvents: false
                }).addTo(window.map);

                if (markerData.title || markerData.description) {
                    const popupContent = '<div style="min-width: 150px; padding: 5px;">' +
                        '<b style="font-size: 14px;">' + markerData.title + '</b><br>' + 
                        '<span style="font-size: 12px;">' + markerData.description + '</span>' +
                        '</div>';
                    
                    marker.bindPopup(popupContent, {
                        closeButton: true,
                        autoClose: false,
                        closeOnClick: false,
                        maxWidth: 250
                    });
                }

                marker.on('click', function(e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'markerPress',
                        id: markerData.id,
                        latitude: markerData.lat,
                        longitude: markerData.lng,
                        title: markerData.title
                    }));
                });

                window.markerObjects.push(marker);
            });

            ${showsUserLocation ? `
            window.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'setUserLocation' && data.latitude && data.longitude) {
                        const shouldCenter = data.center || false;
                        
                        if (window.userMarker) {
                            window.userMarker.setLatLng([data.latitude, data.longitude]);
                        } else {
                            const userIcon = L.divIcon({
                                className: '',
                                html: '<div class="user-marker"></div>',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            });
                            
                            window.userMarker = L.marker([data.latitude, data.longitude], { 
                                icon: userIcon,
                                zIndexOffset: 1000
                            }).addTo(window.map);

                            window.userMarker.bindPopup('<b>Você está aqui</b>');
                        }

                        if (shouldCenter) {
                            window.map.flyTo([data.latitude, data.longitude], 17, {
                                duration: 1
                            });
                            window.userMarker.openPopup();
                        }
                    }
                } catch (e) {
                }
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'requestUserLocation'
            }));

            const locateBtn = document.getElementById('locateBtn');
            if (locateBtn) {
                locateBtn.addEventListener('click', function() {
                    if (window.userMarker) {
                        const latlng = window.userMarker.getLatLng();
                        window.map.flyTo(latlng, 17, {
                            duration: 1
                        });
                        window.userMarker.openPopup();
                    } else {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'requestUserLocation',
                            center: true
                        }));
                    }
                });
            }
            ` : ''}

            ${onPress ? `
            window.map.on('click', function(e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapPress',
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng
                }));
            });
            ` : ''}

            window.map.whenReady(function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
            });

        } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                message: error.toString() 
            }));
        }
    </script>
</body>
</html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === 'mapPress' && onPress) {
                onPress({
                    nativeEvent: {
                        coordinate: {
                            latitude: data.latitude,
                            longitude: data.longitude
                        }
                    }
                });
            }

            if (data.type === 'markerPress') {
                
                const callback = markerCallbacks.current.get(data.id);
                if (callback) {
                    callback();
                }
            }

            if (data.type === 'requestUserLocation' && userLocation) {
                const center = data.center || false;
                webViewRef.current?.injectJavaScript(`
                    window.postMessage(JSON.stringify({
                        type: 'setUserLocation',
                        latitude: ${userLocation.latitude},
                        longitude: ${userLocation.longitude},
                        center: ${center}
                    }), '*');
                    true;
                `);
            }
            
            if (data.type === 'mapReady' && onMapReady) {
                onMapReady();
            }

            if (data.type === 'error') {
                console.error('Map error:', data.message);
            }
        } catch (error) {
            console.error('Error parsing map message:', error);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                source={{ html: htmlContent }}
                style={styles.map}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                geolocationEnabled={showsUserLocation}
                originWhitelist={['*']}
                mixedContentMode="always"
                cacheEnabled={true}
                cacheMode="LOAD_CACHE_ELSE_NETWORK"
                onError={(syntheticEvent) => {
                    console.warn('WebView error:', syntheticEvent.nativeEvent);
                }}
                onShouldStartLoadWithRequest={() => true}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                nestedScrollEnabled={false}
            />
        </View>
    );
});

MapView.displayName = 'MapView';

export const Marker: React.FC<MarkerProps> = () => null;
Marker.displayName = 'Marker';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
});

export default MapView;
