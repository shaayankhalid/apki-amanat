export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'

  const message =
    typeof error.message === 'string' ? error.message.toLowerCase() : ''

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please check your details and try again.'
  }
  if (message.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }
  if (message.includes('unable to validate email')) {
    return 'Please enter a valid email address.'
  }
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email before logging in. Check your inbox for a confirmation link.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  if (message.includes('duplicate key') || message.includes('already exists')) {
    return 'A profile for this account already exists.'
  }
  if (message.includes('row-level security')) {
    return 'Unable to save your profile. Please try logging in again.'
  }

  const fallback = 'Something went wrong. Please try again.'
  const rawMessage = error.message
  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    return rawMessage
  }
  return fallback
}
