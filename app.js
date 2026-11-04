
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
  const addLabel = document.querySelector('label[for="photos"]');

  const wrongMessages = [
    "Ne yani hatırlamıyor musun?",
    "Yoksa beni sevmiyor musun artık",
    "Unutmuş olamazsın",
    "Lütfen hatırlaa"
  ];

  let wrongAttempts = 0;
  let db = null;

  if (window.supabase?.createClient) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // İlişki sayacı
  const start = new Date("2026-10-14T00:00:00");

  function tick() {
    const seconds = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));

    document.getElementById("days").textContent = Math.floor(seconds / 86400);
    document.getElementById("hours").textContent = Math.floor((seconds % 86400) / 3600);
    document.getElementById("minutes").textContent = Math.floor((seconds % 3600) / 60);
    document.getElementById("seconds").textContent = seconds % 60;
  }

  tick();
  setInterval(tick, 1000);

  // Anı ekleme alanı
  const memoryForm = document.createElement("form");
  memoryForm.id = "memory-form";
  memoryForm.innerHTML = `
    <input id="memory-title" type="text"
      placeholder="Anının başlığı ♡" maxlength="100" required>

    <textarea id="memory-description"
      placeholder="Bu anıyı anlatan küçük bir not yaz... ♡"
      rows="3" maxlength="2000"></textarea>

    <button type="submit" id="save-memory">Anıyı Kaydet ♡</button>
    <p id="memory-status" aria-live="polite"></p>
  `;

  gallery.parentElement.insertBefore(memoryForm, gallery);

  // Form görünümü
  const style = document.createElement("style");
  style.textContent = `
    #memory-form {
      display: grid;
      gap: 10px;
      margin: 18px 0;
    }
    #memory-form input,
    #memory-form textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid #e8b9ca;
      border-radius: 12px;
      background: #fffafd;
      color: #604452;
      font: inherit;
    }
    #memory-form button,
    .delete-memory {
      padding: 10px 16px;
      border: 0;
      border-radius: 12px;
      background: #e9b6c9;
      color: #633f50;
      font: inherit;
      cursor: pointer;
    }
    .memory-card {
      padding: 12px;
      margin-bottom: 16px;
      border-radius: 15px;
      background: #fffafd;
      border: 1px solid #f0d5df;
    }
    .memory-card img {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 12px;
      margin-bottom: 10px;
    }
    .memory-card h3 {
      margin: 8px 0;
    }
    .memory-card p {
      white-space: pre-wrap;
    }
    .delete-memory {
      background: #f4dce5;
      margin-top: 8px;
    }
  `;
  document.head.appendChild(style);

  // Fotoğraf seçimi
  if (photos) {
    photos.multiple = false;
  }

  if (addLabel) {
    addLabel.textContent = "＋ Fotoğraf Seç ♡";
  }

  // Giriş
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
      gallery.textContent = "Anılar yüklenemedi: " + dbError.message;
      return;
    }

    gallery.innerHTML = "";

    if (!data || data.length === 0) {
      gallery.innerHTML = "<p>Henüz anı eklenmemiş. ♡</p>";
      return;
    }

    for (const memory of data) {
      const card = document.createElement("article");
      card.className = "memory-card";

      if (memory.image_url) {
        const { data: imageData, error: imageError } = await db
          .storage
          .from(BUCKET)
          .createSignedUrl(memory.image_url, 3600);

        if (!imageError && imageData?.signedUrl) {
          const img = document.createElement("img");
          img.src = imageData.signedUrl;
          img.alt = memory.title || "Anımız";
          img.loading = "lazy";
          card.appendChild(img);
        } else {
          console.error(imageError);
        }
      }

      const title = document.createElement("h3");
      title.textContent = memory.title || "Adsız anı";
      card.appendChild(title);

      if (memory.description) {
        const note = document.createElement("p");
        note.textContent = memory.description;
        card.appendChild(note);
      }

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-memory";
      deleteButton.textContent = "Anıyı Sil";

      deleteButton.addEventListener("click", async () => {
        if (!confirm("Bu anıyı silmek istediğinize emin misiniz?")) return;

        deleteButton.disabled = true;
        deleteButton.textContent = "Siliniyor...";

        const { error: deleteError } = await db
          .from("memories")
          .delete()
          .eq("id", memory.id);

        if (deleteError) {
          console.error(deleteError);
          alert("Anı silinemedi: " + deleteError.message);
          deleteButton.disabled = false;
          deleteButton.textContent = "Anıyı Sil";
          return;
        }

        if (memory.image_url) {
          const { error: storageError } = await db
            .storage
            .from(BUCKET)
            .remove([memory.image_url]);

          if (storageError) {
            console.error(storageError);
            alert("Anı silindi ancak fotoğraf dosyası depolamada kaldı.");
          }
        }

        await loadMemories();
      });

      card.appendChild(deleteButton);
      gallery.appendChild(card);
    }
  }

  // Yeni anı kaydet
  memoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!db) {
      alert("Supabase bağlantısı kurulamadı.");
      return;
    }

    const title = document.getElementById("memory-title").value.trim();
    const description = document.getElementById("memory-description").value.trim();
    const file = photos.files[0];

    if (!title) {
      alert("Anıya bir başlık yazmalısınız.");
      return;
    }

    const saveButton = document.getElementById("save-memory");
    const status = document.getElementById("memory-status");

    saveButton.disabled = true;
    status.textContent = "Anı kaydediliyor... ♡";

    let imagePath = null;

    try {
      if (file) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Lütfen bir fotoğraf seçin.");
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Fotoğraf 10 MB sınırını aşıyor.");
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        imagePath = crypto.randomUUID() + "-" + safeName;

        const { error: uploadError } = await db
          .storage
          .from(BUCKET)
          .upload(imagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });

        if (uploadError) throw uploadError;
      }

      const { error: insertError } = await db
        .from("memories")
        .insert({
          title,
          description,
          image_url: imagePath
        });

      if (insertError) {
        if (imagePath) {
          await db.storage.from(BUCKET).remove([imagePath]);
        }
        throw insertError;
      }

      memoryForm.reset();
      photos.value = "";
      status.textContent = "Anınız kaydedildi! ♡";
      await loadMemories();

    } catch (err) {
      console.error(err);
      status.textContent = "Kaydedilemedi: " + err.message;
    } finally {
      saveButton.disabled = false;
    }
  });
});
