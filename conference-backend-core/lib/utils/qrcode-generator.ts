import QRCode from 'qrcode'
import { conferenceConfig } from '../../../config/conference.config'

/**
 * Generate QR code for registration
 */
export class QRCodeGenerator {
  /**
   * Generate QR code as data URL (base64 image)
   */
  static async generateQRDataURL(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: conferenceConfig.theme.primary,
          light: '#FFFFFF'
        }
      })
      return qrCodeDataURL
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate QR code as buffer
   */
  static async generateQRBuffer(data: string): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(data, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: conferenceConfig.theme.primary,
          light: '#FFFFFF'
        }
      })
      return buffer
    } catch (error) {
      console.error('Error generating QR code buffer:', error)
      throw new Error('Failed to generate QR code buffer')
    }
  }

  /**
   * Generate registration QR code with formatted data
   */
  static async generateRegistrationQR(registrationData: {
    registrationId: string
    name: string
    email: string
    type: string
  }): Promise<string> {
    // Use only Registration ID for QR code as requested
    const qrData = registrationData.registrationId

    return await this.generateQRDataURL(qrData)
  }

  /**
   * Generate registration QR code buffer for email attachment
   */
  static async generateRegistrationQRBuffer(registrationData: {
    registrationId: string
    name: string
    email: string
    type: string
  }): Promise<Buffer> {
    // Use only Registration ID for QR code as requested
    const qrData = registrationData.registrationId

    return await this.generateQRBuffer(qrData)
  }

  /**
   * Generate simple registration ID QR code
   */
  static async generateSimpleRegistrationQR(registrationId: string): Promise<string> {
    return await this.generateQRDataURL(registrationId)
  }

  /**
   * Generate simple registration ID QR code as buffer
   */
  static async generateSimpleRegistrationQRBuffer(registrationId: string): Promise<Buffer> {
    return await this.generateQRBuffer(registrationId)
  }
}
