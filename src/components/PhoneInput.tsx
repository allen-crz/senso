
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Globe } from "lucide-react";

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
  const [countryCode, setCountryCode] = React.useState('+63');
  const [localNumber, setLocalNumber] = React.useState('');

  React.useEffect(() => {
    // Parse initial value if exists
    if (value) {
      const code = countryCodes.find(c => value.startsWith(c.code));
      if (code) {
        setCountryCode(code.code);
        setLocalNumber(value.substring(code.code.length));
      } else {
        setLocalNumber(value);
      }
    }
  }, []);

  React.useEffect(() => {
    // Combine country code and local number
    const fullNumber = `${countryCode}${localNumber}`;
    onChange(fullNumber);
  }, [countryCode, localNumber, onChange]);

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={setCountryCode}>
        <SelectTrigger className="w-[140px]">
          <Globe className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.country} ({country.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={localNumber}
        onChange={(e) => setLocalNumber(e.target.value)}
        className="flex-1"
        placeholder="Enter phone number"
      />
    </div>
  );
};

export default PhoneInput;
