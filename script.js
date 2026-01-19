document.addEventListener('DOMContentLoaded', () => {
    console.log("Magical Hair website loaded!");

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.animate-on-scroll');
    hiddenElements.forEach(el => observer.observe(el));

    // ==================== BOOKING SYSTEM ====================

    const bookingForm = document.getElementById('bookingForm');
    const bookingMessage = document.getElementById('bookingMessage');
    const appointmentDateInput = document.getElementById('appointmentDate');

    // Set minimum date to today
    if (appointmentDateInput) {
        const today = new Date().toISOString().split('T')[0];
        appointmentDateInput.setAttribute('min', today);

        // Set maximum date to 60 days from now
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 60);
        appointmentDateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    }

    // Generate UUID v4 (compatible with your database format)
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Get appointments from localStorage
    function getAppointments() {
        const appointments = localStorage.getItem('magicalHairAppointments');
        return appointments ? JSON.parse(appointments) : [];
    }

    // Save appointments to localStorage
    function saveAppointments(appointments) {
        localStorage.setItem('magicalHairAppointments', JSON.stringify(appointments));
    }

    // Show message to user
    function showMessage(message, type = 'success') {
        bookingMessage.textContent = message;
        bookingMessage.className = `booking-message ${type}`;
        bookingMessage.style.display = 'block';

        // Scroll to message
        bookingMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Hide after 5 seconds
        setTimeout(() => {
            bookingMessage.style.display = 'none';
        }, 5000);
    }

    // Validate phone number (Colombian format)
    function validatePhone(phone) {
        // Remove spaces and special characters
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        // Colombian phone: 10 digits starting with 3
        return /^3\d{9}$/.test(cleanPhone);
    }

    // Format date for display (YYYY-MM-DD format for Excel)
    function formatDate(dateString) {
        return dateString; // Keep ISO format for Excel compatibility
    }

    // Format time (HH:MM format)
    function formatTime(timeString) {
        return timeString; // Keep HH:MM format
    }

    // Handle form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values and sanitize/normalize
            const clientName = document.getElementById('clientName').value.trim().toUpperCase()
                .replace(/[<>]/g, ''); // Basic XSS prevention
            const clientPhone = document.getElementById('clientPhone').value.trim()
                .replace(/[^\d]/g, ''); // Keep only digits
            const sede = document.getElementById('sede').value;
            const service = document.getElementById('service').value;
            const appointmentDate = document.getElementById('appointmentDate').value;
            const appointmentTime = document.getElementById('appointmentTime').value;
            const notes = document.getElementById('notes').value.trim().toUpperCase()
                .replace(/[<>]/g, ''); // Basic XSS prevention

            // Validate phone (Colombian format: 10 digits starting with 3)
            if (!/^3\d{9}$/.test(clientPhone)) {
                showMessage('Por favor ingresa un número de teléfono válido (10 dígitos, comenzando con 3)', 'error');
                return;
            }

            // Validate date is not in the past
            const selectedDate = new Date(appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                showMessage('La fecha no puede ser en el pasado', 'error');
                return;
            }

            // Validate time is within business hours
            const [hours, minutes] = appointmentTime.split(':').map(Number);
            if (hours < 8 || hours >= 20) {
                showMessage('El horario debe estar entre 8:00 AM y 8:00 PM', 'error');
                return;
            }

            // Determine WhatsApp number based on Sede
            let whatsappNumber = '573134310783'; // Default to Bolivia
            if (sede === 'Garces Navas') {
                whatsappNumber = '573134310765';
            }

            // Construct WhatsApp message
            const message = `Hola, quiero agendar una cita en Magical Hair:

📍 Sede: *${sede}*
👤 Nombre: *${clientName}*
📱 Teléfono: *${clientPhone}*
✂️ Servicio: *${service}*
📅 Fecha: *${appointmentDate}*
⏰ Hora: *${appointmentTime}*
📝 Notas: ${notes || 'N/A'}`;

            // Encode message for URL (Using full API URL which is often more reliable on iOS)
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;

            // Show success notification
            showMessage(`Conectando con WhatsApp...`, 'success');

            // Detect mobile device
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // Direct navigation for mobile to trigger app deep link
                // Wrapping in a tiny timeout sometimes helps iOS WebView/Safari process the touch event first
                setTimeout(() => {
                    window.location.href = whatsappUrl;
                }, 50);
            } else {
                // Desktop
                window.open(whatsappUrl, '_blank');
            }

            bookingForm.reset();

            // Optional: Keep local log if you still want it for the user's browser history
            // (omitted to avoid confusion since it won't sync with admin)
        });
    }

    // Export appointments to CSV (Excel compatible)
    window.exportAppointmentsToCSV = function () {
        const appointments = getAppointments();

        if (appointments.length === 0) {
            alert('No hay citas para exportar');
            return;
        }

        // CSV Header matching Excel format exactly
        const headers = ['ID', 'Sede', 'Fecha', 'Hora', 'Cliente', 'Telefono', 'Servicio', 'Notas', 'Estado'];

        // Create CSV content
        let csvContent = headers.join('\t') + '\n';

        appointments.forEach(apt => {
            const row = [
                apt.ID,
                apt.Sede,
                apt.Fecha,
                apt.Hora,
                apt.Cliente,
                apt.Telefono,
                apt.Servicio,
                (apt.Notas || '').replace(/[\t\n\r]/g, ' '), // Clean notes for CSV
                apt.Estado
            ];
            csvContent += row.join('\t') + '\n';
        });

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `citas_magical_hair_${today}.txt`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`${appointments.length} citas exportadas`);
    };

    // Get appointment count
    window.getAppointmentCount = function () {
        return getAppointments().length;
    };

    // Clear all appointments (admin function)
    window.clearAllAppointments = function () {
        if (confirm('¿Estás seguro de que quieres eliminar TODAS las citas?')) {
            localStorage.removeItem('magicalHairAppointments');
            console.log('Todas las citas han sido eliminadas');
            return true;
        }
        return false;
    };

    // Get appointments by date range
    window.getAppointmentsByDateRange = function (startDate, endDate) {
        const appointments = getAppointments();
        return appointments.filter(apt => {
            const aptDate = new Date(apt.Fecha);
            return aptDate >= new Date(startDate) && aptDate <= new Date(endDate);
        });
    };

    // Console helper message
    console.log('%c📅 Sistema de Citas Magical Hair', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    console.log('%cFunciones disponibles:', 'color: #64748b; font-size: 12px');
    console.log('  - exportAppointmentsToCSV() - Exportar citas a archivo de texto');
    console.log('  - getAppointmentCount() - Ver cantidad de citas');
    console.log('  - clearAllAppointments() - Limpiar todas las citas');

    // ==================== SLIDER LOGIC ====================
    // ==================== SLIDER LOGIC ====================
    const servicesGrid = document.querySelector('.services-grid');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (servicesGrid && prevBtn && nextBtn) {
        // Clone elements for infinite loop (double content)
        const cards = Array.from(servicesGrid.children);
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            servicesGrid.appendChild(clone);
        });

        // Auto-play Scroll
        // Auto-play Scroll
        let animationId;
        let scrollAccumulator = 0;
        const scrollSpeed = 0.5; // Ajustar para suavidad (0.5px por frame = ~30px/seg)

        const startAutoPlay = () => {
            cancelAnimationFrame(animationId);

            const animate = () => {
                if (window.innerWidth <= 768) return;

                // Lógica de bucle infinito
                if (servicesGrid.scrollLeft >= (servicesGrid.scrollWidth / 2)) {
                    servicesGrid.scrollLeft = 0;
                }

                // Acumular movimiento
                scrollAccumulator += scrollSpeed;

                // Aplicar movimiento cuando se acumule al menos 1px
                if (scrollAccumulator >= 1) {
                    const pixels = Math.floor(scrollAccumulator);
                    servicesGrid.scrollLeft += pixels;
                    scrollAccumulator -= pixels;
                }

                animationId = requestAnimationFrame(animate);
            };

            animationId = requestAnimationFrame(animate);
        };

        // Navigation Buttons
        prevBtn.addEventListener('click', () => {
            cancelAnimationFrame(animationId);
            servicesGrid.scrollBy({ left: -350, behavior: 'smooth' });
            setTimeout(startAutoPlay, 3000);
        });

        nextBtn.addEventListener('click', () => {
            cancelAnimationFrame(animationId);
            servicesGrid.scrollBy({ left: 350, behavior: 'smooth' });
            setTimeout(startAutoPlay, 3000);
        });

        // Pause on hover
        servicesGrid.addEventListener('mouseenter', () => cancelAnimationFrame(animationId));
        servicesGrid.addEventListener('mouseleave', startAutoPlay);

        // Start initial auto-play
        startAutoPlay();

        // Infinite Loop Reset Check for manual scroll
        servicesGrid.addEventListener('scroll', () => {
            if (servicesGrid.scrollLeft >= (servicesGrid.scrollWidth / 2)) {
                servicesGrid.scrollLeft = servicesGrid.scrollLeft - (servicesGrid.scrollWidth / 2);
            }
        });
    }
});
