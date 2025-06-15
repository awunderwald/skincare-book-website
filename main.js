// Configuración global
const CONFIG = {
    stripe: {
        publicKey: 'pk_test_TYooMQauvdEDq54NiTphI7jx', // Clave de prueba - reemplazar con clave real
        priceId: 'price_skincare_preventa_10usd'
    },
    paypal: {
        clientId: 'test_paypal_client_id' // Reemplazar con client ID real
    },
    api: {
        newsletter: '/api/newsletter/subscribe',
        payment: '/api/payment/process'
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeAnimations();
    initializeNewsletter();
    initializePaymentSystem();
    initializeSmoothScrolling();
    initializeBookShowcase();
});

// ===== NAVEGACIÓN =====
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Cerrar menu al hacer click en un enlace
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ===== ANIMACIONES =====
function initializeAnimations() {
    // Intersection Observer para animaciones al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animar
    const elementsToAnimate = document.querySelectorAll(
        '.why-card, .chapter-card, .author-card, .testimonial, .baby-feature'
    );
    
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });
}

// ===== NEWSLETTER =====
function initializeNewsletter() {
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const submitBtn = newsletterForm.querySelector('.btn-newsletter');
            const originalText = submitBtn.innerHTML;
            
            // Validación básica
            if (!emailInput.value || !isValidEmail(emailInput.value)) {
                showNotification('Por favor, ingresa un email válido', 'error');
                return;
            }
            
            // Estado de carga
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suscribiendo...';
            submitBtn.disabled = true;
            
            try {
                // Simular llamada a API (reemplazar con endpoint real)
                await simulateNewsletterSubscription(emailInput.value);
                
                // Éxito
                showNotification('¡Suscripción exitosa! Te enviaremos contenido exclusivo.', 'success');
                emailInput.value = '';
                
                // Guardar en localStorage para tracking
                localStorage.setItem('newsletter_subscribed', 'true');
                localStorage.setItem('newsletter_email', emailInput.value);
                
            } catch (error) {
                console.error('Error al suscribir:', error);
                showNotification('Error al procesar la suscripción. Inténtalo nuevamente.', 'error');
            } finally {
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// ===== SISTEMA DE PAGOS =====
function initializePaymentSystem() {
    initializeStripe();
    initializePayPal();
}

// Stripe
function initializeStripe() {
    if (typeof Stripe === 'undefined') {
        console.warn('Stripe no está cargado');
        return;
    }
    
    const stripe = Stripe(CONFIG.stripe.publicKey);
    const elements = stripe.elements();
    
    // Configuración del elemento de tarjeta
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#2d2d2d',
                '::placeholder': {
                    color: '#8a8a8a',
                },
                fontFamily: 'Nunito, sans-serif',
            },
            invalid: {
                color: '#e74c3c',
            },
        },
    });
    
    const cardElementContainer = document.getElementById('card-element');
    if (cardElementContainer) {
        cardElement.mount('#card-element');
        
        // Manejar errores en tiempo real
        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
        
        // Manejar envío del formulario
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                await handleStripePayment(stripe, cardElement);
            });
        }
    }
}

