/** Optional cloud sync for beta testers (Supabase).
 * The anon key is public by design; RLS protects each pilot row.
 * See docs/CLOUD_SYNC.md. Clear url/anonKey to force local-only saves.
 */
export const CLOUD={
 url:"https://thcciowujlfeqzdyskea.supabase.co",
 anonKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoY2Npb3d1amxmZXF6ZHlza2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNjI2MjUsImV4cCI6MjEwNDczODYyNX0.-08CbvZamJJsQ8GwE6SLJ9W-kwaVRFhh84Vuk4y0JdY"
};
export function cloudConfigured(){
 return !!(CLOUD.url&&CLOUD.anonKey&&/^https:\/\//.test(CLOUD.url)&&CLOUD.anonKey.length>20);
}
