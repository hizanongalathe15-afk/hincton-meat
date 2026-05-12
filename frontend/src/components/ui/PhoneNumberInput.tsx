import { useEffect, useState } from 'react'
import { ChevronDown, Globe2, Phone } from 'lucide-react'
import { buildE164PhoneNumber, defaultPhoneCountry, findCountryByPhoneNumber, isValidPhoneForCountry, normalizeNationalNumber, phoneCountries } from '../../utils/phoneCountries'
import { useLanguage } from '../../contexts/LanguageContext'

interface PhoneNumberInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}

const findCountryFromValue = (value: string) => {
  return findCountryByPhoneNumber(value) || defaultPhoneCountry
}

const getNationalFromValue = (value: string, dialCode: string) => {
  const compactValue = value.replace(/[^\d+]/g, '')
  if (compactValue.startsWith(dialCode)) {
    return normalizeNationalNumber(compactValue.slice(dialCode.length))
  }
  return normalizeNationalNumber(compactValue)
}

const PhoneNumberInput = ({ id, label, value, onChange, required = false, disabled = false }: PhoneNumberInputProps) => {
  const { t } = useLanguage()
  const [selectedCountry, setSelectedCountry] = useState(() => findCountryFromValue(value))

  useEffect(() => {
    const countryFromValue = findCountryByPhoneNumber(value)
    if (countryFromValue && countryFromValue.iso2 !== selectedCountry.iso2) {
      setSelectedCountry(countryFromValue)
    }
  }, [selectedCountry.iso2, value])

  const nationalNumber = getNationalFromValue(value, selectedCountry.dialCode)
  const hasValue = nationalNumber.length > 0
  const isValid = !hasValue || isValidPhoneForCountry(selectedCountry, nationalNumber)

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const country = phoneCountries.find((item) => item.iso2 === event.target.value) || defaultPhoneCountry
    setSelectedCountry(country)
    onChange(buildE164PhoneNumber(country.dialCode, nationalNumber))
  }

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(buildE164PhoneNumber(selectedCountry.dialCode, event.target.value))
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-950">
        {label}
      </label>
      <div className="mt-2 rounded-xl border border-white/50 bg-white/45 p-1 shadow-lg shadow-red-100/40 backdrop-blur-xl ring-1 ring-red-100/70 transition focus-within:bg-white/70 focus-within:ring-red-500">
        <div className="grid grid-cols-[minmax(8.5rem,11rem)_1fr] overflow-hidden rounded-lg bg-white/55">
          <div className="relative border-r border-white/70">
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-600" />
            <select
              aria-label="Country calling code"
              value={selectedCountry.iso2}
              onChange={handleCountryChange}
              disabled={disabled}
              className="h-full w-full appearance-none bg-transparent py-3 pl-9 pr-8 text-sm font-semibold text-gray-950 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phoneCountries.map((country) => (
                <option key={`${country.iso2}-${country.dialCode}`} value={country.iso2}>
                  {country.name} {country.dialCode}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id={id}
              name={id}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required={required}
              disabled={disabled}
              value={nationalNumber}
              onChange={handleNumberChange}
              className="w-full bg-transparent py-3 pl-12 pr-4 text-gray-950 outline-none disabled:cursor-not-allowed disabled:opacity-60"
              placeholder={`Phone number (${selectedCountry.dialCode})`}
            />
          </div>
        </div>
      </div>
      {!isValid && (
        <p className="mt-2 text-sm font-medium text-red-600">
          {t('validation.validPhone')}
        </p>
      )}
    </div>
  )
}

export default PhoneNumberInput
