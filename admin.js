const supabaseUrl = "https://gzfzigvlxozdjlplcsxt.supabase.co";
const supabaseKey = "sb_publishable_D0Oy8pVP-lNyHKc72e0woA_D6VzQyi5";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- Courses ---
async function loadCoursesToSelect(){
  const { data, error } = await supabase.from("courses").select("*");
  if(error){ console.log(error); return; }

  const select1 = document.getElementById("courseSelect");
  const select2 = document.getElementById("wordCourseSelect");
  select1.innerHTML = "";
  select2.innerHTML = "";
  data.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.name;
    select1.appendChild(option);
    select2.appendChild(option.cloneNode(true));
  });
  loadLessonsToSelect();
}

async function addCourse(){
  let name = document.getElementById("courseName").value;
  let description = document.getElementById("courseDesc").value;
  const { data, error } = await supabase.from("courses").insert([{name, description}]);
  if(error){ alert("خطأ"); console.log(error); return; }
  alert("تم إضافة الدورة");
  loadCoursesToSelect();
}

// --- Lessons ---
async function loadLessonsToSelect(){
  const courseId = document.getElementById("wordCourseSelect").value;
  const { data, error } = await supabase.from("lessons").select("*").eq("course_id", courseId);
  if(error){ console.log(error); return; }
  const lessonSelect = document.getElementById("wordLessonSelect");
  lessonSelect.innerHTML = "";
  data.forEach(l => {
    const option = document.createElement("option");
    option.value = l.id;
    option.textContent = l.title;
    lessonSelect.appendChild(option);
  });
}

async function addLesson(){
  let course_id = document.getElementById("courseSelect").value;
  let title = document.getElementById("lessonTitle").value;
  let content = document.getElementById("lessonContent").value;
  let youtube_url = document.getElementById("lessonYoutube").value;
  const { data, error } = await supabase.from("lessons").insert([{course_id, title, content, youtube_url}]);
  if(error){ alert("خطأ"); console.log(error); return; }
  alert("تم إضافة الدرس");
  loadLessonsToSelect();
}

// --- Words ---
async function addWord(){
  let course_id = document.getElementById("wordCourseSelect").value;
  let lesson_id = document.getElementById("wordLessonSelect").value;
  let word = document.getElementById("wordText").value;
  let meaning = document.getElementById("wordMeaning").value;
  let pronunciation = document.getElementById("wordPron").value;
  const { data, error } = await supabase.from("words").insert([{course_id, lesson_id, word, meaning, pronunciation}]);
  if(error){ alert("خطأ"); console.log(error); return; }
  alert("تم إضافة الكلمة");
}

loadCoursesToSelect();
