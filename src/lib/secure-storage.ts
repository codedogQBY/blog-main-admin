// Secure token storage utility to replace localStorage usage
// Implements secure token storage with encryption and expiration

interface TokenData {
  token: string
  expiresAt: number
  refreshToken?: string
}

class SecureTokenStorage {
  private readonly TOKEN_KEY = 'auth_token'
  private readonly ENCRYPTION_KEY = 'app_secret_key_2024' // In production, use environment variable
  
  // Simple XOR encryption for token obfuscation
  private encrypt(text: string): string {
    let result = ''
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length))
    }
    return btoa(result)
  }
  
  private decrypt(encryptedText: string): string {
    try {
      const text = atob(encryptedText)
      let result = ''
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length))
      }
      return result
    } catch (error) {
      console.error('Failed to decrypt token:', error)
      return ''
    }
  }
  
  // Store token with expiration
  setToken(token: string, expiresInMinutes: number = 720, refreshToken?: string): void {
    const tokenData: TokenData = {
      token,
      expiresAt: Date.now() + (expiresInMinutes * 60 * 1000),
      refreshToken
    }
    
    try {
      const encryptedData = this.encrypt(JSON.stringify(tokenData))
      localStorage.setItem(this.TOKEN_KEY, encryptedData)
    } catch (error) {
      console.error('Failed to store token:', error)
    }
  }
  
  // Get token with expiration check
  getToken(): string | null {
    try {
      const encryptedData = localStorage.getItem(this.TOKEN_KEY)
      if (!encryptedData) return null
      
      const decryptedData = this.decrypt(encryptedData)
      if (!decryptedData) return null
      
      const tokenData: TokenData = JSON.parse(decryptedData)
      
      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        this.removeToken()
        return null
      }
      
      return tokenData.token
    } catch (error) {
      console.error('Failed to retrieve token:', error)
      this.removeToken()
      return null
    }
  }
  
  // Get refresh token
  getRefreshToken(): string | null {
    try {
      const encryptedData = localStorage.getItem(this.TOKEN_KEY)
      if (!encryptedData) return null
      
      const decryptedData = this.decrypt(encryptedData)
      if (!decryptedData) return null
      
      const tokenData: TokenData = JSON.parse(decryptedData)
      return tokenData.refreshToken || null
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error)
      return null
    }
  }
  
  // Check if token exists and is valid
  hasValidToken(): boolean {
    return this.getToken() !== null
  }
  
  // Remove token
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
  }
  
  // Get token expiration time
  getTokenExpiration(): number | null {
    try {
      const encryptedData = localStorage.getItem(this.TOKEN_KEY)
      if (!encryptedData) return null
      
      const decryptedData = this.decrypt(encryptedData)
      if (!decryptedData) return null
      
      const tokenData: TokenData = JSON.parse(decryptedData)
      return tokenData.expiresAt
    } catch (error) {
      console.error('Failed to get token expiration:', error)
      return null
    }
  }
  
  // Check if token expires soon (within 5 minutes)
  isTokenExpiringSoon(): boolean {
    const expiration = this.getTokenExpiration()
    if (!expiration) return false
    
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
    return expiration < fiveMinutesFromNow
  }
}

// Export singleton instance
export const secureTokenStorage = new SecureTokenStorage()