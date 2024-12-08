// Function to handle booking clicks
async function initializeBookingSystem() {
    console.log('Initializing booking system...');
    
    // Get all booking-related buttons/links
    const bookingElements = document.querySelectorAll('a[href="/admin/login"], .fancy[href="/admin/login"]');
    console.log('Found booking elements:', bookingElements.length);
    
    bookingElements.forEach(element => {
        element.addEventListener('click', async (e) => {
            console.log('Booking link clicked');
            e.preventDefault();
            
            try {
                console.log('Fetching booking status...');
                const response = await fetch('http://localhost:3000/booking-status');
                const data = await response.json();
                console.log('Booking status response:', data);
                
                // Redirect based on system status
                const redirectUrl = data.enabled ? '/admin/login' : '/admin/bookings-closed';
                console.log('Redirecting to:', redirectUrl);
                window.location.href = redirectUrl;
            } catch (error) {
                console.error('Error checking booking status:', error);
                // On error, show booking closed
                window.location.href = '/admin/bookings-closed';
            }
        });
    });
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing booking system...');
    initializeBookingSystem();
}); 