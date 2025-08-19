const LS_KEY = 'paradise_bookings_v1';

const form = document.getElementById('bookingForm');
const statusEl = document.getElementById('formStatus');
const tbody = document.querySelector('#bookingsTable tbody');
const table = document.getElementById('bookingsTable');
const emptyState = document.getElementById('bookingsEmpty');

const $err = (name) => document.querySelector(`.error[data-for="${name}"]`);
const todayISO = () => new Date().toISOString().split('T')[0];
const parseDate = (str) => new Date(str+'T00:00:00');
const nightsBetween = (a,b) => Math.round((parseDate(b)-parseDate(a))/(1000*60*60*24));
const uid = () => Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();

const checkin = document.getElementById('checkin');
const checkout = document.getElementById('checkout');
checkin.min = todayISO();
checkout.min = todayISO();

checkin.addEventListener('change', () => {
  checkout.min = checkin.value || todayISO();
  if (checkout.value && checkout.value <= checkin.value) checkout.value = '';
});

document.addEventListener('DOMContentLoaded', () => {
  renderBookings();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const data = Object.fromEntries(new FormData(form).entries());

  let ok = true;
  if (!data.name?.trim()) { showError('name','Please enter your full name.'); ok=false; }
  if (!validateEmail(data.email)) { showError('email','Enter a valid email.'); ok=false; }
  if (!data.room) { showError('room','Please select a room type.'); ok=false; }
  const g = Number(data.guests);
  if (!(g>=1 && g<=8)) { showError('guests','Guests must be between 1 and 8.'); ok=false; }
  if (!data.checkin) { showError('checkin','Choose a check‑in date.'); ok=false; }
  if (!data.checkout) { showError('checkout','Choose a check‑out date.'); ok=false; }
  if (data.checkin && data.checkout && data.checkout <= data.checkin) {
    showError('checkout','Check‑out must be after check‑in.'); ok=false;
  }
  const terms = document.getElementById('terms');
  if (!terms.checked) { showError('terms','You must accept the terms.'); ok=false; }

  if (!ok) { statusEl.textContent = 'Please fix the highlighted fields.'; return; }

  const ref = uid();
  const booking = { ref, ...data, guests:g, createdAt:new Date().toISOString() };
  saveBooking(booking);
  form.reset();
  checkin.min = todayISO();
  checkout.min = todayISO();
  statusEl.textContent = `✅ Booking confirmed! Reference: ${ref}`;
  renderBookings();
});

function showError(name,msg){ const el=$err(name); if(el){ el.textContent=msg; } }
function clearErrors(){ document.querySelectorAll('.error').forEach(e=>e.textContent=''); statusEl.textContent=''; }
function validateEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function loadBookings(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)) || []; }catch{ return []; }
}
function saveBooking(b){
  const bookings = loadBookings();
  bookings.push(b);
  localStorage.setItem(LS_KEY, JSON.stringify(bookings));
}
function deleteBooking(ref){
  const bookings = loadBookings().filter(b => b.ref !== ref);
  localStorage.setItem(LS_KEY, JSON.stringify(bookings));
  renderBookings();
}

function renderBookings(){
  const bookings = loadBookings();
  if (!bookings.length){
    table.hidden = true;
    emptyState.style.display = 'block';
    tbody.innerHTML='';
    return;
  }
  emptyState.style.display = 'none';
  table.hidden = false;
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><code>${b.ref}</code></td>
      <td>${escapeHtml(b.name)}</td>
      <td>${escapeHtml(b.room)}</td>
      <td>${b.guests}</td>
      <td>${b.checkin}</td>
      <td>${b.checkout}</td>
      <td><button class="btn" data-delete="${b.ref}">Delete</button></td>
    </tr>
  `).join('');
}

tbody.addEventListener('click', (e) => {
  if (e.target.matches('button[data-delete]')){
    const ref = e.target.getAttribute('data-delete');
    if (confirm('Delete booking '+ref+'?')) deleteBooking(ref);
  }
});

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
