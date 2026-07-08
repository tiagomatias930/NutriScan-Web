/* ==========================================================================
   NutriScan Mobile Landing Page Javascript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Hamburger Toggle
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // 2. Theme Toggle (Light / Dark Mode)
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyEl = document.body;

    // Check for saved theme preference, default to system preference if none
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        bodyEl.className = savedTheme + '-theme';
    } else if (systemPrefersDark) {
        bodyEl.className = 'dark-theme';
    } else {
        bodyEl.className = 'light-theme';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (bodyEl.classList.contains('light-theme')) {
                bodyEl.classList.remove('light-theme');
                bodyEl.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                bodyEl.classList.remove('dark-theme');
                bodyEl.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // 3. Screenshots Carousel
    const carouselTrack = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevSlideBtn');
    const nextBtn = document.getElementById('nextSlideBtn');
    const slideTitleEl = document.getElementById('slideTitle');
    const slideDescEl = document.getElementById('slideDesc');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (carouselTrack && prevBtn && nextBtn && slideTitleEl && slideDescEl && dotsContainer) {
        const slides = Array.from(carouselTrack.children);
        let currentIndex = 0;
        const slideCount = slides.length;

        // Generate Dots dynamically
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
            dotsContainer.appendChild(dot);
        });

        const dots = Array.from(dotsContainer.children);

        // Update descriptions and positions
        function updateCarouselState() {
            // Slide translation offset
            // We calculate based on center aligning the active slide
            // Slide width (160px) + Gap (32px) = 192px
            const slideWidthWithGap = 192;
            const containerWidth = carouselTrack.parentElement.clientWidth;
            
            // Calculate center position
            const offset = (containerWidth / 2) - (160 / 2) - (currentIndex * slideWidthWithGap);
            carouselTrack.style.transform = `translateX(${offset}px)`;

            // Update active classes on slides and dots
            slides.forEach((slide, index) => {
                if (index === currentIndex) {
                    slide.classList.add('active');
                    // Update text block
                    slideTitleEl.textContent = slide.dataset.title;
                    slideDescEl.textContent = slide.dataset.desc;
                } else {
                    slide.classList.remove('active');
                }
            });

            dots.forEach((dot, index) => {
                if (index === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        function goToSlide(index) {
            // Bound checking for loop
            if (index < 0) {
                currentIndex = slideCount - 1;
            } else if (index >= slideCount) {
                currentIndex = 0;
            } else {
                currentIndex = index;
            }
            updateCarouselState();
        }

        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
        });

        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
        });

        // Touch swipe support for mobile
        let startX = 0;
        let isSwiping = false;

        carouselTrack.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
        }, { passive: true });

        carouselTrack.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            const diffX = e.touches[0].clientX - startX;
            if (Math.abs(diffX) > 50) { // Threshold
                if (diffX > 0) {
                    goToSlide(currentIndex - 1);
                } else {
                    goToSlide(currentIndex + 1);
                }
                isSwiping = false; // Prevent double trigger
            }
        }, { passive: true });

        carouselTrack.addEventListener('touchend', () => {
            isSwiping = false;
        });

        // Initialize state
        // Need to wait slightly for DOM/image layouts to solve clientWidth calculations
        setTimeout(updateCarouselState, 100);
        window.addEventListener('resize', updateCarouselState);
    }

    // 4. CTA Form Handling
    const leadForm = document.getElementById('leadForm');
    const formFeedback = document.getElementById('formFeedback');
    const userEmailInput = document.getElementById('userEmail');

    if (leadForm && formFeedback && userEmailInput) {
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailValue = userEmailInput.value.trim();
            if (emailValue && userEmailInput.validity.valid) {
                // Simulate network request
                const btnSubmit = leadForm.querySelector('.btn-submit');
                const originalBtnText = btnSubmit.textContent;
                
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'A processar...';

                setTimeout(() => {
                    // Success callback
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = originalBtnText;
                    
                    formFeedback.classList.add('success');
                    formFeedback.textContent = `Obrigado! O email ${emailValue} foi inscrito com sucesso.`;
                    
                    // Reset input
                    leadForm.reset();
                    
                    // Hide feedback after 5 seconds
                    setTimeout(() => {
                        formFeedback.classList.remove('success');
                    }, 5000);
                }, 1000);
            }
        });
    }
});
