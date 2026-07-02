/*
  Polynex Main Script
  Handles: Scroll header, Mobile Nav, Stats counter, Image Lightbox, Scroll Reveal
*/

document.addEventListener("DOMContentLoaded", () => {
  // 1. Header scroll effect
  const header = document.querySelector("header.site-header");
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Initial check

  // 2. Mobile Menu Toggle
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector("nav.main-nav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("active");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        if (mainNav.classList.contains("active")) {
          icon.className = "fas fa-times";
        } else {
          icon.className = "fas fa-bars";
        }
      }
    });

    // Close mobile nav when clicking a link
    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("active");
        const icon = menuToggle.querySelector("i");
        if (icon) icon.className = "fas fa-bars";
      });
    });
  }

  // 3. Stats Counter Animation (with "+" suffix)
  const stats = document.querySelectorAll(".stat-number");
  if (stats.length > 0) {
    const runCounter = (el) => {
      const target = parseInt(el.getAttribute("data-target") || "0", 10);
      const duration = 2200;
      const startTime = performance.now();

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic for smoother deceleration
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * target);

        el.textContent = current + "+";
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target + "+";
        }
      };
      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target); // Run once
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
  }

  // 4. Scroll Reveal Animation
  const revealElements = document.querySelectorAll(".reveal, .reveal-stagger");
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // 5. Custom Lightweight Lightbox
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" aria-label="Close lightbox"><i class="fas fa-times"></i></button>
      <img src="" alt="Zoomed view">
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector("img");
  const lightboxClose = lightbox.querySelector(".lightbox-close");

  const openLightbox = (src, alt) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Zoomed image";
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => {
      lightboxImg.src = "";
    }, 300);
  };

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-content")) {
      closeLightbox();
    }
  });

  // Close lightbox with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });

  // Attach lightbox to all images with zoom-trigger class or inside product-image-wrap/certificate-img-wrap
  document.body.addEventListener("click", (e) => {
    const target = e.target.closest(".product-image-wrap img, .certificate-img-wrap img, img.zoom-trigger");
    if (target) {
      openLightbox(target.src, target.alt);
    }
  });
});
