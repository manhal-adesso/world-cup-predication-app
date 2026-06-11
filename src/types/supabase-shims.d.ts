/**
 * @supabase/ssr 0.5 is compiled against a newer @supabase/supabase-js that
 * re-exports types from this deep path. The installed supabase-js version
 * (2.46.x) does not have that file, which breaks TypeScript even though
 * everything works at runtime. Provide a stub so tsc resolves the module.
 */
declare module "@supabase/supabase-js/dist/module/lib/types" {
  export type GenericSchema = import("@supabase/supabase-js").SupabaseClient extends never
    ? never
    : Record<string, unknown>;
}
