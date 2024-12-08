document.addEventListener('DOMContentLoaded', () => {
    const BOOK_URL = "http://localhost:3000/book";
    const SLOTS_URL = "http://localhost:3000/slots";

    // Check if the user is logged in by verifying the token
    const authToken = localStorage.getItem("authToken");
    const ticketsContent = document.getElementById('ticketsContent');
    const loginMessage = document.getElementById('loginMessage');

    if (!authToken) {
        ticketsContent.style.display = 'none';
        return; // Stop executing the rest of the code if not logged in
    }

    ticketsContent.style.display = 'block';

    // Ticket booking functionality
    const ticketForm = document.getElementById('ticketForm');
    const confirmBtn = document.getElementById('confirmBooking');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('visitDate').min = today;

    // Ticket prices
    const PRICES = {
        adult: 50,
        child: 20,
        senior: 0
    };
    const PROCESSING_FEE_PERCENT = 2;

    ticketForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateSummary();
    });

    function updateSummary() {
        const visitDate = document.getElementById('visitDate').value;
        const timeSlot = document.getElementById('timeSlot').value;
        const adultTickets = parseInt(document.getElementById('adultTickets').value) || 0;
        const childTickets = parseInt(document.getElementById('childTickets').value) || 0;
        const seniorTickets = parseInt(document.getElementById('seniorTickets').value) || 0;


        // Update summary date and time
        document.getElementById('summaryDate').textContent = formatDate(visitDate);
        document.getElementById('summaryTime').textContent = timeSlot;

        // Update ticket counts
        document.getElementById('summaryAdult').textContent = adultTickets;
        document.getElementById('summaryChild').textContent = childTickets;
        document.getElementById('summarySenior').textContent = seniorTickets;

    // Calculate totals
        const subtotal = (adultTickets * PRICES.adult) +
                        (childTickets * PRICES.child) +
                        (seniorTickets * PRICES.senior);
        const processingFee = Math.round(subtotal * (PROCESSING_FEE_PERCENT / 100));
        const total = subtotal + processingFee;

        // Update summary amounts
        
        document.getElementById('summarySubtotal').textContent = subtotal;
        document.getElementById('summaryFee').textContent = processingFee;
        document.getElementById('summaryTotal').textContent = total;

        // Enable/disable confirm button
        confirmBtn.disabled = total === 0;
    }

    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Handle booking confirmation
    confirmBtn.addEventListener('click', async () => {
        const totalAmount = parseInt(document.getElementById('summaryTotal').textContent);
        
        if (!totalAmount || totalAmount <= 0) {
            alert('Please select at least one ticket');
            return;
        }

        try {
            console.log('Sending amount:', totalAmount);
            const bookingResponse = await fetch('http://localhost:3000/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    visitDate: document.getElementById('visitDate').value,
                    timeSlot: document.getElementById('timeSlot').value,
                    numTickets: parseInt(document.getElementById('adultTickets').value) + parseInt(document.getElementById('childTickets').value) + parseInt(document.getElementById('seniorTickets').value),
                    adultTickets: parseInt(document.getElementById('adultTickets').value),
                    childTickets: parseInt(document.getElementById('childTickets').value),
                    seniorTickets: parseInt(document.getElementById('seniorTickets').value)
                })
            });
            
            const bookingData = await bookingResponse.json();
            
            if (bookingData.skipPayment) {
                // Store booking details and redirect to success page
                localStorage.setItem('bookingDetails', JSON.stringify({
                    bookingId: bookingData.id,
                    visitDate: document.getElementById('visitDate').value,
                    timeSlot: document.getElementById('timeSlot').value,
                    adultTickets: document.getElementById('adultTickets').value,
                    childTickets: document.getElementById('childTickets').value,
                    seniorTickets: document.getElementById('seniorTickets').value,
                    totalAmount: document.getElementById('summaryTotal').textContent
                }));
                window.location.href = '/booking-success';
            } else {
                // Proceed with Razorpay payment flow
                const booking_id = bookingData.id;

                const response = await fetch('http://localhost:3000/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        amount: totalAmount,
                        booking_id: booking_id 
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create order');
                }
                
                const order = await response.json();
                console.log('Order created:', order);
                
                // Initialize Razorpay payment
                const options = {
                    key: 'rzp_test_By6MGs32I1BlAz',
                    amount: order.amount,
                    currency: "INR",
                    name: "SRMIST Museum",
                    description: "Museum Ticket Booking",
                    order_id: order.id,
                    handler: async function (response) {
                        try {
                            const verifyResponse = await fetch('http://localhost:3000/verify-payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    booking_id: booking_id
                                })
                            });
                            
                            if (verifyResponse.ok) {
                                // Store booking details with booking_id instead of payment_id
                                const bookingDetails = {
                                    bookingId: booking_id,
                                    visitDate: document.getElementById('visitDate').value,
                                    timeSlot: document.getElementById('timeSlot').value,
                                    adultTickets: document.getElementById('adultTickets').value,
                                    childTickets: document.getElementById('childTickets').value,
                                    seniorTickets: document.getElementById('seniorTickets').value,
                                    totalAmount: document.getElementById('summaryTotal').textContent
                                };
                                localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
                                
                                window.location.href = '/booking-success';
                            } else {
                                alert('Payment verification failed');
                            }
                        } catch (error) {
                            console.error('Verification Error:', error);
                            alert('Payment verification failed');
                        }
                    },
                    modal: {
                        ondismiss: async function() {
                            // Handle payment cancellation
                            try {
                                await fetch('http://localhost:3000/cancel-booking', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ booking_id: booking_id })
                                });
                                alert('Booking cancelled');
                            } catch (error) {
                                console.error('Error cancelling booking:', error);
                            }
                        }
                    },
                    prefill: {
                        name: "",
                        email: "",
                        contact: ""
                    },
                    theme: {
                        color: "#3399cc"
                    }
                };
                
                const rzp1 = new Razorpay(options);
                rzp1.open();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Booking failed: ' + error.message);
        }
    });

    // Update summary when any input changes
    ticketForm.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', () => {
            if (ticketForm.checkValidity()) {
                updateSummary();
            }
        });
    });

    // Add after setting minimum date
    const visitDateInput = document.getElementById('visitDate');
    visitDateInput.addEventListener('change', async () => {
        const selectedDate = visitDateInput.value;
        const timeSlotDropdown = document.getElementById('timeSlot');

        // Clear previous time slot options
        timeSlotDropdown.innerHTML = '<option value="">Choose a time slot</option>';

        if (selectedDate) {
            try {
                const response = await fetch(`${SLOTS_URL}?date=${selectedDate}`);
                if (response.ok) {
                    const data = await response.json();
                    Object.entries(data.slots).forEach(([time, ticketsLeft]) => {
                        const option = document.createElement('option');
                        option.value = time;
                        option.textContent = `${time} (${ticketsLeft} tickets left)`;
                        option.disabled = ticketsLeft === 0;
                        timeSlotDropdown.appendChild(option);
                    });
                } else {
                    console.error("Failed to fetch slots:", response.statusText);
                    alert("Unable to fetch available slots. Please try again later.");
                }
            } catch (error) {
                console.error("Error fetching slots:", error);
                alert("An error occurred while fetching available slots.");
            }
        }
    });

    // Add this function to update summary with translations
    async function updateSummaryWithTranslations() {
        const elements = document.querySelectorAll('[data-translate]');
        for (const element of elements) {
            if (element.parentElement.id.startsWith('summary')) {
                const originalText = element.getAttribute('data-translate');
                const translatedText = await window.translator.translateText(originalText);
                element.textContent = translatedText;
            }
        }
    }

    // Call this after updating the summary
    updateSummary().then(() => {
        if (window.translator) {
            updateSummaryWithTranslations();
        }
    });
});
