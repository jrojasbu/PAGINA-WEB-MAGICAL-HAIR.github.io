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

    // ==================== MOBILE MENU ====================
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            body.classList.toggle('menu-open');

            // Toggle icon
            const icon = menuToggle.querySelector('ion-icon');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.setAttribute('name', 'close-outline');
                } else {
                    icon.setAttribute('name', 'menu-outline');
                }
            }
        });

        // Close menu when clicking a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                body.classList.remove('menu-open');

                // Reset icon
                const icon = menuToggle.querySelector('ion-icon');
                if (icon) {
                    icon.setAttribute('name', 'menu-outline');
                }
            });
        });
    }

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

            // Get form values
            const clientName = document.getElementById('clientName').value.trim().toUpperCase();
            const clientPhone = document.getElementById('clientPhone').value.trim();
            const sede = document.getElementById('sede').value;
            const service = document.getElementById('service').value;
            const appointmentDate = document.getElementById('appointmentDate').value;
            const appointmentTime = document.getElementById('appointmentTime').value;
            const notes = document.getElementById('notes').value.trim().toUpperCase();

            // Validate phone
            if (!validatePhone(clientPhone)) {
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

            // Create appointment object matching Excel format
            const appointment = {
                ID: generateUUID(),
                Sede: sede,
                Fecha: formatDate(appointmentDate),
                Hora: formatTime(appointmentTime),
                Cliente: clientName,
                Telefono: clientPhone,
                Servicio: service,
                Notas: notes || '',
                Estado: 'Pendiente'
            };

            // Get existing appointments
            const appointments = getAppointments();

            // Add new appointment
            appointments.push(appointment);

            // Save to localStorage
            saveAppointments(appointments);

            // Show success message
            showMessage(`¡Cita agendada exitosamente! 
                        
📅 ${appointmentDate} a las ${appointmentTime}
📍 Sede ${sede}
✂️ ${service}

Te contactaremos pronto al ${clientPhone} para confirmar tu cita.`, 'success');

            // Reset form
            bookingForm.reset();

            // Log for admin
            console.log('Nueva cita agendada:', appointment);
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
                apt.Notas,
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
});
