/** Optional cloud sync for beta testers (Supabase).
 * Fill in url + anonKey to enable. The anon key is public by design; RLS protects rows.
 * See docs/CLOUD_SYNC.md for project setup. Leave blank to keep local-only saves.
 */
export const CLOUD={
 url:'',
 anonKey:''
};
export function cloudConfigured(){
 return !!(CLOUD.url&&CLOUD.anonKey&&/^https:\/\//.test(CLOUD.url)&&CLOUD.anonKey.length>20);
}
