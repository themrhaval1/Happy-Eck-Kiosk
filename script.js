
document.addEventListener("DOMContentLoaded", () => {
  // Navigation: sanftes Scrollen
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Animationen beim Scrollen
  const elements = document.querySelectorAll(".card, .section-title");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(element => observer.observe(element));
  }

  // Aktuelles Jahr im Footer
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