async function handleStripePayment(stripe, cardElement) {
    const submitButton = document.getElementById('submit-payment');
    const originalText = submitButton.innerHTML;
    
    // Estado de carga
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitButton.disabled = true;
    
    try {
        // Obtener datos del formulario
        const customerName = document.getElementById('customer-name').value;
        const customerEmail = document.getElementById('customer-email').value;
        
        // Validaciones
        if (!customerName || !customerEmail) {
            throw new Error('Por favor, completa todos los campos requeridos');
        }
        
        if (!isValidEmail(customerEmail)) {
            throw new Error('Por favor, ingresa un email válido');
        }
        
        // Crear payment intent (esto debería hacerse en el backend)
        const { paymentIntent, error } = await stripe.confirmCardPayment(
            'pi_test_payment_intent', // Reemplazar con payment intent real del backend
            {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: customerName,
                        email: customerEmail,
                    },
                },
            }
        );
        
        if (error) {
            throw error;
        }
        
        if (paymentIntent.status === 'succeeded') {
            // Pago exitoso
            showPaymentSuccess(customerEmail);
            
            // Guardar información del pedido
            saveOrderInfo({
                customerName,
                customerEmail,
                amount: 10,
                currency: 'USD',
                paymentIntentId: paymentIntent.id,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('Error en el pago:', error);
        showNotification(error.message || 'Error al procesar el pago', 'error');
    } finally {
        // Restaurar botón
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// PayPal
function initializePayPal() {
    if (typeof paypal === 'undefined') {
        // Cargar PayPal SDK dinámicamente
        loadPayPalSDK();
        return;
    }
    
    const paypalContainer = document.getElementById('paypal-button-container');
    if (paypalContainer) {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '10.00',
                            currency_code: 'USD'
                        },
                        description: 'Skin Care Esencial - Preventa Libro Digital'
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    // Pago exitoso con PayPal
                    showPaymentSuccess(details.payer.email_address);
                    
                    // Guardar información del pedido
                    saveOrderInfo({
                        customerName: details.payer.name.given_name + ' ' + details.payer.name.surname,
                        customerEmail: details.payer.email_address,
                        amount: 10,
                        currency: 'USD',
                        paypalOrderId: details.id,
                        timestamp: new Date().toISOString()
                    });
                });
            },
            onError: function(err) {
                console.error('Error en PayPal:', err);
                showNotification('Error al procesar el pago con PayPal', 'error');
            }
        }).render('#paypal-button-container');
    }
}

