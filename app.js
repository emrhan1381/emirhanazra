// emirhanazra - Supabase bağlantısı
const SUPABASE_URL = "https://mgzmcsyfnujelrdkumcg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Z3RGCJKNr33akI5NhbK8-w_vobuR0yn";
const MEMORY_BUCKET = "anilar";

document.addEventListener('DOMContentLoaded', async () => {
  const clientFactory = window.supabase && window.supabase.createClient;
  const form = document.getElementById('password-form');
  const passwordInput = document.getElementById('site-password');
  const error = document.getElementById('password-error');
  const screen = document.getElementById('password-screen');
  const content = document.getElementById('site-content');
  const logoutButton = document.getElementById('logout-button');
  const gallery = document.getElementById('gallery');
  const memoryForm = document.getElementById('memory-form');
  const showMemoryForm = document.getElementById('show-memory-form');
  const cancelMemory = document.getElementById('cancel-memory');
  const memoryStatus = document.getElementById('memory-status');
  const memoryTitle = document.getElementById('memory-title');
  const memoryDescription = document.getElementById('memory-description');
  const memoryPhoto = document.getElementById('memory-photo');
  const memoryFormHeading = document.getElementById('memory-form-heading');
  const saveMemoryButton = document.getElementById('save-memory');

  // Mesaj alanını bul veya oluştur
  let gateMessage = document.getElementById('gate-message');

  if (!gateMessage) {
    gateMessage = document.createElement('p');
    gateMessage.id = 'gate-message';
    gateMessage.className = 'gate-message';
    gateMessage.setAttribute('aria-live', 'polite');
    form.insertAdjacentElement('afterend', gateMessage);
  }

  // Mesajların görünümü
  gateMessage.style.display = 'block';
  gateMessage.style.minHeight = '24px';
  gateMessage.style.textAlign = 'center';
  gateMessage.style.color = '#d47791';
  gateMessage.style.marginTop = '12px';
  gateMessage.textContent = '';

  const messages = [
    "Ne yani hatırlamıyor musun?",
    "Yoksa beni sevmiyor musun artık?",
    "Unutmuş olamazsın.",
    "Lütfen hatırlaa..."
  ];

  let messageIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let messageTimer = null;
  let animationActive = false;

  function stopMessageAnimation() {
    animationActive = false;

    if (messageTimer !== null) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }

    gateMessage.textContent = '';
  }

  function typeMessage() {
    if (!animationActive) return;

    const current = messages[messageIndex];
    gateMessage.textContent = current.substring(0, charIndex);

    if (!deleting) {
      charIndex++;

      if (charIndex > current.length) {
        if (messageIndex === messages.length - 1) {
          charIndex = current.length;
          gateMessage.textContent = current;
          animationActive = false;
          return;
        }

        deleting = true;
        messageTimer = setTimeout(typeMessage, 1200);
        return;
      }
    } else {
      charIndex--;

      if (charIndex < 0) {
        charIndex = 0;
        deleting = false;
        messageIndex++;
      }
    }

    messageTimer = setTimeout(typeMessage, deleting ? 45 : 85);
  }

  function startMessageAnimation() {
    stopMessageAnimation();

    messageIndex = 0;
    charIndex = 0;
    deleting = false;
    animationActive = true;

    typeMessage();
  }

  stopMessageAnimation();

  if (!clientFactory) {
    error.textContent = 'Bağlantı kütüphanesi yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.';
    return;
  }

  const db = clientFactory(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  let editingMemory = null;
  let currentMemories = [];

  const start = new Date('2026-10-14T00:00:00');

  function tick() {
    const seconds = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
    document.getElementById('days').textContent = Math.floor(seconds / 86400);
    document.getElementById('hours').textContent = Math.floor(seconds % 86400 / 3600);
    document.getElementById('minutes').textContent = Math.floor(seconds % 3600 / 60);
    document.getElementById('seconds').textContent = seconds % 60;
  }

  tick();
  setInterval(tick, 1000);

  function showSite() {
    stopMessageAnimation();
    screen.hidden = true;
    content.hidden = false;
    loadMemories();
  }

  function showLogin(message = '') {
    stopMessageAnimation();
    content.hidden = true;
    screen.hidden = false;
    error.textContent = message;
  }

  // Giriş kontrolü
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    stopMessageAnimation();
    error.textContent = 'Giriş yapılıyor...';

    const password = passwordInput.value;

    const { error: loginError } = await db.auth.signInWithPassword({
      email: "emirhanazra@gmail.com",
      password: password
    });

    if (loginError) {
      error.textContent = '';
      passwordInput.value = '';
      passwordInput.focus();

      startMessageAnimation();
      return;
    }

    error.textContent = '';
    stopMessageAnimation();
    showSite();
  });

  logoutButton.addEventListener('click', async () => {
    await db.auth.signOut();
    memoryForm.hidden = true;
    showLogin('Oturum kapatıldı.');
  });

  showMemoryForm.addEventListener('click', () => {
    editingMemory = null;
    memoryForm.reset();
    memoryPhoto.required = true;
    memoryFormHeading.textContent = 'Yeni Anı';
    saveMemoryButton.textContent = 'Anıyı Kaydet';
    memoryStatus.textContent = '';
    memoryForm.hidden = false;
    memoryTitle.focus();
  });

  cancelMemory.addEventListener('click', () => {
    memoryForm.hidden = true;
    memoryForm.reset();
    editingMemory = null;
  });

  async function loadMemories() {
    gallery.innerHTML = '<p>♡ Anılar yükleniyor...</p>';

    const { data, error: listError } = await db
      .from('memories')
      .select('id,title,description,image_url,created_at')
      .order('created_at', { ascending: false });

    if (listError) {
      gallery.innerHTML = '';

      const msg = document.createElement('p');
      msg.textContent = 'Anılar yüklenemedi. Supabase tablo ve erişim izinlerini kontrol edin.';
      gallery.appendChild(msg);

      console.error(listError);
      return;
    }

    currentMemories = data || [];
    gallery.innerHTML = '';

    if (!currentMemories.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Henüz anı eklenmemiş. İlk anınızı ekleyin ♡';
      gallery.appendChild(empty);
      return;
    }

    for (const memory of currentMemories) {
      const { data: signedData, error: signedError } = await db.storage
        .from(MEMORY_BUCKET)
        .createSignedUrl(memory.image_url, 60 * 60);

      const card = document.createElement('article');
      card.className = 'memory-card';

      if (!signedError && signedData?.signedUrl) {
        const img = document.createElement('img');
        img.src = signedData.signedUrl;
        img.alt = memory.title || 'Anımız';
        img.loading = 'lazy';
        card.appendChild(img);
      } else {
        const missing = document.createElement('div');
        missing.className = 'memory-image-missing';
        missing.textContent = 'Fotoğraf açılamadı ♡';
        card.appendChild(missing);
      }

      const body = document.createElement('div');
      body.className = 'memory-card-body';

      const title = document.createElement('h3');
      title.textContent = memory.title || 'Anımız';

      const description = document.createElement('p');
      description.textContent = memory.description || '';

      body.append(title, description);

      const actions = document.createElement('div');
      actions.className = 'memory-actions';

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Düzenle';
      edit.addEventListener('click', () => beginEdit(memory));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Sil';
      remove.addEventListener('click', () => deleteMemory(memory));

      actions.append(edit, remove);
      body.appendChild(actions);
      card.appendChild(body);
      gallery.appendChild(card);
    }
  }

  function beginEdit(memory) {
    editingMemory = memory;
    memoryTitle.value = memory.title || '';
    memoryDescription.value = memory.description || '';
    memoryPhoto.value = '';
    memoryPhoto.required = false;
    memoryFormHeading.textContent = 'Anıyı Düzenle';
    saveMemoryButton.textContent = 'Değişiklikleri Kaydet';
    memoryStatus.textContent = 'Yeni fotoğraf seçmezsen mevcut fotoğraf korunur.';
    memoryForm.hidden = false;
    memoryTitle.focus();
  }

  async function deleteMemory(memory) {
    if (!confirm(`"${memory.title}" anısını silmek istediğine emin misin?`)) return;

    const { error: deleteError } = await db.from('memories').delete().eq('id', memory.id);

    if (deleteError) {
      alert('Anı silinemedi. Tekrar deneyin.');
      console.error(deleteError);
      return;
    }

    const { error: storageError } = await db.storage.from(MEMORY_BUCKET).remove([memory.image_url]);

    if (storageError) console.error('Fotoğraf silme hatası:', storageError);

    await loadMemories();
  }

  memoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = memoryTitle.value.trim();
    const description = memoryDescription.value.trim();
    const file = memoryPhoto.files[0];

    if (!title) {
      memoryStatus.textContent = 'Lütfen anıya bir başlık yaz.';
      return;
    }

    if (!editingMemory && !file) {
      memoryStatus.textContent = 'Lütfen bir fotoğraf seç.';
      return;
    }

    if (file && !file.type.startsWith('image/')) {
      memoryStatus.textContent = 'Lütfen bir görsel dosyası seç.';
      return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
      memoryStatus.textContent = 'Fotoğraf en fazla 10 MB olabilir.';
      return;
    }

    saveMemoryButton.disabled = true;
    memoryStatus.textContent = 'Kaydediliyor...';

    let uploadedPath = null;

    try {
      let imagePath = editingMemory?.image_url || null;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        uploadedPath = `${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await db.storage.from(MEMORY_BUCKET).upload(uploadedPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

        if (uploadError) throw uploadError;
        imagePath = uploadedPath;
      }

      if (editingMemory) {
        const { error: updateError } = await db.from('memories').update({
          title, description, image_url: imagePath
        }).eq('id', editingMemory.id);

        if (updateError) throw updateError;

        if (file && editingMemory.image_url) {
          const { error: oldPhotoError } = await db.storage.from(MEMORY_BUCKET).remove([editingMemory.image_url]);
          if (oldPhotoError) console.error('Eski fotoğraf silinemedi:', oldPhotoError);
        }
      } else {
        const { error: insertError } = await db.from('memories').insert({
          title, description, image_url: imagePath
        });

        if (insertError) throw insertError;
      }

      memoryForm.reset();
      memoryForm.hidden = true;
      editingMemory = null;
      memoryPhoto.required = true;
      memoryStatus.textContent = '';
      await loadMemories();

    } catch (err) {
      if (uploadedPath) {
        await db.storage.from(MEMORY_BUCKET).remove([uploadedPath]);
      }

      console.error(err);
      memoryStatus.textContent = 'Kaydedilemedi. Tablo, bucket ve erişim izinlerini kontrol edin.';

    } finally {
      saveMemoryButton.disabled = false;
    }
  });

  const { data: sessionData } = await db.auth.getSession();

  if (sessionData?.session) showSite();
  else showLogin();
});
