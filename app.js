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

  const wrongMessages = [
    "Ne yani hatırlamıyor musun?",
    "Yoksa beni sevmiyor musun artık",
    "Unutmuş olamazsın",
    "Lütfen hatırlaa"
  ];
  let wrongAttempts = 0;

  // Publishable key is sent as apikey only. Removing the generated Bearer
  // header prevents Storage from trying to parse the publishable key as a JWT.
  const db = window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          fetch: (input, init = {}) => {
            const request = new Request(input, init);
            const headers = new Headers(request.headers);
            const authorization = headers.get("Authorization") || "";
            if (/^Bearer\s+sb_publishable_/i.test(authorization)) {
              headers.delete("Authorization");
            }
            return fetch(new Request(request, { headers }));
          }
        }
      })
    : null;

  // Relationship counter
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

  // Build the album controls in the existing album section.
  const albumSection = gallery?.closest("section");
  const uploadForm = document.createElement("form");
  uploadForm.id = "photo-form";
  uploadForm.innerHTML = `
    <label class="photo-picker" for="photos">＋ Fotoğraf Seç ♡</label>
    <input id="photos" type="file" accept="image/*" hidden>
    <span id="selected-photo">Henüz fotoğraf seçilmedi</span>
    <button type="submit" id="save-photo">Fotoğrafı Albüme Ekle ♡</button>
    <p id="photo-status" role="status" aria-live="polite">Bir fotoğraf seçerek ortak albümünüze ekleyebilirsiniz.</p>
  `;
  if (albumSection && gallery) {
    albumSection.insertBefore(uploadForm, gallery);
  }

  const style = document.createElement("style");
  style.textContent = `
    #photo-form{display:grid;gap:10px;max-width:520px;margin:0 auto 22px;padding:16px;background:#fffafd;border:1px solid #f0d5df;border-radius:18px}
    #photo-form .photo-picker,#photo-form button{display:block;padding:12px 16px;border:0;border-radius:14px;background:#ed91b1;color:#fff;font:inherit;cursor:pointer;text-align:center}
    #photo-form #selected-photo{font-size:13px;color:#9f3562;overflow-wrap:anywhere}
    #photo-form #photo-status{min-height:22px;margin:2px 0;color:#9f3562;font-size:14px}
    #photo-form button:disabled{opacity:.6;cursor:wait}
    .photo-card{min-width:0;overflow:hidden}
    .photo-card img{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:13px;border:2px solid white;box-shadow:0 2px 12px #c55a821c}
    .photo-card .photo-date{font-size:12px;color:#b66a89;margin:7px 0 0}
    @media(max-width:600px){#photo-form{margin-left:4px;margin-right:4px}}
  `;
  document.head.appendChild(style);

  const photos = document.getElementById("photos");
  const selectedPhoto = document.getElementById("selected-photo");
  const status = document.getElementById("photo-status");
  const saveButton = document.getElementById("save-photo");

  photos?.addEventListener("change", () => {
    const file = photos.files?.[0];
    selectedPhoto.textContent = file ? file.name : "Henüz fotoğraf seçilmedi";
    if (file) status.textContent = "Fotoğraf seçildi. Albüme ekleyebilirsiniz. ♡";
  });

  form?.addEventListener("submit", async (event) => {
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
    if (!db) {
      status.textContent = "Supabase kütüphanesi yüklenemedi. Sayfayı yenileyin.";
      return;
    }
    await loadPhotos();
  });

  async function loadPhotos() {
    gallery.innerHTML = "<p>♡ Fotoğraflar yükleniyor...</p>";
    try {
      const { data, error: listError } = await db.storage
        .from(BUCKET)
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (listError) throw listError;
      const images = (data || []).filter(file =>
        file.name && !file.name.startsWith(".") &&
        /\.(jpe?g|png|gif|webp|bmp|heic|avif)$/i.test(file.name)
      );

      gallery.innerHTML = "";
      if (!images.length) {
        gallery.innerHTML = "<p>Henüz fotoğraf yok. İlk anınızı ekleyin. ♡</p>";
        return;
      }

      for (const file of images) {
        const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(file.name);
        if (!publicData?.publicUrl) continue;

        const card = document.createElement("article");
        card.className = "photo-card";
        const img = document.createElement("img");
        img.src = publicData.publicUrl;
        img.alt = "Emirhan ve Azra'nın anısı";
        img.loading = "lazy";
        img.onerror = () => { card.remove(); };
        card.appendChild(img);

        const date = document.createElement("p");
        date.className = "photo-date";
        date.textContent = file.created_at
          ? new Date(file.created_at).toLocaleDateString("tr-TR")
          : "♡";
        card.appendChild(date);
        gallery.appendChild(card);
      }
      if (!gallery.children.length) {
        gallery.innerHTML = "<p>Fotoğraflar listelendi ancak görüntülenemedi. Depolama izinlerini kontrol edin.</p>";
      }
    } catch (err) {
      console.error("Albüm yükleme hatası:", err);
      gallery.innerHTML = "";
      const message = document.createElement("p");
      message.textContent = "Fotoğraflar yüklenemedi: " + (err.message || "Bilinmeyen hata");
      gallery.appendChild(message);
    }
  }

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!db) {
      status.textContent = "Supabase bağlantısı kurulamadı. Sayfayı yenileyin.";
      return;
    }
    const file = photos.files?.[0];
    if (!file) {
      status.textContent = "Önce yüklemek istediğiniz fotoğrafı seçin.";
      return;
    }
    if (!file.type.startsWith("image/")) {
      status.textContent = "Lütfen geçerli bir fotoğraf dosyası seçin.";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      status.textContent = "Fotoğraf 10 MB sınırını aşıyor.";
      return;
    }

    saveButton.disabled = true;
    status.textContent = "Fotoğraf Supabase'e yükleniyor... ♡";
    try {
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await db.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });
      if (uploadError) throw uploadError;

      status.textContent = "Fotoğraf yüklendi! Albüm yenileniyor... ♡";
      photos.value = "";
      selectedPhoto.textContent = "Henüz fotoğraf seçilmedi";
      await loadPhotos();
      status.textContent = "Fotoğraf başarıyla albüme eklendi! ♡";
    } catch (err) {
      console.error("Fotoğraf yükleme hatası:", err);
      status.textContent = "Yükleme başarısız: " + (err.message || "Bilinmeyen hata") +
        ". Supabase Storage izinlerini kontrol edin.";
    } finally {
      saveButton.disabled = false;
    }
  });
});
