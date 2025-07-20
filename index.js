// Enhanced JavaScript for Ascenda Website

// Configuration
const config = {
    animationDuration: 300,
    scrollOffset: 100,
    particleCount: 50,
    counterSpeed: 2000
};

// Utility Functions
const utils = {
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // Random number generator
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Easing functions
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
};

// DOM Management
class DOMManager {
    constructor() {
        this.elements = {
            header: document.querySelector('.header'),
            navToggle: document.getElementById('nav-toggle'),
            navLinks: document.getElementById('nav-links'),
            scrollIndicator: document.querySelector('.scroll-indicator'),
            stats: document.querySelectorAll('[data-target]'),
            particlesContainer: document.getElementById('particles-background')
        };
        
        this.state = {
            isMenuOpen: false,
            hasScrolled: false,
            countersAnimated: false
        };
    }

    init() {
        this.bindEvents();
        this.createParticles();
        this.handleInitialLoad();
    }

    bindEvents() {
        // Mobile menu toggle
        if (this.elements.navToggle) {
            this.elements.navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // Scroll events
        window.addEventListener('scroll', utils.throttle(() => this.handleScroll(), 16));
        
        // Resize events
        window.addEventListener('resize', utils.debounce(() => this.handleResize(), 250));

        // Intersection Observer for animations
        this.setupIntersectionObserver();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    toggleMobileMenu() {
        this.state.isMenuOpen = !this.state.isMenuOpen;
        
        if (this.elements.navLinks) {
            this.elements.navLinks.classList.toggle('active', this.state.isMenuOpen);
        }
        
        if (this.elements.navToggle) {
            this.elements.navToggle.classList.toggle('active', this.state.isMenuOpen);
        }

        // Prevent body scroll when menu is open
        document.body.style.overflow = this.state.isMenuOpen ? 'hidden' : '';
    }

    handleSmoothScroll(e) {
        e.preventDefault();
        
        const targetId = e.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const headerHeight = this.elements.header ? this.elements.header.offsetHeight : 0;
            const targetPosition = targetElement.offsetTop - headerHeight;
            
            this.smoothScrollTo(targetPosition);
            
            // Close mobile menu if open
            if (this.state.isMenuOpen) {
                this.toggleMobileMenu();
            }
        }
    }

    smoothScrollTo(targetPosition) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            window.scrollTo(0, startPosition + distance * utils.easeOutCubic(progress));
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    handleScroll() {
        const scrollTop = window.pageYOffset;
        const hasScrolled = scrollTop > 50;

        // Header background on scroll
        if (hasScrolled !== this.state.hasScrolled) {
            this.state.hasScrolled = hasScrolled;
            
            if (this.elements.header) {
                this.elements.header.style.background = hasScrolled 
                    ? 'rgba(15, 23, 42, 0.98)' 
                    : 'rgba(15, 23, 42, 0.95)';
            }
        }

        // Hide scroll indicator after scrolling
        if (this.elements.scrollIndicator && scrollTop > 100) {
            this.elements.scrollIndicator.style.opacity = '0';
            this.elements.scrollIndicator.style.visibility = 'hidden';
        }

        // Parallax effect for floating orbs
        this.updateParallax(scrollTop);
    }

    updateParallax(scrollTop) {
        const orbs = document.querySelectorAll('.gradient-orb');
        orbs.forEach((orb, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = -(scrollTop * speed);
            orb.style.transform = `translateY(${yPos}px)`;
        });
    }

    handleResize() {
        // Close mobile menu on resize to larger screen
        if (window.innerWidth > 768 && this.state.isMenuOpen) {
            this.toggleMobileMenu();
        }

        // Recalculate particle positions
        this.createParticles();
    }

    handleKeyboard(e) {
        // Close mobile menu with Escape key
        if (e.key === 'Escape' && this.state.isMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    
                    // Trigger counter animation for stats
                    if (entry.target.closest('.trust-bar') && !this.state.countersAnimated) {
                        this.state.countersAnimated = true;
                        this.animateCounters();
                    }
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const elementsToObserve = [
            ...document.querySelectorAll('.pain-card'),
            ...document.querySelectorAll('.solution-card'),
            ...document.querySelectorAll('.project-card'),
            ...document.querySelectorAll('.contact-card'),
            ...document.querySelectorAll('.stat'),
            document.querySelector('.founder-content'),
            document.querySelector('.pain-cta'),
            document.querySelector('.projects-summary')
        ].filter(Boolean);

        elementsToObserve.forEach(el => observer.observe(el));
    }

    animateCounters() {
        this.elements.stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = config.counterSpeed;
            const increment = target / (duration / 16); // 60fps
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = target;
                }
            };

            updateCounter();
        });
    }

    createParticles() {
        if (!this.elements.particlesContainer) return;

        // Clear existing particles
        this.elements.particlesContainer.innerHTML = '';

        const particleCount = Math.min(config.particleCount, window.innerWidth / 20);

        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle();
            this.elements.particlesContainer.appendChild(particle);
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        const size = utils.random(2, 6);
        const animationDuration = utils.random(15, 25);
        const opacity = utils.random(0.1, 0.4);
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(37, 99, 235, ${opacity}) 0%, transparent 70%);
            border-radius: 50%;
            left: ${utils.random(0, 100)}%;
            top: ${utils.random(0, 100)}%;
            animation: float ${animationDuration}s infinite linear;
            pointer-events: none;
        `;

        return particle;
    }

    handleInitialLoad() {
        // Add loading class to body
        document.body.classList.add('loading');
        
        // Remove loading class when page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.classList.remove('loading');
                document.body.classList.add('loaded');
            }, 100);
        });

        // Progressive loading of images
        this.lazyLoadImages();
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }
}

// Enhanced Button Interactions
class ButtonEnhancer {
    constructor() {
        this.buttons = document.querySelectorAll('.btn');
        this.init();
    }

    init() {
        this.buttons.forEach(button => {
            this.enhanceButton(button);
        });
    }

    enhanceButton(button) {
        // Add ripple effect
        button.addEventListener('click', (e) => {
            this.createRipple(e);
        });

        // Add hover sound effect (optional)
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
    }

    createRipple(e) {
        const button = e.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        // Add ripple styles
        circle.style.cssText += `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);

        // Remove ripple after animation
        setTimeout(() => {
            circle.remove();
        }, 600);
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0
        };
        
        this.init();
    }

    init() {
        // Monitor page load time
        window.addEventListener('load', () => {
            this.metrics.loadTime = performance.now();
            this.logMetrics();
        });

        // Monitor render time
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.metrics.renderTime = performance.now();
            });
        }
    }

    logMetrics() {
        if (process.env.NODE_ENV === 'development') {
            console.log('Performance Metrics:', this.metrics);
        }
    }
}

