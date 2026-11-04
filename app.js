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
        const card = document.createElement("article");
        card.className = "memory-card";
        const image = document.createElement("img");
        image.src = memory.image_url;
        image.alt = memory.title || "Ortak anımız";
        image.loading = "lazy";
        image.title = memory.title || "Ortak anımız";
        const details = document.createElement("div");
        details.className = "memory-details";
        const title = document.createElement("h3");
        title.textContent = memory.title || "İsimsiz anı";
        const description = document.createElement("p");
        description.textContent = memory.description || "";
        details.append(title, description);
        const menuWrap = document.createElement("div");
        menuWrap.className = "memory-menu-wrap";
        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className = "memory-menu-trigger";
        menuButton.textContent = "⋯";
        menuButton.setAttribute("aria-label", "Anı seçenekleri");
        menuButton.setAttribute("aria-expanded", "false");
        const menu = document.createElement("div");
        menu.className = "memory-menu";
        menu.hidden = true;

        const editTitleButton = document.createElement("button");
        editTitleButton.type = "button";
        editTitleButton.textContent = "Başlığı düzenle";
        editTitleButton.addEventListener("click", async () => {
          const nextTitle = window.prompt("Anının yeni başlığı:", memory.title || "");
          if (nextTitle === null) return;
          const { error: updateError } = await supabaseClient.from("memories")
            .update({ title: nextTitle.trim() || "İsimsiz anı" }).eq("id", memory.id);
          if (updateError) {
            galleryStatus.textContent = "Başlık güncellenemedi: " + updateError.message;
            return;
          }
          await loadPhotos();
          galleryStatus.textContent = "Başlık güncellendi ♡";
        });

        const editDescriptionButton = document.createElement("button");
        editDescriptionButton.type = "button";
        editDescriptionButton.textContent = "Açıklamayı düzenle";
        editDescriptionButton.addEventListener("click", async () => {
          const nextDescription = window.prompt("Anının yeni açıklaması:", memory.description || "");
          if (nextDescription === null) return;
          const { error: updateError } = await supabaseClient.from("memories")
            .update({ description: nextDescription.trim() }).eq("id", memory.id);
          if (updateError) {
            galleryStatus.textContent = "Açıklama güncellenemedi: " + updateError.message;
            return;
          }
          await loadPhotos();
          galleryStatus.textContent = "Açıklama güncellendi ♡";
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Fotoğrafı sil";
        deleteButton.className = "memory-menu-delete";
        deleteButton.addEventListener("click", async () => {
          if (!window.confirm("Bu anıyı silmek istediğinize emin misiniz?")) return;
          deleteButton.disabled = true;
          galleryStatus.textContent = "Anı siliniyor…";
          try {
            const marker = "/storage/v1/object/public/" + BUCKET + "/";
            const filePath = memory.image_url.includes(marker)
              ? decodeURIComponent(memory.image_url.split(marker)[1].split("?")[0])
              : null;
            if (filePath) {
              const { error: storageError } = await supabaseClient.storage.from(BUCKET).remove([filePath]);
              if (storageError) throw storageError;
            }
            const { error: deleteError } = await supabaseClient.from("memories").delete().eq("id", memory.id);
            if (deleteError) throw deleteError;
            await loadPhotos();
            galleryStatus.textContent = "Anı silindi ♡";
          } catch (deleteError) {
            console.error("Anı silme hatası:", deleteError);
            galleryStatus.textContent = "Silinemedi: " + (deleteError.message || "Supabase izinlerini kontrol et.");
            deleteButton.disabled = false;
          }
        });

        menu.append(editTitleButton, editDescriptionButton, deleteButton);
        menuButton.addEventListener("click", () => {
          const isOpen = !menu.hidden;
          menu.hidden = isOpen;
          menuButton.setAttribute("aria-expanded", String(!isOpen));
        });
        menuWrap.append(menuButton, menu);
        card.append(image, details, menuWrap);
        gallery.appendChild(card);
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

    const title = window.prompt("Bu anıya bir başlık ver ♡", file.name.replace(/\\.[^.]+$/, ""));
    if (title === null) { uploadInput.value = ""; return; }
    const description = window.prompt("Bu anı için kısa bir açıklama yaz (isteğe bağlı):", "");
    if (description === null) { uploadInput.value = ""; return; }

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
        title: title.trim() || "İsimsiz anı",
        description: description.trim(),
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