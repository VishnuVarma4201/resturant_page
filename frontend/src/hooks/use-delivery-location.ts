import { useState, useEffect } from 'react';
import { socket } from '@/lib/socket';
import { toast } from "sonner";

interface Location {
  latitude: number;
  longitude: number;
}

interface UseDeliveryLocationProps {
  orderId?: string;
  deliveryBoyId?: string;
  isDeliveryBoy?: boolean;
}

export const useDeliveryLocation = ({ orderId, deliveryBoyId, isDeliveryBoy }: UseDeliveryLocationProps) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId && !deliveryBoyId) return;

    const watchId = isDeliveryBoy ? startLocationWatch() : null;

    // Listen for location updates
    socket.on('delivery_location_update', ({ location: newLocation }) => {
      setLocation(newLocation);
      setError(null);
    });

    socket.on('location_error', ({ message }) => {
      setError(message);
      toast.error(message);
    });

    // Clean up
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off('delivery_location_update');
      socket.off('location_error');
    };
  }, [orderId, deliveryBoyId, isDeliveryBoy]);

  const startLocationWatch = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        setLocation(newLocation);
        
        // Emit location update if we're the delivery boy
        if (isDeliveryBoy && deliveryBoyId) {
          socket.emit('location_update', {
            deliveryBoyId,
            location: newLocation
          });
        }
      },
      (error) => {
        console.error('Location error:', error);
        setError('Failed to get location');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      }
    );
    setWatchId(id);
    return id;
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  return {
    location,
    error,
    isTracking,
    startTracking: startLocationWatch,
    stopTracking
  };
};
