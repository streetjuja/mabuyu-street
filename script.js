// ===== CART =====
let cart = {};

function changeQty(name, price, delta) {
  const safeId = 'qty-' + name.replace(/\s+/g, '-');
  const el = document.getElementById(safeId);
  if (!el) return;
  let current = parseInt(el.textContent) || 0;
  current = Math.max(0, current + delta);
  el.textContent = current;
}

function addToCart(name, price) {
  const safeId = 'qty-' + name.replace(/\s+/g, '-');
  const el = document.getElementById(safeId);
  const qty = el ? parseInt(el.textContent) || 0 : 0;

  if (qty === 0) {
    alert('Please select a quantity first using the + button');
    return;
  }

  if (cart[name]) {
    cart[name].qty += qty;
  } else {
    cart[name] = { price, qty };
  }

  if (el) el.textContent = '0';
  updateCartUI();

  const btn = event.target;
  btn.textContent = '✓ Added!';
  setTimeout(() => btn.textContent = 'Add to Cart', 1000);
}

function updateCartUI() {
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cartTotal');

  const keys = Object.keys(cart);
  let total = 0;
  let count = 0;

  if (keys.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    cartFooter.style.display = 'none';
    cartCount.textContent = '0';
    return;
  }

  cartItems.innerHTML = '';

  keys.forEach(name => {
    const item = cart[name];
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    count += item.qty;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML =
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + name + '</div>' +
        '<div class="cart-item-meta">' +
          '<span class="meta-badge">Ksh ' + item.price + ' each</span>' +
          '<span class="meta-badge qty-badge">x' + item.qty + '</span>' +
          '<span class="meta-badge total-badge">= Ksh ' + itemTotal + '</span>' +
        '</div>' +
      '</div>' +
'<div class="cart-item-qty">' +
        '<button onclick="updateCartItem(\'' + name + '\', -1)">−</button>' +
        '<span>' + item.qty + '</span>' +
        '<button onclick="updateCartItem(\'' + name + '\', 1)">+</button>' +
        '<button class="remove-btn" onclick="removeFromCart(\'' + name + '\')" title="Remove">🗑️</button>' +
      '</div>';
    cartItems.appendChild(div);
  });

  const totalRow = document.createElement('div');
  totalRow.className = 'cart-total-row';
  totalRow.innerHTML =
    '<span>' + count + ' item' + (count !== 1 ? 's' : '') + '</span>' +
    '<span class="grand-total">Grand Total: Ksh ' + total + '</span>';
  cartItems.appendChild(totalRow);

  cartTotal.textContent = 'Ksh ' + total;
  cartCount.textContent = count;
  cartFooter.style.display = 'flex';
}

function removeFromCart(name) {
  if (confirm('Remove ' + name + ' from cart?')) {
    delete cart[name];
    updateCartUI();
  }
}

function clearCart() {
  if (confirm('Cancel entire order and clear cart?')) {
    cart = {};
    updateCartUI();
    toggleCart();
  }
}
function updateCartItem(name, delta) {
  if (!cart[name]) return;
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];
  updateCartUI();
}

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
  const dtEl = document.getElementById('datetimeDisplay');
  if (dtEl) dtEl.textContent = 'Order time: ' + getDateTime();
}

function getDateTime() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  let hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return day + ', ' + date + ' ' + month + ' ' + year + ' at ' + hours + ':' + mins + ' ' + ampm;
}

async function sendOrder() {
  const keys = Object.keys(cart);
  if (keys.length === 0) { alert('Your cart is empty!'); return; }

  const name = document.getElementById('customerName').value.trim() || 'Customer';
  const phone = document.getElementById('customerPhone').value.trim();
  const location = document.getElementById('customerLocation').value.trim();
  const datetime = getDateTime();

  if (!phone) { alert('Please enter your phone number!'); return; }

  let orderLines = '';
  let total = 0;
  let itemsArray = [];

  Object.keys(cart).forEach(function(item) {
    const price = cart[item].price;
    const qty = cart[item].qty;
    const itemTotal = price * qty;
    orderLines += '• ' + item + '\n  Qty: ' + qty + '  |  Ksh ' + price + ' each  |  Total: Ksh ' + itemTotal + '\n';
    total += itemTotal;
    itemsArray.push({ name: item, price: price, qty: qty, itemTotal: itemTotal });
  });

  const orderText = 'NEW ORDER — MABUYU STREET\n\nDate: ' + datetime + '\nName: ' + name + '\nPhone: ' + phone + '\nLocation: ' + (location || 'Not provided') + '\n\nORDER:\n' + orderLines + '\nTOTAL: Ksh ' + total;

  // Save to database
  try {
    await fetch('https://mabuyu-street-production.up.railway.app/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, location: location, items: itemsArray, total: total, datetime: datetime })
    });
  } catch(e) {
    console.log('DB error:', e);
  }

  // Send to WhatsApp
  window.open('https://wa.me/254793400696?text=' + encodeURIComponent(orderText), '_blank');

  // Send to Email
  try {
    await fetch('https://formspree.io/f/maqvdekq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, location: location, datetime: datetime, order: orderLines, grand_total: 'Ksh ' + total })
    });
  } catch(e) {
    console.log('Email error:', e);
  }

  cart = {};
  updateCartUI();
  document.getElementById('customerName').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerLocation').value = '';
  document.getElementById('orderSuccess').style.display = 'block';
  setTimeout(function() {
    document.getElementById('orderSuccess').style.display = 'none';
  }, 5000);
}

// ===== STAR RATING =====
var selectedRating = 0;

document.addEventListener('DOMContentLoaded', function() {
  const stars = document.querySelectorAll('.star');
  stars.forEach(function(star) {
    star.addEventListener('click', function() {
      selectedRating = parseInt(star.getAttribute('data-val'));
      stars.forEach(function(s) {
        if (parseInt(s.getAttribute('data-val')) <= selectedRating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });
});

async function submitForm() {
  const nameEl = document.getElementById('name');
  const messageEl = document.getElementById('message');
  const typeEl = document.getElementById('type');

  if (!nameEl || !messageEl || !typeEl) return;

  const name = nameEl.value.trim() || 'Anonymous';
  const message = messageEl.value.trim();
  const type = typeEl.value;

  if (!message || !type) {
    alert('Please fill in the type and your message before submitting.');
    return;
  }

  try {
    await fetch('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, type: type, rating: selectedRating, message: message })
    });
  } catch(e) {
    console.log('DB error:', e);
  }

  const waText = 'New ' + type + ' from Mabuyu Street\n\nName: ' + name + '\nRating: ' + selectedRating + ' stars\n\nMessage:\n' + message;
  window.open('https://wa.me/254793400696?text=' + encodeURIComponent(waText), '_blank');

  try {
    await fetch('https://formspree.io/f/maqvdekq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, type: type, rating: selectedRating + ' stars', message: message })
    });
  } catch(e) {
    console.log('Email error:', e);
  }

  document.getElementById('success').style.display = 'block';
  messageEl.value = '';
  nameEl.value = '';
  typeEl.value = '';
  selectedRating = 0;
  document.querySelectorAll('.star').forEach(function(s) {
    s.classList.remove('active');
  });
}
