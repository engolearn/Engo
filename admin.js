const SUPABASE_URL = "https://gzfzigvlxozdjlplcsxt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D0Oy8pVP-lNyHKc72e0woA_D6VzQyi5";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// إضافة دورة جديدة
async function addCourse(name, description) {
    const { data, error } = await supabaseClient.from('courses').insert([{ name, description }]);
    if (error) return alert("خطأ: " + error.message);
    alert("تم إضافة الدورة!");
}

// مثال على استدعاء الدالة
// addCourse("Basic English", "دورة تعلم أساسيات اللغة الإنجليزية");
