const supabaseUrl = "https://gzfzigvlxozdjlplcsxt.supabase.co";
const supabaseKey = "sb_publishable_D0Oy8pVP-lNyHKc72e0woA_D6VzQyi5";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function loadCourses() {
  const { data, error } = await supabase.from("courses").select("*");
  if(error){ console.log(error); return; }

  const container = document.getElementById("courses");
  container.innerHTML = "";
  data.forEach(course => {
    const div = document.createElement("div");
    div.className = "course";
    div.innerHTML = `<h3>${course.name}</h3><p>${course.description}</p>`;
    container.appendChild(div);
  });
}

loadCourses();
