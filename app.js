
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

  let photos = document.getElementById("photos");
  let addLabel = document.querySelector('label[for="photos"]');

  const wrongMessages = [
    "Ne yani hatırlamıyor musun?",
    "Yoksa beni sevmiyor musun artık",
    "Unutmuş olamazsın",
    "Lütfen hatırlaa"
  ];

  let wrongAttempts = 0;
  let db = null;

  if (window.supabase?.createClient) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: (input, init = {}) => {
          const request = new Request(input, init);
          const headers = new Headers(request.headers);

          // Publishable keys are API keys, not JWTs.
          // Keep the apikey header, but do not send the publishable key
          // as an Authorization Bearer token to Storage.
          const authorization = headers.get("Authorization") || "";
          if (
            authorization === `Bearer ${SUPABASE_KEY}` ||
            /^Bearer\s+sb_publishable_/i.test(authorization)
          ) {
            headers.delete("Authorization");
          }

          return fetch(new Request(request, { headers }));
        }
      }
    });
  }

  // İLİŞKİ SAYACI

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

  // FOTOĞRAF GALERİSİ FORMU

  const photoForm = document.createElement("form");
  photoForm.id = "photo-form";

  if (!photos) {
    photos = document.createElement("input");
    photos.id = "photos";
    photos.type = "file";
  }

  photos.type = "file";
  photos.accept = "image/*";
  photos.multiple = false;

  if (!addLabel) {
    addLabel = document.createElement("label");
    addLabel.htmlFor = "photos";
  }

  addLabel.textContent = "＋ Fotoğraf Ekle ♡";

  photoForm.innerHTML = `
    <input
      id="photo-title"
      type="text"
      placeholder="Fotoğrafın başlığı ♡"
      maxlength="100"
      required
    >

    <textarea
      id="photo-description"
      placeholder="Fotoğrafın açıklaması... ♡"
      rows="3"
      maxlength="2000"
    ></textarea>

    <button type="submit" id="save-photo">
      Fotoğrafı Ekle ♡
    </button>

    <p id="photo-status" aria-live="polite"></p>
  `;

  photoForm.insertBefore(addLabel, photoForm.firstChild);
  photoForm.insertBefore(photos, photoForm.children[1]);
  photoForm.querySelector("#photo-status").textContent = "Albüm hazır ♡";

  gallery.parentElement.insertBefore(photoForm, gallery);

  // TASARIM

  const style = document.createElement("style");

  style.textContent = `
    #photo-form {
      display: grid;
      gap: 12px;
      margin: 20px 0;
    }

    #photo-form input,
    #photo-form textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid #e8b9ca;
      border-radius: 12px;
      background: #fffafd;
      color: #604452;
      font: inherit;
    }

    #photo-form label {
      display: inline-block;
      padding: 12px 16px;
      border-radius: 12px;
      background: #f4dce5;
      color: #633f50;
      cursor: pointer;
      text-align: center;
    }

    #photos {
      display: none;
    }

    #photo-status {
      min-height: 22px;
      margin: 4px 0;
      color: #604452;
      font-size: 14px;
      font-weight: 600;
    }

    #photo-form button,
    .delete-photo {
      padding: 11px 16px;
      border: 0;
      border-radius: 12px;
      background: #e9b6c9;
      color: #633f50;
      font: inherit;
      cursor: pointer;
    }

    .photo-card {
      padding: 12px;
      margin-bottom: 18px;
      border-radius: 15px;
      background: #fffafd;
      border: 1px solid #f0d5df;
    }

    .photo-card img {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 12px;
      margin-bottom: 10px;
    }

    .photo-card h3 {
      margin: 8px 0;
      color: #604452;
    }

    .photo-card p {
      white-space: pre-wrap;
      color: #806271;
    }

    .delete-photo {
      background: #f4dce5;
      margin-top: 8px;
    }

    .delete-photo:disabled,
    #save-photo:disabled {
      opacity: 0.6;
      cursor: wait;
    }
  `;

  document.head.appendChild(style);

  // GİRİŞ SİSTEMİ

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (input.value.trim() === "141026") {
      screen.hidden = true;
      content.hidden = false;

      if (db) {
        await loadPhotos();
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

  // FOTOĞRAFLARI YÜKLE

  async function loadPhotos() {
    gallery.innerHTML = "<p>♡ Fotoğraflar yükleniyor...</p>";

    const { data, error: dbError } = await db
      .from("memories")
      .select("id,title,description,image_url,created_at")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error(dbError);
      gallery.textContent = "Fotoğraflar yüklenemedi: " + dbError.message;
      return;
    }

    gallery.innerHTML = "";

    if (!data || data.length === 0) {
      gallery.innerHTML = "<p>Henüz fotoğraf yok. ♡</p>";
      return;
    }

    for (const photo of data) {
      const card = document.createElement("article");
      card.className = "photo-card";

      const { data: imageData, error: imageError } = await db
        .storage
        .from(BUCKET)
        .createSignedUrl(photo.image_url, 3600);

      if (imageError || !imageData?.signedUrl) {
        console.error(imageError);
        continue;
      }

      const img = document.createElement("img");
      img.src = imageData.signedUrl;
      img.alt = photo.title || "Fotoğrafımız";
      img.loading = "lazy";

      card.appendChild(img);

      const title = document.createElement("h3");
      title.textContent = photo.title || "Başlıksız fotoğraf";
      card.appendChild(title);

      if (photo.description) {
        const description = document.createElement("p");
        description.textContent = photo.description;
        card.appendChild(description);
      }

      // FOTOĞRAF SİLME

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-photo";
      deleteButton.textContent = "Fotoğrafı Sil";

      deleteButton.addEventListener("click", async () => {
        if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) {
          return;
        }

        deleteButton.disabled = true;
        deleteButton.textContent = "Siliniyor...";

        const { error: deleteError } = await db
          .from("memories")
          .delete()
          .eq("id", photo.id);

        if (deleteError) {
          console.error(deleteError);
          alert("Fotoğraf silinemedi: " + deleteError.message);

          deleteButton.disabled = false;
          deleteButton.textContent = "Fotoğrafı Sil";
          return;
        }

        const { error: storageError } = await db
          .storage
          .from(BUCKET)
          .remove([photo.image_url]);

        if (storageError) {
          console.error(storageError);
          alert("Fotoğraf kaydı silindi ancak depolama dosyası kaldı.");
        }

        await loadPhotos();
      });

      card.appendChild(deleteButton);
      gallery.appendChild(card);
    }
  }

  // YENİ FOTOĞRAF EKLEME

  photoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!db) {
      alert("Supabase bağlantısı kurulamadı.");
      return;
    }

    const title = document.getElementById("photo-title").value.trim();
    const description = document
      .getElementById("photo-description")
      .value.trim();

    const file = photos.files[0];

    if (!file) {
      alert("Lütfen bir fotoğraf seçin.");
      return;
    }

    if (!title) {
      alert("Fotoğrafa bir başlık yazın.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Lütfen geçerli bir fotoğraf seçin.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Fotoğraf 10 MB sınırını aşıyor.");
      return;
    }

    const saveButton = document.getElementById("save-photo");
    const status = document.getElementById("photo-status");

    saveButton.disabled = true;
    status.textContent = "Fotoğraf ekleniyor... ♡";

    let imagePath = null;
    let uploadStage = "fotoğraf dosyası yüklenirken";

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");

      imagePath =
        (crypto.randomUUID?.() || Date.now().toString()) +
        "-" + safeName;

      const { error: uploadError } = await db
        .storage
        .from(BUCKET)
        .upload(imagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      uploadStage = "fotoğraf bilgisi veritabanına kaydedilirken";

      const { error: insertError } = await db
        .from("memories")
        .insert({
          title: title,
          description: description,
          image_url: imagePath
        });

      if (insertError) {
        await db.storage.from(BUCKET).remove([imagePath]);
        throw insertError;
      }

      photoForm.reset();
      status.textContent = "Fotoğraf başarıyla eklendi! ♡";

      await loadPhotos();

      status.textContent = "Fotoğraf başarıyla eklendi! ♡";

    } catch (err) {
      console.error(err);
      status.textContent = "Eklenemedi (" + uploadStage + "): " + err.message;
    } finally {
      saveButton.disabled = false;
    }
  });
});

