// Configuration centralisee de l'URL de l'API
// - En dev : http://localhost:3000 (acces direct au serveur Express)
// - En prod : "" (URL relative, nginx fait le proxy /api -> api:3000)
// - Si VITE_API_URL est defini explicitement, on l'utilise
export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:3000");
