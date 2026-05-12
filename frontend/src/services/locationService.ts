interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
  address?: string
}

interface LocationOptions {
  enableHighAccuracy: boolean
  timeout: number
  maximumAge: number
}

interface GeocodedAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  formattedAddress?: string
}

export interface ProfileUpdateData {
  location: {
    latitude: number
    longitude: number
    address: string
  }
  address: string
}

class LocationService {
  private watchId: number | null = null
  private currentLocation: LocationData | null = null
  private locationCallbacks: ((location: LocationData) => void)[] = []
  private errorCallbacks: ((error: GeolocationPositionError) => void)[] = []
  private profileUpdateCallback: ((data: ProfileUpdateData) => Promise<void>) | null = null

  // Default options for high accuracy
  private defaultOptions: LocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000 // 1 minute cache
  }

  /**
   * Get current location with high accuracy
   */
  async getCurrentLocation(options?: Partial<LocationOptions>): Promise<LocationData> {
    const mergedOptions = { ...this.defaultOptions, ...options }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = this.processPositionData(position)
          this.currentLocation = locationData
          this.notifyLocationCallbacks(locationData)
          resolve(locationData)
        },
        (error) => {
          this.notifyErrorCallbacks(error)
          reject(this.handleGeolocationError(error))
        },
        mergedOptions
      )
    })
  }

  /**
   * Start continuous location tracking
   */
  startWatching(options?: Partial<LocationOptions>): void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    if (this.watchId !== null) {
      this.stopWatching()
    }

    const mergedOptions = { ...this.defaultOptions, ...options }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = this.processPositionData(position)
        this.currentLocation = locationData
        this.notifyLocationCallbacks(locationData)
      },
      (error) => {
        this.notifyErrorCallbacks(error)
        console.error('Location tracking error:', this.handleGeolocationError(error))
      },
      mergedOptions
    )
  }

  /**
   * Stop continuous location tracking
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  /**
   * Get current cached location
   */
  getCurrentCachedLocation(): LocationData | null {
    return this.currentLocation
  }

  /**
   * Check if location is available and has permission
   */
  async checkLocationPermission(): Promise<PermissionState> {
    if (!navigator.geolocation) {
      return 'denied'
    }

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        return result.state
      } catch (error) {
        console.warn('Could not check location permission:', error)
      }
    }

    return 'prompt'
  }

  /**
   * Request location permission and get location
   */
  async requestLocationWithPermission(options?: Partial<LocationOptions>): Promise<LocationData> {
    const permission = await this.checkLocationPermission()
    
    if (permission === 'denied') {
      throw new Error('Location permission denied. Please enable location in your browser settings.')
    }

    return this.getCurrentLocation(options)
  }

  /**
   * Get location accuracy level
   */
  getLocationAccuracyLevel(accuracy: number): 'high' | 'medium' | 'low' {
    if (accuracy < 10) return 'high'
    if (accuracy < 100) return 'medium'
    return 'low'
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodedAddress> {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HinctonMeatApp/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      
      return {
        street: data.address?.road || data.address?.pedestrian,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state || data.address?.county,
        postalCode: data.address?.postcode,
        country: data.address?.country,
        formattedAddress: data.display_name
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      return {}
    }
  }

  /**
   * Get address for current location
   */
  async getCurrentAddress(): Promise<string> {
    if (!this.currentLocation) {
      throw new Error('No location available. Get location first.')
    }

    const address = await this.reverseGeocode(
      this.currentLocation.latitude,
      this.currentLocation.longitude
    )

    return address.formattedAddress || `${this.currentLocation.latitude}, ${this.currentLocation.longitude}`
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: LocationData) => void): () => void {
    this.locationCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.locationCallbacks.indexOf(callback)
      if (index > -1) {
        this.locationCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Subscribe to location errors
   */
  onLocationError(callback: (error: GeolocationPositionError) => void): () => void {
    this.errorCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback)
      if (index > -1) {
        this.errorCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Set up automatic profile updates when location is obtained
   */
  setProfileUpdateCallback(callback: (data: ProfileUpdateData) => Promise<void>): void {
    this.profileUpdateCallback = callback
  }

  /**
   * Remove profile update callback
   */
  removeProfileUpdateCallback(): void {
    this.profileUpdateCallback = null
  }

  /**
   * Get enhanced location with multiple attempts for better accuracy
   */
  async getHighAccuracyLocation(maxAttempts: number = 3): Promise<LocationData> {
    let bestLocation: LocationData | null = null
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const location = await this.getCurrentLocation({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        })

        if (!bestLocation || location.accuracy < bestLocation.accuracy) {
          bestLocation = location
        }

        // If we got high accuracy, stop trying
        if (location.accuracy < 20) {
          break
        }

        attempts++
        
        // Wait a bit before next attempt
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        attempts++
        if (attempts === maxAttempts && bestLocation) {
          return bestLocation
        }
        throw error
      }
    }

    if (!bestLocation) {
      throw new Error('Could not obtain location after multiple attempts')
    }

    return bestLocation
  }

  /**
   * Get location and automatically update user profile
   */
  async getLocationAndUpdateProfile(): Promise<LocationData> {
    const location = await this.getHighAccuracyLocation(3)
    
    // Auto-update profile if callback is set
    if (this.profileUpdateCallback) {
      try {
        const address = await this.reverseGeocode(location.latitude, location.longitude)
        const formattedAddress = address.formattedAddress || 
          `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        
        const profileData: ProfileUpdateData = {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: formattedAddress
          },
          address: formattedAddress
        }
        
        await this.profileUpdateCallback(profileData)
      } catch (error) {
        console.warn('Failed to auto-update profile:', error)
        // Don't throw error - location was obtained successfully
      }
    }
    
    return location
  }

  /**
   * Check if location is within a certain radius
   */
  isWithinRadius(
    centerLat: number, 
    centerLon: number, 
    radius: number, 
    targetLat: number, 
    targetLon: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLon, targetLat, targetLon)
    return distance <= radius
  }

  // Private methods
  private processPositionData(position: GeolocationPosition): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp
    }
  }

  private handleGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location permission denied. Please enable location access.')
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information unavailable.')
      case error.TIMEOUT:
        return new Error('Location request timed out.')
      default:
        return new Error('An unknown error occurred while retrieving location.')
    }
  }

  private notifyLocationCallbacks(location: LocationData): void {
    this.locationCallbacks.forEach(callback => {
      try {
        callback(location)
      } catch (error) {
        console.error('Error in location callback:', error)
      }
    })
  }

  private notifyErrorCallbacks(error: GeolocationPositionError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (error) {
        console.error('Error in location error callback:', error)
      }
    })
  }
}

// Export singleton instance
export const locationService = new LocationService()

// Export types for use in components
export type { LocationData, LocationOptions, GeocodedAddress }
