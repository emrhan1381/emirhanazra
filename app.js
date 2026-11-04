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

  // Relationship counter
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
  });
});
