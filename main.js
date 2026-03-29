// ربط Supabase
const SUPABASE_URL = "https://gzfzigvlxozdjlplcsxt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D0Oy8pVP-lNyHKc72e0woA_D6VzQyi5";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// عرض الدورات في الصفحة
async function loadCourses() {
    const { data, error } = await supabaseClient.from('courses').select('*');
    if (error) return console.error(error);

    const container = document.getElementById('courses-container');
    container.innerHTML = '';

    data.forEach(course => {
        const div = document.createElement('div');
        div.className = 'course';
        div.innerHTML = `
            <h3>${course.name}</h3>
            <p>${course.description}</p>
            <button onclick="openCourse('${course.id}')">عرض الدروس</button>
        `;
        container.appendChild(div);
    });
}

function openCourse(courseId) {
    // هنا يمكنك تحميل الدروس حسب الدورة
    alert("جلب الدروس للدورة: " + courseId);
}

// عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', loadCourses);
