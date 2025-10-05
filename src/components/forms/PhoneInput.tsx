
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Flag } from "lucide-react";

const countryCodes = [
  { code: '+1', country: 'United States' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+81', country: 'Japan' },
  { code: '+86', country: 'China' },
  { code: '+91', country: 'India' },
  { code: '+63', country: 'Philippines' },
  { code: '+65', country: 'Singapore' },
  { code: '+82', country: 'South Korea' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PhoneInput = ({ value, onChange }: PhoneInputProps) => {
  const [countryCode, setCountryCode] = useState('+63');
  const [localNumber, setLocalNumber] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse the value into country code and local number whenever value changes
  useEffect(() => {
    if (value && value !== `${countryCode}${localNumber}`) {
      const code = countryCodes.find(c => value.startsWith(c.code));
      if (code) {
        setCountryCode(code.code);
        setLocalNumber(value.substring(code.code.length));
      } else {
        // If no country code found, assume it's a local number
        setCountryCode('+63');
        setLocalNumber(value);
      }
      setIsInitialized(true);
    } else if (!value && isInitialized) {
      // Reset to defaults when value is empty
      setCountryCode('+63');
      setLocalNumber('');
    }
  }, [value]);

  // Handle internal changes from user interaction
  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    const fullNumber = `${newCode}${localNumber}`;
    onChange(fullNumber);
  };

  const handleLocalNumberChange = (newNumber: string) => {
    setLocalNumber(newNumber);
    const fullNumber = `${countryCode}${newNumber}`;
    onChange(fullNumber);
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode)?.country || '';

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={handleCountryCodeChange}>
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <SelectValue placeholder="Select country">
              {selectedCountry} ({countryCode})
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                {country.country} ({country.code})
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={localNumber}
        onChange={(e) => handleLocalNumberChange(e.target.value)}
        className="flex-1"
        placeholder="Enter phone number"
      />
    </div>
  );
};

export default PhoneInput;
