
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AddressInput = ({ value, onChange }: AddressInputProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetLocation = () => {
    if (!("geolocation" in navigator)) {
      toast({
        variant: "destructive",
        title: "Location Not Available",
        description: "Your browser doesn't support geolocation."
      });
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          console.log(`Getting address for coordinates: ${lat}, ${lon}`);
          
          // Use backend geocoding API to avoid CORS issues
          const response = await api.reverseGeocode(lat, lon);
          
          if (response.success && response.address) {
            onChange(response.address);
            toast({
              title: "Address Found",
              description: `Location retrieved using ${response.service}.`,
            });
            console.log(`Geocoding succeeded:`, response.address);
          } else {
            toast({
              title: "Manual Address Entry Required",
              description: "Could not find address for your location. Please enter manually.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error in geolocation processing:", error);
          toast({
            variant: "destructive",
            title: "Location Processing Failed",
            description: "Unable to process location data. Please enter your address manually."
          });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        console.error("Error getting location:", error);
        
        let errorMessage = "Could not access your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please allow location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          variant: "destructive",
          title: "Location Error",
          description: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          placeholder="Enter your complete address"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleGetLocation}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Getting Location..." : "Get Current Location"}
      </Button>
    </div>
  );
};

export default AddressInput;
