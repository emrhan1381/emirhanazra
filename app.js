document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('password-form');
  const input = document.getElementById('site-password');
  const error = document.getElementById('password-error');
  const screen = document.getElementById('password-screen');
  const content = document.getElementById('site-content');
  const wrongMessages = [
    'Ne yani hatırlamıyor musun?',
    'Yoksa beni sevmiyor musun artık',
    'Unutmuş olamazsın',
    'Lütfen hatırlaa'
  ];
  let wrongAttempts = 0;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value.trim() === '141026') {
      screen.hidden = true;
      content.hidden = false;
      return;
    }
    error.textContent = wrongMessages[Math.min(wrongAttempts, wrongMessages.length - 1)];
    wrongAttempts += 1;
    input.value = '';
    input.focus();
  });

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
  document.getElementById('photos').addEventListener('change', (event) => {
    for (const file of event.target.files) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      document.getElementById('gallery').appendChild(img);
    }
  });
});
