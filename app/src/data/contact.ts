export const contact = {
  email: 'wafafelahi@gmail.com',
  github: 'https://github.com/WafaaFelahi',
  /** Add your profile URL to show the LinkedIn link, e.g. https://www.linkedin.com/in/your-handle */
  linkedin: '',
  /**
   * Optional form backend. Set VITE_CONTACT_ENDPOINT (in .env or Vercel → Settings
   * → Environment Variables) to a Formspree / Web3Forms style endpoint that
   * accepts a JSON POST. Without it, the form opens the visitor's email app
   * with their message already written.
   */
  formEndpoint: (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined) ?? '',
}
