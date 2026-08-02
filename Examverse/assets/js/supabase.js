/* ==========================================
   ExamVerse Supabase
========================================== */

const SUPABASE_URL = "https://uozfnsolypnaozeihauo.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_H_aNHEfb7ylFdyW3FYkX3A_0jDYODf7";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("Supabase Connected");

console.log(supabaseClient);