function loadPayPalSDK() {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${CONFIG.paypal.clientId}&currency=USD`;
    script.onload = function() {
        initializePayPal();
    };
    document.head.appendChild(script);
}

// ===== SMOOTH SCROLLING =====
function initializeSmoothScrolling() {
    // Scroll suave para enlaces de navegación
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== SHOWCASE DEL LIBRO =====
function initializeBookShowcase() {
    const bookCover = document.querySelector('.book-cover');
    
    if (bookCover) {
        // Efecto de seguimiento del mouse
        bookCover.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });
        
        bookCover.addEventListener('mouseleave', function() {
            this.style.transform = 'rotateY(-5deg) rotateX(5deg) scale(1)';
        });
    }
}

// ===== FUNCIONES AUXILIARES =====

// Validación de email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Agregar estilos CSS dinámicamente
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                max-width: 400px;
                border-left: 4px solid var(--primary-color);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success {
                border-left-color: #27ae60;
            }
            .notification-error {
                border-left-color: #e74c3c;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .notification-content i {
                font-size: 1.2rem;
            }
            .notification-success i {
                color: #27ae60;
            }
            .notification-error i {
                color: #e74c3c;
            }
            .notification-info i {
                color: var(--primary-color);
            }
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #999;
                font-size: 1rem;
                padding: 0.25rem;
            }
            .notification-close:hover {
                color: #666;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-remover después de 5 segundos
    const autoRemove = setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Botón de cerrar
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        removeNotification(notification);
    });
}

function removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Mostrar éxito de pago
function showPaymentSuccess(email) {
    // Crear modal de éxito
    const modal = document.createElement('div');
    modal.className = 'payment-success-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>¡Pago Exitoso!</h2>
            <p>Gracias por tu compra. Recibirás el libro digital en <strong>${email}</strong> cuando sea lanzado en julio 2025.</p>
            <div class="success-details">
                <div class="detail">
                    <i class="fas fa-calendar"></i>
                    <span>Lanzamiento: Julio 2025</span>
                </div>
                <div class="detail">
                    <i class="fas fa-envelope"></i>
                    <span>Notificación automática</span>
                </div>
                <div class="detail">
                    <i class="fas fa-gift"></i>
                    <span>Contenido bonus incluido</span>
                </div>
            </div>
            <button class="btn-close-modal">Continuar</button>
        </div>
        <div class="modal-overlay"></div>
    `;
    
    // Agregar estilos del modal
    if (!document.querySelector('#modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .payment-success-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(5px);
            }
            .modal-content {
                position: relative;
                background: white;
                padding: 3rem;
                border-radius: 24px;
                text-align: center;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 25px 50px rgba(0,0,0,0.2);
                animation: modalSlideIn 0.3s ease;
            }
            @keyframes modalSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .success-icon {
                font-size: 4rem;
                color: #27ae60;
                margin-bottom: 1.5rem;
            }
            .modal-content h2 {
                font-size: 2rem;
                color: var(--text-primary);
                margin-bottom: 1rem;
            }
            .modal-content p {
                color: var(--text-secondary);
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            .success-details {
                background: var(--background-alt);
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 2rem;
            }
            .detail {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }
            .detail:last-child {
                margin-bottom: 0;
            }
            .detail i {
                color: var(--primary-color);
            }
            .btn-close-modal {
                background: var(--gradient-primary);
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 50px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .btn-close-modal:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(modal);
    
    // Cerrar modal
    modal.querySelector('.btn-close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Guardar información del pedido
function saveOrderInfo(orderData) {
    try {
        const orders = JSON.parse(localStorage.getItem('skin_care_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('skin_care_orders', JSON.stringify(orders));
        
        // También enviar al backend si está disponible
        sendOrderToBackend(orderData);
    } catch (error) {
        console.error('Error al guardar pedido:', error);
    }
}

// Enviar pedido al backend
async function sendOrderToBackend(orderData) {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error('Error al enviar pedido al servidor');
        }
        
    } catch (error) {
        console.error('Error al enviar al backend:', error);
        // No mostrar error al usuario ya que el pago fue exitoso
    }
}

// Simular suscripción al newsletter
async function simulateNewsletterSubscription(email) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular 90% de éxito
            if (Math.random() > 0.1) {
                resolve({ success: true, email });
            } else {
                reject(new Error('Error de conexión'));
            }
        }, 1500);
    });
}

// ===== ANALYTICS Y TRACKING =====
function trackEvent(eventName, data = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, data);
    }
    
    console.log('Event tracked:', eventName, data);
}

// Tracking de interacciones
document.addEventListener('click', function(e) {
    const target = e.target.closest('a, button');
    if (!target) return;
    
    // Track clicks en CTAs
    if (target.classList.contains('btn-primary')) {
        trackEvent('PreorderButtonClick', {
            button_text: target.textContent.trim(),
            page_location: window.location.href
        });
    }
    
    // Track clicks en enlaces de autores
    if (target.classList.contains('linkedin-link')) {
        trackEvent('AuthorLinkedInClick', {
            author: target.closest('.author-card').querySelector('h3').textContent
        });
    }
    
    // Track newsletter signup
    if (target.classList.contains('btn-newsletter')) {
        trackEvent('NewsletterSignupAttempt');
    }
});

// ===== LAZY LOADING DE IMÁGENES =====
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ===== OPTIMIZACIONES DE PERFORMANCE =====
// Debounce function
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== INICIALIZACIÓN FINAL =====
// Cargar funcionalidades adicionales cuando sea necesario
window.addEventListener('load', function() {
    initializeLazyLoading();
    
    // Track page load
    trackEvent('PageLoad', {
        page_title: document.title,
        page_location: window.location.href
    });
});

// Manejar errores globales
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    
    // No mostrar errores técnicos al usuario en producción
    if (window.location.hostname === 'localhost') {
        showNotification('Error técnico detectado. Ver consola.', 'error');
    }
});

// Service Worker para cache (opcional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}

console.log('🎉 Skin Care Esencial - Sistema cargado correctamente');
