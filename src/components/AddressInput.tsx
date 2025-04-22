
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AddressInput = ({ value, onChange }: AddressInputProps) => {
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            const address = data.display_name;
            onChange(address);
          } catch (error) {
            console.error("Error fetching address:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
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
        className="w-full"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Get Current Location
      </Button>
    </div>
  );
};

export default AddressInput;
