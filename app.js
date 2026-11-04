
const SUPABASE_URL = "https://cqxqgeawycohojivnofr.supabase.co";
const SUPABASE_KEY = "sb_publishable_S3T6IvNg6NFGR-jYsbHm";
const BUCKET = "anilar";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("password-form");
  const input = document.getElementById("site-password");
  const error = document.getElementById("password-error");
  const screen = document.getElementById("password-screen");
  const content = document.getElementById("site-content");
  const gallery = document.getElementById("gallery");
  const photos = document.getElementById("photos");

  const wrongMessages = [
    "Ne yani hatırlamıyor musun?",
    "Yoksa beni sevmiyor musun artık",
    "Unutmuş olamazsın",
    "Lütfen hatırlaa"
  ];

  let wrongAttempts = 0;
  let db = null;

  // Supabase bağlantısı
  if (window.supabase?.createClient) {
    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }

  // İlişki sayacı
  const start = new Date("2026-10-14T00:00:00");

  function tick() {
    const seconds = Math.max(
      0,
      Math.floor((Date.now() - start.getTime()) / 1000)
    );

    document.getElementById("days").textContent =
      Math.floor(seconds / 86400);

    document.getElementById("hours").textContent =
      Math.floor((seconds % 86400) / 3600);

    document.getElementById("minutes").textContent =
      Math.floor((seconds % 3600) / 60);

    document.getElementById("seconds").textContent =
      seconds % 60;
  }

  tick();
  setInterval(tick, 1000);

  // Siteye giriş
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (input.value.trim() === "141026") {
      screen.hidden = true;
      content.hidden = false;

      if (db) {
        await loadMemories();
      } else {
        gallery.textContent = "Supabase bağlantısı kurulamadı.";
      }

      return;
    }

    error.textContent =
      wrongMessages[Math.min(wrongAttempts, wrongMessages.length - 1)];

    wrongAttempts++;
    input.value = "";
    input.focus();
  });

  // Anıları yükle
  async function loadMemories() {
    gallery.innerHTML = "<p>♡ Anılar yükleniyor...</p>";

    const { data, error: dbError } = await db
      .from("memories")
      .select("id,title,description,image_url,created_at")
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error(dbError);
      gallery.textContent = "Anılar yüklenemedi. Supabase izinlerini kontrol et.";
      return;
    }

    gallery.innerHTML = "";

    if (!data || data.length === 0) {
      gallery.innerHTML = "<p>Henüz anı eklenmemiş. ♡</p>";
      return;
    }

    for (const memory of data) {
      const { data: imageData, error: imageError } = await db
        .storage
        .from(BUCKET)
        .createSignedUrl(memory.image_url, 3600);

      if (imageError) {
        console.error(imageError);
        continue;
      }

      const img = document.createElement("img");
      img.src = imageData.signedUrl;
      img.alt = memory.title || "Anımız";
      img.loading = "lazy";

      gallery.appendChild(img);
    }
  }

  // Yeni fotoğraf yükleme
  photos.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    if (!db) {
      alert("Supabase bağlantısı kurulamadı.");
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      if (file.size > 10 * 1024 * 1024) {
        alert(file.name + " dosyası 10 MB sınırını aşıyor.");
        continue;
      }

      try {
        gallery.innerHTML = "<p>Anı yükleniyor... ♡</p>";

        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );

        const path =
          crypto.randomUUID() + "-" + safeName;

        // Fotoğrafı Supabase Storage'a yükle
        const { error: uploadError } = await db
          .storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });

        if (uploadError) throw uploadError;

        // Fotoğraf bilgisini veritabanına kaydet
        const { error: insertError } = await db
          .from("memories")
          .insert({
            title: file.name,
            description: "",
            image_url: path
          });

        if (insertError) {
          await db.storage.from(BUCKET).remove([path]);
          throw insertError;
        }

      } catch (err) {
        console.error(err);
        alert("Anı yüklenemedi: " + err.message);
      }
    }

    photos.value = "";
    await loadMemories();
  });
});
