export const site = {
  name: 'Dipanda',
  email: 'comercial@grupodipanda.com',
  phone: '+351 924 697 507',
  phoneHref: '+351924697507',
  hours: 'Seg. - Sex. 09h - 18h, Lisboa',
  get legalName() { return process.env.LEGAL_CONTROLLER_NAME || 'Paulo Panda'; },
  get taxId() { return process.env.LEGAL_TAX_ID || ''; },
  get address() { return process.env.LEGAL_ADDRESS || ''; },
  get updatedAt() { return process.env.LEGAL_LAST_REVIEW_DATE || 'Minuta por validar antes da publicação'; },
  socials: { instagram: '', facebook: '', linkedin: '', x: '' },
};
