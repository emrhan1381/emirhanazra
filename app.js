document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("password-form");
  const input = document.getElementById("site-password");
  const error = document.getElementById("password-error");
  const screen = document.getElementById("password-screen");
  const content = document.getElementById("site-content");

  const wrongMessages = [
    "Ne yani hatırlamıyor musun?",
    "Yoksa beni sevmiyor musun artık",
    "Unutmuş olamazsın",
    "Lütfen hatırlaa"
  ];
  let wrongAttempts = 0;

  // Supabase bağlantısı
  const SUPABASE_URL = "https://krxssgvpoclkzzjtaags.supabase.co";
  const SUPABASE_KEY = "sb_publishable_74q0kOcjsxfVquHlnLSU7g_O49fOjCW";
  const BUCKET = "anilar";
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // İlişki sayacı
  const start = new Date("2026-10-14T00:00:00");
  function tick() {
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12
      + (now.getMonth() - start.getMonth());
    let anniversary = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
    if (now < anniversary) {
      months--;
      anniversary = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
    }
    const remainingSeconds = Math.max(0, Math.floor((now - anniversary) / 1000));
    document.getElementById("months").textContent = Math.max(0, months);
    document.getElementById("days").textContent = Math.floor(remainingSeconds / 86400);
    document.getElementById("hours").textContent = Math.floor((remainingSeconds % 86400) / 3600);
    document.getElementById("minutes").textContent = Math.floor((remainingSeconds % 3600) / 60);
    document.getElementById("seconds").textContent = remainingSeconds % 60;
  }
  tick();
  setInterval(tick, 1000);

  // Fotoğraf albümü
  const gallery = document.getElementById("gallery");
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = "image/*";
  uploadInput.hidden = true;

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.className = "add";
  uploadButton.textContent = "＋ Fotoğraf ekle ♡";

  const galleryStatus = document.createElement("p");
  galleryStatus.setAttribute("role", "status");
  galleryStatus.style.cssText = "grid-column:1/-1;margin:8px 0;color:#b66a89;font-size:13px;";

  gallery.before(uploadButton, uploadInput);
  gallery.after(galleryStatus);

  async function loadPhotos() {
    galleryStatus.textContent = "Anılar yükleniyor…";
    const { data, error: loadError } = await supabaseClient
      .from("memories")
      .select("id,title,description,image_url,created_at")
      .order("created_at", { ascending: false });

    if (loadError) {
      galleryStatus.textContent = "Albüm yüklenemedi. Supabase tablo ve izinlerini kontrol et.";
      console.error("Supabase listeleme hatası:", loadError);
      return;
    }

    gallery.replaceChildren();
    if (!data || data.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Henüz anı eklenmemiş ♡";
      gallery.appendChild(empty);
    } else {
      data.forEach((memory) => {
        if (!memory.image_url) return;
        const image = document.createElement("img");
        image.src = memory.image_url;
        image.alt = memory.title || "Ortak anımız";
        image.loading = "lazy";
        image.title = memory.title || "Ortak anımız";
        gallery.appendChild(image);
      });
    }
    galleryStatus.textContent = "";
  }

  uploadButton.addEventListener("click", () => uploadInput.click());

  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files && uploadInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      galleryStatus.textContent = "Lütfen bir fotoğraf seç.";
      uploadInput.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      galleryStatus.textContent = "Fotoğraf en fazla 10 MB olabilir.";
      uploadInput.value = "";
      return;
    }

    uploadButton.disabled = true;
    galleryStatus.textContent = "Fotoğraf yükleniyor…";
    try {
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const filePath = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabaseClient.storage
        .from(BUCKET)
        .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabaseClient.storage.from(BUCKET).getPublicUrl(filePath);
      const { error: insertError } = await supabaseClient.from("memories").insert({
        title: file.name,
        description: "",
        image_url: publicData.publicUrl
      });
      if (insertError) throw insertError;

      uploadInput.value = "";
      await loadPhotos();
      galleryStatus.textContent = "Fotoğraf albüme eklendi ♡";
    } catch (uploadError) {
      console.error("Fotoğraf yükleme hatası:", uploadError);
      galleryStatus.textContent = "Yüklenemedi: " + (uploadError.message || "Supabase izinlerini kontrol et.");
    } finally {
      uploadButton.disabled = false;
    }
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value.trim() !== "141026") {
      error.textContent = wrongMessages[Math.min(wrongAttempts, wrongMessages.length - 1)];
      wrongAttempts++;
      input.value = "";
      input.focus();
      return;
    }
    error.textContent = "";
    screen.hidden = true;
    content.hidden = false;
    loadPhotos();
  });
});