// Form Handling (if needed for future contact forms)
class FormHandler {
    constructor() {
        this.forms = document.querySelectorAll('form');
        this.init();
    }

    init() {
        this.forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Add loading state
        this.setLoadingState(form, true);
        
        // Simulate form submission
        setTimeout(() => {
            this.setLoadingState(form, false);
            this.showSuccessMessage(form);
        }, 2000);
    }

    setLoadingState(form, isLoading) {
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? 'Sending...' : 'Send Message';
        }
    }

    showSuccessMessage(form) {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = 'Thank you! Your message has been sent.';
        message.style.cssText = `
            background: #10b981;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            text-align: center;
        `;
        
        form.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            form.reset();
        }, 5000);
    }
}

// Error Handling
class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('error', (e) => {
            this.logError(e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.logError(e.reason);
        });
    }

    logError(error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Application Error:', error);
        }
        
        // In production, you might want to send errors to a logging service
    }
}

// Initialize Application
class AscendaApp {
    constructor() {
        this.domManager = null;
        this.buttonEnhancer = null;
        this.performanceMonitor = null;
        this.formHandler = null;
        this.errorHandler = null;
    }

    init() {
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        try {
            // Initialize all components
            this.domManager = new DOMManager();
            this.buttonEnhancer = new ButtonEnhancer();
            this.performanceMonitor = new PerformanceMonitor();
            this.formHandler = new FormHandler();
            this.errorHandler = new ErrorHandler();

            // Initialize DOM manager
            this.domManager.init();

            // Add custom CSS animations
            this.addCustomStyles();

            console.log('Ascenda website initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize Ascenda website:', error);
        }
    }

    addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .success-message {
                animation: slideInUp 0.3s ease;
            }
            
            @keyframes slideInUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Start the application
const app = new AscendaApp();
app.init();
