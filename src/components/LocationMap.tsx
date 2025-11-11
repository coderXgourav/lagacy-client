import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, X } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number, address?: { city: string; state: string; country: string }) => void;
  initialLat?: number;
  initialLng?: number;
  radius?: number; // in meters
}

export default function LocationMap({ 
  onLocationSelect, 
  initialLat = 39.8283, // Default: Center of USA (Kansas)
  initialLng = -98.5795,
  radius = 5000
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const isUpdatingFromMapRef = useRef(false); // Track if update is from map interaction

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with a neutral default location (center of USA at zoom 4 to show the whole country)
    const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Don't add marker initially - it will be added when user selects a location
    // Create marker and circle but don't add to map yet
    const marker = L.marker([39.8283, -98.5795], {
      draggable: true,
    });

    const circle = L.circle([39.8283, -98.5795], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      radius: radius,
    });

    markerRef.current = marker;
    circleRef.current = circle;
    mapInstanceRef.current = map;

    // Handle marker drag
    marker.on('dragend', async () => {
      const position = marker.getLatLng();
      circle.setLatLng(position);
      setSelectedLocation({ lat: position.lat, lng: position.lng });
      
      // Set flag to indicate update is from map interaction
      isUpdatingFromMapRef.current = true;
      
      // Reverse geocode to get address
      try {
        const address = await reverseGeocode(position.lat, position.lng);
        if (address) {
          onLocationSelect(position.lat, position.lng, address);
        } else {
          onLocationSelect(position.lat, position.lng);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        onLocationSelect(position.lat, position.lng);
      }
      
      // Reset flag after a delay
      setTimeout(() => {
        isUpdatingFromMapRef.current = false;
      }, 500);
    });

    // Handle map click
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      
      // Add marker and circle to map if not already added
      if (!map.hasLayer(marker)) {
        marker.addTo(map);
        circle.addTo(map);
      }
      
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
      map.setView([lat, lng], 13); // Zoom in when location is selected
      setSelectedLocation({ lat, lng });
      
      // Set flag to indicate update is from map interaction
      isUpdatingFromMapRef.current = true;
      
      // Reverse geocode to get address
      try {
        const address = await reverseGeocode(lat, lng);
        if (address) {
          onLocationSelect(lat, lng, address);
        } else {
          onLocationSelect(lat, lng);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        onLocationSelect(lat, lng);
      }
      
      // Reset flag after a delay
      setTimeout(() => {
        isUpdatingFromMapRef.current = false;
      }, 500);
    });

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update circle radius when prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          // Add marker and circle to map if not already added
          if (!mapInstanceRef.current.hasLayer(markerRef.current)) {
            markerRef.current.addTo(mapInstanceRef.current);
            circleRef.current.addTo(mapInstanceRef.current);
          }
          
          mapInstanceRef.current.setView([latitude, longitude], 13);
          markerRef.current.setLatLng([latitude, longitude]);
          circleRef.current.setLatLng([latitude, longitude]);
          setSelectedLocation({ lat: latitude, lng: longitude });
          
          // Set flag to indicate update is from map interaction
          isUpdatingFromMapRef.current = true;
          
          // Reverse geocode to get address
          try {
            const address = await reverseGeocode(latitude, longitude);
            if (address) {
              onLocationSelect(latitude, longitude, address);
            } else {
              onLocationSelect(latitude, longitude);
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
            onLocationSelect(latitude, longitude);
          }
          
          // Reset flag after a delay
          setTimeout(() => {
            isUpdatingFromMapRef.current = false;
          }, 500);
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
        setIsLocating(false);
      }
    );
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    if (markerRef.current && circleRef.current && mapInstanceRef.current) {
      // Remove marker and circle from map
      if (mapInstanceRef.current.hasLayer(markerRef.current)) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        mapInstanceRef.current.removeLayer(circleRef.current);
      }
      // Zoom back out to show the whole map
      mapInstanceRef.current.setView([39.8283, -98.5795], 4);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/50">
      <CardHeader className="border-b bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MapPin className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Location Selector</CardTitle>
              <CardDescription>
                Click on the map or drag the marker to select your search location
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="gap-2"
            >
              <Navigation className="h-4 w-4" />
              {isLocating ? 'Locating...' : 'Use My Location'}
            </Button>
            {selectedLocation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearLocation}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div ref={mapRef} className="w-full h-[400px] rounded-b-lg" />
        </div>
        {selectedLocation && (
          <div className="p-4 bg-muted/30 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Selected Location:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Search radius: {(radius / 1000).toFixed(1)} km
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Reverse geocoding using OpenStreetMap Nominatim API
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string; country: string } | null> {
  try {
    // Force English language for all responses, including Arabic countries
    // accept-language header alone isn't enough for some regions
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en&extratags=1&namedetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'LocationMapApp/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.address) {
      // For Arabic countries and other non-Latin script regions, prefer English names
      // namedetails contains name:en which is the English translation
      const nameDetails = data.namedetails || {};
      
      // Extract city (try multiple possible fields, prefer English)
      // First try the standard address fields (which should be in English due to accept-language)
      let city = data.address.city || 
                 data.address.town || 
                 data.address.village || 
                 data.address.municipality || 
                 data.address.county || 
                 '';
      
      // If city contains non-Latin characters, try to get English name from namedetails
      if (city && /[^\x00-\x7F]/.test(city) && nameDetails['name:en']) {
        city = nameDetails['name:en'];
      }
      
      // Extract state (try multiple possible fields, prefer English)
      let state = data.address.state || 
                  data.address.province || 
                  data.address.region || 
                  '';
      
      // Extract country (should always be in English with accept-language header)
      const country = data.address.country || '';
      
      // Log for debugging non-English results
      if (/[^\x00-\x7F]/.test(city) || /[^\x00-\x7F]/.test(state)) {
        console.warn('Non-English characters detected in address:', { city, state, country });
        console.log('Available namedetails:', nameDetails);
      }
      
      return { city, state, country };
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}
