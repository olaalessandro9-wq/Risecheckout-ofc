/**
 * CountryCodeSelector - Seletor de Código de País
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 */

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const countries: Country[] = [
  { code: "BR", name: "Brasil", dialCode: "+55", flag: "🇧🇷" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "MX", name: "México", dialCode: "+52", flag: "🇲🇽" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
  { code: "UY", name: "Uruguay", dialCode: "+598", flag: "🇺🇾" },
  { code: "PY", name: "Paraguay", dialCode: "+595", flag: "🇵🇾" },
  { code: "BO", name: "Bolivia", dialCode: "+591", flag: "🇧🇴" },
  { code: "EC", name: "Ecuador", dialCode: "+593", flag: "🇪🇨" },
  { code: "ES", name: "España", dialCode: "+34", flag: "🇪🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
];

interface CountryCodeSelectorProps {
  value: string;
  onChange: (dialCode: string, countryCode: string) => void;
  disabled?: boolean;
}

export const CountryCodeSelector = ({ value, onChange, disabled = false }: CountryCodeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Encontrar país selecionado
  const selectedCountry = countries.find(c => c.dialCode === value) || countries[0];

  // Filtrar países baseado na busca
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focar no input de busca ao abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country.dialCode, country.code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1 px-2 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
      >
        <img 
          src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
          alt={selectedCountry.name}
          className="w-5 h-4 object-cover rounded-sm"
        />
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Campo de busca */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar país"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Lista de países */}
          <div className="overflow-y-auto max-h-80">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${
                    selectedCountry.code === country.code ? 'bg-primary/10' : ''
                  }`}
                >
                  <img 
                    src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                    alt={country.name}
                    className="w-6 h-4 object-cover rounded-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">{country.name}</div>
                  </div>
                  <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum país encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
