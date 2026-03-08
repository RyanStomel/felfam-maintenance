import { isValidPhoneNumber } from 'libphonenumber-js'

export const PHONE_NUMBER_ERROR =
  'Enter a valid phone number in E.164 format or as a 10-digit US number.'

export function normalizePhoneNumber(value: string | null | undefined) {
  const input = value?.trim()
  if (!input) return null

  const digits = input.replace(/\D/g, '')

  let normalized: string | null = null
  if (input.startsWith('+')) {
    if (
      digits.length >= 10 &&
      digits.length <= 15 &&
      /^[1-9]/.test(digits)
    ) {
      normalized = `+${digits}`
    }
  } else if (digits.length === 10) {
    normalized = `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    normalized = `+${digits}`
  }

  if (!normalized) return null
  if (!isValidPhoneNumber(normalized)) return null
  return normalized
}

export function formatPhoneNumberDisplay(value: string | null | undefined) {
  if (!value) return 'No phone number'

  const digits = value.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  return value
}
