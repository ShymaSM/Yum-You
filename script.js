/* ================= SCRIPT.JS ================= */

let cart = [];

// Format currency
const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

/* ADD ITEM TO CART */
function addItem(name, price) {
    let existing = cart.find(item => item.name === name);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    updateCartUI();
    
    // Provide a subtle feedback instead of opening the cart every time
    const floatingBtn = document.querySelector('.cart-btn');
    if (floatingBtn) {
        floatingBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            floatingBtn.style.transform = '';
        }, 200);
    }
}

/* ADD VARIANT ITEM (Like Pasta) */
function addVariantItem(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const value = select.value;
    const [name, priceStr] = value.split('|');
    const price = parseFloat(priceStr);
    
    if (name && !isNaN(price)) {
        addItem(name, price);
    }
}

/* UPDATE CART UI */
function updateCartUI() {
    const cartItems = document.getElementById("cartItems");
    const cartCountBadge = document.getElementById("cartCount");
    const totalElement = document.getElementById("total");
    const orderBtn = document.getElementById("orderBtn");

    // Update floating badge count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountBadge) cartCountBadge.innerText = totalItems;
    
    // If empty
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty">
                Your cart is empty 🍴 <br>
                <small>Add some delicious items from the menu!</small>
            </div>
        `;
        totalElement.innerText = "0";
        if (orderBtn) orderBtn.disabled = true;
        return;
    }

    // Enable order button if items exist
    if (orderBtn) orderBtn.disabled = false;
    let total = 0;
    cartItems.innerHTML = "";

    // Render items
    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;

        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <strong>${item.name}</strong>
                    <small>${formatCurrency(item.price)} × ${item.quantity} = <span>${formatCurrency(itemTotal)}</span></small>
                </div>
                <div class="quantity">
                    <button onclick="changeQuantity(${index}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)">+</button>
                </div>
            </div>
        `;
    });

    totalElement.innerText = total.toFixed(2);
}

/* CHANGE QUANTITY */
function changeQuantity(index, amount) {
    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartUI();
}

/* OPEN & CLOSE CART MODAL */
function openCart() {
    const modal = document.getElementById("cartModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
    updateOrderTime();
}

function closeCart() {
    const modal = document.getElementById("cartModal");
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
}

// Close cart when clicking outside modal content
window.onclick = function(event) {
    const modal = document.getElementById("cartModal");
    if (event.target === modal) {
        closeCart();
    }
}

/* UPDATE ORDER TIME (Readonly field) */
function updateOrderTime() {
    const now = new Date();
    const orderTimeEl = document.getElementById("orderTime");
    if(orderTimeEl) {
        orderTimeEl.value = now.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }
}

/* HANDLE FORM SUBMISSION (AJAX) */
const orderForm = document.getElementById("orderForm");
if (orderForm) {
    orderForm.addEventListener("submit", function(e) {
        e.preventDefault(); // Prevent default page reload
        
        if (cart.length === 0) {
            alert("Please add at least one item to your order.");
            return;
        }

        const submitBtn = document.getElementById("orderBtn");
        
        // Prepare order details string for the email
        let orderText = "";
        let total = 0;

        cart.forEach(item => {
            let itemTotal = item.price * item.quantity;
            total += itemTotal;
            orderText += `${item.name} | Qty: ${item.quantity} | ${formatCurrency(itemTotal)}\n`;
        });
        orderText += `\nTOTAL AMOUNT: ${formatCurrency(total)}`;
        
        // Set hidden field value
        document.getElementById("orderDetails").value = orderText;
        
        const accessKey = document.getElementById("web3forms_key").value;
        if (!accessKey) {
            alert("Error: Web3Forms Access Key is missing. Please add it to the code to receive emails.");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            return;
        }
        
        // Collect form data
        const formData = new FormData(this);
        
        // Use Web3Forms API for reliable delivery
        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        })
        .then(async (response) => {
            let json = await response.json();
            if (response.status == 200) {
                showSuccessMessage(orderText, total);
            } else {
                console.log(response);
                alert("Oops! Something went wrong: " + json.message);
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error connecting to email server. Please check your internet connection.");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        });
    });
}

/* SHOW SUCCESS MESSAGE */
function showSuccessMessage(orderText, totalAmount) {
    // Hide form and cart items
    document.getElementById("orderForm").style.display = "none";
    document.getElementById("cartItems").style.display = "none";
    document.querySelector(".total").style.display = "none";
    document.querySelector("#cartModal h2").style.display = "none";
    
    // Show success message container
    const successDiv = document.getElementById("successMessage");
    successDiv.style.display = "block";
    
    // Format order summary for display
    const summaryHtml = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span>${item.quantity}x ${item.name}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    document.getElementById("successSummaryDetails").innerHTML = `
        ${summaryHtml}
        <hr style="border-color: var(--border-color); margin: 10px 0;">
        <div style="display:flex; justify-content:space-between; font-weight:bold; color:var(--text-dark);">
            <span>TOTAL</span>
            <span>${formatCurrency(totalAmount)}</span>
        </div>
    `;

    // Clear cart
    cart = [];
    updateCartUI();
}

/* RESET MODAL WHEN CLOSED (If successful, next time they open it should be a fresh cart) */
function resetCartModal() {
    document.getElementById("orderForm").style.display = "block";
    document.getElementById("cartItems").style.display = "block";
    document.querySelector(".total").style.display = "flex";
    document.querySelector("#cartModal h2").style.display = "block";
    document.getElementById("successMessage").style.display = "none";
    
    const submitBtn = document.getElementById("orderBtn");
    submitBtn.innerHTML = "Place Order";
    submitBtn.disabled = false;
    
    // Reset form fields
    document.getElementById("orderForm").reset();
}

// Attach reset to close button
const closeBtn = document.querySelector(".close");
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        const successMsg = document.getElementById("successMessage");
        if(cart.length === 0 && successMsg && successMsg.style.display === "block") {
            resetCartModal();
        }
    });
}

// Initialize empty cart UI on load
document.addEventListener("DOMContentLoaded", () => {
    updateCartUI();
});
