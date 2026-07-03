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

  // 6. Dynamic Header Navigation Highlighting
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll("nav.main-nav ul li a");
  
  // Clear any statically hardcoded active classes first
  document.querySelectorAll("nav.main-nav ul li").forEach(li => {
    li.classList.remove("active");
  });

  let matched = false;
  
  // Check exact/sub-path matching
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    
    // Check if the current page path ends with or matches the link href
    // We handle absolute/relative and trailing slashes
    const normHref = href.replace(/\/$/, "");
    const normPath = currentPath.replace(/\/$/, "");
    
    if (normHref && normPath === normHref) {
      // Set active on parent li
      link.parentElement.classList.add("active");
      
      // If it is inside a dropdown, also highlight the parent has-dropdown li
      const parentDropdown = link.closest(".has-dropdown");
      if (parentDropdown) {
        parentDropdown.classList.add("active");
      }
      matched = true;
    }
  });

  // Fallback: If no subpage matched and path is empty/root, highlight Home
  if (!matched || currentPath === "/" || currentPath === "/index.html") {
    const homeLi = document.querySelector("nav.main-nav ul li:first-child");
    if (homeLi) homeLi.classList.add("active");
  }

  // 7. Scroll-to-Top Jet Silhouette Button
  const scrollTopBtn = document.createElement("button");
  scrollTopBtn.id = "scroll-top-btn";
  scrollTopBtn.setAttribute("aria-label", "Scroll to top");
  scrollTopBtn.innerHTML = '<i class="fas fa-plane"></i>';
  scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    color: var(--gold);
    font-size: 1.4rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, transform 0.3s, border-color 0.3s, background 0.3s;
    z-index: 9999;
    box-shadow: var(--shadow-md);
  `;
  document.body.appendChild(scrollTopBtn);

  // Rotate plane icon upward
  const jetIcon = scrollTopBtn.querySelector("i");
  jetIcon.style.transform = "rotate(-45deg)";
  jetIcon.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.style.opacity = "1";
      scrollTopBtn.style.visibility = "visible";
      scrollTopBtn.style.transform = "translateY(0)";
    } else {
      scrollTopBtn.style.opacity = "0";
      scrollTopBtn.style.visibility = "hidden";
      scrollTopBtn.style.transform = "translateY(20px)";
    }
  });

  scrollTopBtn.addEventListener("mouseenter", () => {
    scrollTopBtn.style.borderColor = "var(--gold)";
    scrollTopBtn.style.background = "rgba(201, 169, 110, 0.08)";
    jetIcon.style.transform = "rotate(-45deg) translateY(-3px) scale(1.1)";
  });

  scrollTopBtn.addEventListener("mouseleave", () => {
    scrollTopBtn.style.borderColor = "var(--border)";
    scrollTopBtn.style.background = "var(--bg-surface)";
    jetIcon.style.transform = "rotate(-45deg)";
  });

  scrollTopBtn.addEventListener("click", () => {
    // Jet take-off acceleration animation on click
    jetIcon.style.transform = "rotate(-45deg) translate(50px, -50px) scale(1.5)";
    jetIcon.style.opacity = "0";

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // Reset jet position after scroll finishes
    setTimeout(() => {
      jetIcon.style.transition = "none";
      jetIcon.style.transform = "rotate(-45deg) translate(-50px, 50px) scale(0.5)";
      setTimeout(() => {
        jetIcon.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s";
        jetIcon.style.transform = "rotate(-45deg)";
        jetIcon.style.opacity = "1";
      }, 50);
    }, 800);
  });

  // 8. Contact Form Validation and Success State
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    const inputs = contactForm.querySelectorAll(".form-control");

    inputs.forEach(input => {
      // Add validation styling on input blur
      input.addEventListener("blur", () => {
        if (input.checkValidity()) {
          input.classList.remove("invalid-field");
          input.classList.add("valid-field");
        } else {
          input.classList.remove("valid-field");
          input.classList.add("invalid-field");
        }
      });

      // Clear styles on active typing
      input.addEventListener("input", () => {
        input.classList.remove("invalid-field");
        input.classList.remove("valid-field");
      });
    });

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      let formIsValid = true;
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          input.classList.add("invalid-field");
          formIsValid = false;
        } else {
          input.classList.add("valid-field");
        }
      });

      if (!formIsValid) return;

      // Submit Button Loading state
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transmitting...';

      // Simulate secure transmission check
      setTimeout(() => {
        // Success Overlay popup
        const overlay = document.createElement("div");
        overlay.style.cssText = `
          position: absolute;
          inset: 0;
          background: rgba(11, 17, 33, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.4s ease;
          border-radius: var(--radius-md);
          text-align: center;
          padding: 24px;
        `;
        overlay.innerHTML = `
          <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(201, 169, 110, 0.1); border: 2px solid var(--gold); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <i class="fas fa-check" style="color: var(--gold); font-size: 2rem;"></i>
          </div>
          <h4 style="font-family: var(--font-heading); color: var(--text-primary); margin-bottom: 10px; font-size: 1.3rem;">TRANSMISSION RECEIVED</h4>
          <p style="color: var(--text-body); font-size: 0.95rem; max-width: 280px; margin: 0 auto 24px;">Your message has been secure-logged. Our engineering team will contact you shortly.</p>
          <button class="btn btn-outline" id="success-dismiss-btn" style="padding: 8px 24px; font-size: 0.85rem;">Dismiss</button>
        `;

        const formWrapper = contactForm.closest(".contact-form-wrapper");
        if (getComputedStyle(formWrapper).position === "static") {
          formWrapper.style.position = "relative";
        }
        formWrapper.appendChild(overlay);

        // Force reflow and fade-in
        overlay.offsetHeight;
        overlay.style.opacity = "1";

        // Reset form
        contactForm.reset();
        inputs.forEach(input => {
          input.classList.remove("valid-field");
        });

        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        // Dismiss action
        overlay.querySelector("#success-dismiss-btn").addEventListener("click", () => {
          overlay.style.opacity = "0";
          setTimeout(() => overlay.remove(), 400);
        });

      }, 1500);
    });
  }

  // 9. Interactive Capabilities Specs Tooltips (Facility & Subpages)
  // Find tables, lists, or specs items and make them interactive
  const specItems = document.querySelectorAll(".spec-list li, .facility-list li, .info-card p");
  
  specItems.forEach(item => {
    // Check if it lists technical attributes (contains numbers, decimals, mm, etc.)
    const text = item.textContent || "";
    const hasTechnicalKeywords = /\b(\d+(\.\d+)?(mm|px|hp|kw|axis|ton|v|hz|%|kg|m)|machin|cnc|lathe|test|measur|toleran|capacity)/i.test(text);

    if (hasTechnicalKeywords && !item.querySelector("a")) {
      item.style.position = "relative";
      item.style.cursor = "help";
      item.style.borderBottom = "1px dashed rgba(201, 169, 110, 0.4)";
      item.style.display = "inline-block";
      item.style.width = "100%";
      item.style.paddingBottom = "4px";

      item.addEventListener("mouseenter", (e) => {
        // Create custom tooltip matching the glassmorphism system
        const tooltip = document.createElement("div");
        tooltip.className = "specs-tooltip";
        tooltip.style.cssText = `
          position: absolute;
          left: 10px;
          bottom: 110%;
          background: rgba(11, 17, 33, 0.95);
          border: 1px solid var(--gold);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 0.8rem;
          font-family: var(--font-body);
          z-index: 1000;
          pointer-events: none;
          box-shadow: var(--shadow-md);
          max-width: 250px;
          line-height: 1.4;
          opacity: 0;
          transform: translateY(5px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          backdrop-filter: blur(8px);
        `;
        
        // Custom text details based on content keywords
        let tipText = "Aerospace Grade Precision Spec Check";
        if (/toleran/i.test(text)) tipText = "High-precision tolerance quality check compliant with AS9100 rules.";
        else if (/cnc|machin/i.test(text)) tipText = "Automated machine operation for precision aerospace components manufacturing.";
        else if (/jig|fixtur/i.test(text)) tipText = "Custom master tooling and assembly fixture built to aerospace specifications.";
        else if (/test|rig/i.test(text)) tipText = "Proof testing rig with strict pressure calibration standards.";
        else if (/approved|cemilac/i.test(text)) tipText = "CEMILAC flight-certification approved quality control standard.";
        else if (/\b\d+\s*(mm|inch)\b/i.test(text)) tipText = "Millimeter dimensional check calibrated using precision tools.";
        
        tooltip.innerHTML = `<strong style="color:var(--gold); display:block; margin-bottom:4px; font-family:var(--font-heading); font-size:0.7rem; letter-spacing:0.05em; text-transform:uppercase;">Aerospace Spec Details</strong> ${tipText}`;
        
        item.appendChild(tooltip);
        // Force reflow
        tooltip.offsetHeight;
        tooltip.style.opacity = "1";
        tooltip.style.transform = "translateY(0)";
      });

      item.addEventListener("mouseleave", () => {
        const tooltip = item.querySelector(".specs-tooltip");
        if (tooltip) {
          tooltip.style.opacity = "0";
          tooltip.style.transform = "translateY(5px)";
          setTimeout(() => tooltip.remove(), 250);
        }
      });
    }
  });

  // 10. Live Product Search / Filter
  // Run on the Products category lists
  const searchInput = document.createElement("input");
  const productHeader = document.querySelector(".products-grid, .feature-grid.reveal-stagger");
  if (productHeader && window.location.pathname.includes("/products/")) {
    const filterContainer = document.createElement("div");
    filterContainer.style.cssText = "width: 100%; max-width: 480px; margin: 0 auto 40px; display: block; position: relative;";
    
    searchInput.type = "text";
    searchInput.placeholder = "Search product categories... (e.g. jigs, CEMILAC)";
    searchInput.className = "form-control";
    searchInput.style.cssText = "text-align: center; border-radius: 30px; border: 1px solid var(--border); background: var(--bg-surface); padding: 12px 20px; font-size: 0.95rem; box-shadow: var(--shadow-sm);";

    filterContainer.appendChild(searchInput);
    productHeader.parentNode.insertBefore(filterContainer, productHeader);

    const cards = productHeader.querySelectorAll(".service-card");

    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      cards.forEach(card => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        const p = card.querySelector("p").textContent.toLowerCase();
        
        if (title.includes(q) || p.includes(q)) {
          card.style.display = "";
          card.style.opacity = "1";
          card.style.transform = "scale(1)";
        } else {
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          setTimeout(() => {
            if (card.style.opacity === "0") card.style.display = "none";
          }, 300);
        }
      });
    });
  }
});