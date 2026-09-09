// Supabase Config
const SUPABASE_URL = 'https://gorkaakxltbrknsyiqld.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dNJPTU_RL3pu0Qu2WBEp1Q_olpcRK9v';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const quantitySelect = document.getElementById('quantity');
const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
const grandTotalEl = document.getElementById('grandTotal');
const orderForm = document.getElementById('customerOrderForm');
const orderBtn = document.querySelector('.btn-order');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModalBtn');

let isSubmitting = false;

function updateSummary() {
    let productPrice = 990;
    const qty = parseInt(quantitySelect.value);
    if (qty === 2) productPrice = 1900;

    let delivery = 60;
    deliveryRadios.forEach(radio => {
        if (radio.checked) delivery = parseInt(radio.value);
    });

    const grandTotal = productPrice + delivery;
    if (grandTotalEl) grandTotalEl.innerText = `৳ ${grandTotal.toLocaleString('bn-BD')}`;
    return { productPrice, delivery, grandTotal, qty };
}

quantitySelect.addEventListener('change', updateSummary);
deliveryRadios.forEach(radio => radio.addEventListener('change', updateSummary));
updateSummary(); // পেজ লোডে একবার কল

document.getElementById('heroOrderBtn')?.addEventListener('click', function() {
    if (typeof fbq!== 'undefined') {
        fbq('track', 'InitiateCheckout', {content_name: 'Vintage Edison Lamp', value: 990, currency: 'BDT'});
    }
});

orderForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();

    // বাংলাদেশি নাম্বার ভ্যালিডেশন
    if (!/^01[3-9]\d{8}$/.test(phone)) {
        alert('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
        return;
    }
    if(name.length < 3 || address.length < 10){
        alert('নাম এবং সম্পূর্ণ ঠিকানা সঠিকভাবে দিন');
        return;
    }

    isSubmitting = true;
    const originalText = orderBtn.innerText;
    orderBtn.disabled = true;
    orderBtn.innerText = 'অর্ডার প্রসেস হচ্ছে...';

    const { productPrice, delivery, grandTotal, qty } = updateSummary();
    const uniqueOrderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const orderData = {
        order_id: uniqueOrderId,
        product_name: "Vintage Edison Lamp",
        quantity: qty,
        product_price: productPrice,
        delivery_charge: delivery,
        total_amount: grandTotal,
        customer_name: name,
        phone: phone,
        address: address
    };

    try {
        const { error } = await supabaseClient.from('orders').insert([orderData]);
        if (error) throw error;

        // Pixel - এখন ১০০% Clean
        if (typeof fbq!== 'undefined') {
            fbq('track', 'Purchase',
                {value: grandTotal, currency: 'BDT', content_name: 'Vintage Edison Lamp', content_type: 'product', num_items: qty},
                {eventID: uniqueOrderId}
            );
        }

        successModal.classList.remove('hidden');
        orderForm.reset();
        updateSummary();

    } catch (error) {
        console.error('Error:', error.message);
        alert('দুঃখিত, অর্ডারটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
        isSubmitting = false;
        orderBtn.disabled = false;
        orderBtn.innerText = originalText;
    }
});

closeModalBtn.addEventListener('click', () => successModal.classList.add('hidden'));
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) successModal.classList.add('hidden');
});