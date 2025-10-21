   // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - (document.querySelector('.navbar').offsetHeight),
                        behavior: 'smooth'
                    });
                } else {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Show/hide navbar on scroll
        const navbar = document.querySelector('.navbar');
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const currentScrollTop = window.scrollY || document.documentElement.scrollTop;

            if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
                navbar.classList.remove('visible');
            } else if (currentScrollTop < lastScrollTop) {
                navbar.classList.add('visible');
            }
            lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
        });

        // Scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

      

        // Add some interactive particles effect
        function createParticle() {
            const colors = ['#24a0a5', '#f18489', '#eed464', '#a7d5d6'];
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
                left: ${Math.random() * 100}vw;
                animation: float ${Math.random() * 3 + 2}s linear infinite;
            `;
            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 5000);
        }

        // Create particles periodically
        setInterval(createParticle, 3000);

        //script de carrusel
      const carousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('dots');
let currentIndex = 0;

// Calcula cuántas cards se ven según el ancho
function getCardsPerView() {
  if (window.innerWidth <= 600) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

// Crea los dots dinámicamente
function createDots() {
  dotsContainer.innerHTML = "";
  const totalCards = carousel.children.length;
  const cardsPerView = getCardsPerView();
  const totalSlides = Math.ceil(totalCards / cardsPerView);

  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }
}

// Actualiza la posición del carrusel
function updateCarousel() {
  const cardWidth = carousel.querySelector('.app-card').offsetWidth + 20;
  const offset = currentIndex * cardWidth * getCardsPerView();
  carousel.style.transform = `translateX(-${offset}px)`;

  const dots = dotsContainer.querySelectorAll('.dot');
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));

  const totalCards = carousel.children.length;
  const totalSlides = Math.ceil(totalCards / getCardsPerView());
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex >= totalSlides - 1;
}

function goToSlide(index) {
  currentIndex = index;
  updateCarousel();
}

// Navegación
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) currentIndex--;
  updateCarousel();
});

nextBtn.addEventListener('click', () => {
  const totalCards = carousel.children.length;
  const totalSlides = Math.ceil(totalCards / getCardsPerView());
  if (currentIndex < totalSlides - 1) currentIndex++;
  updateCarousel();
});

// Soporte táctil
let startX = 0;
carousel.addEventListener('touchstart', e => startX = e.touches[0].clientX);
carousel.addEventListener('touchend', e => {
  const endX = e.changedTouches[0].clientX;
  if (startX - endX > 50) nextBtn.click();
  if (endX - startX > 50) prevBtn.click();
});

// Redimensionamiento
window.addEventListener('resize', () => {
  currentIndex = 0;
  createDots();
  updateCarousel();
});

// Inicialización
createDots();
updateCarousel();

// SCRIPT DE PDF
 function openPDF(url, title) {
    document.getElementById('pdfEmbed').src = url;
    document.getElementById('pdfTitle').textContent = title;
    document.getElementById('pdfViewer').classList.add('active');
    setTimeout(() => {
        document.getElementById('pdfViewer').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function closePDF() {
    document.getElementById('pdfViewer').classList.remove('active');
    document.getElementById('pdfEmbed').src = '';
}

// Bloquear menú contextual (click derecho)
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Bloquear teclas comunes (F12, Ctrl+Shift+I, Ctrl+U)
document.onkeydown = function(e) {
  if (e.keyCode == 123) { // F12
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == 73) { // Ctrl+Shift+I
    return false;
  }
  if (e.ctrlKey && e.keyCode == 85) { // Ctrl+U
    return false;
  }
};