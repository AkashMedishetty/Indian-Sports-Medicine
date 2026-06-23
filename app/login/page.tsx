// Redirect to correct auth login page
import { redirect } from 'next/navigation'

export default function LoginRedirect() {
  redirect('/auth/login')
}
