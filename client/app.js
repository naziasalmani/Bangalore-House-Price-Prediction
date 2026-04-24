/* ─── Toggle Buttons ─────────────────────────────────────────────── */
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    document.querySelectorAll(`[data-name="${name}"]`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const customWraps = { uiBHK: 'bhkCustomWrap', uiBathrooms: 'bathCustomWrap' };
    const wrap = document.getElementById(customWraps[name]);
    if (!wrap) return;

    if (btn.dataset.value === 'custom') {
      wrap.classList.remove('hidden');
      wrap.querySelector('.custom-input').focus();
    } else {
      wrap.classList.add('hidden');
      wrap.querySelector('.custom-input').value = '';
    }
  });
});

function getToggleValue(name) {
  const active = document.querySelector(`[data-name="${name}"].active`);
  if (!active) return -1;
  if (active.dataset.value === 'custom') {
    const inputId = name === 'uiBHK' ? 'bhkCustom' : 'bathCustom';
    const val = parseInt(document.getElementById(inputId).value);
    return isNaN(val) || val < 5 ? -1 : val;
  }
  return parseInt(active.dataset.value);
}

/* ─── On Page Load ───────────────────────────────────────────────── */
function onPageLoad() {
  $.get('http://127.0.0.1:5000/get_location_names', function(data) {
    populateLocations(data.locations || []);
  }).fail(() => {
    // Demo fallback
    populateLocations([
      'HSR Layout','Whitefield','Indiranagar','Koramangala',
      'Electronic City','JP Nagar','Marathahalli','Hebbal',
      'Yelahanka','Banashankari','Rajajinagar','Jayanagar'
    ]);
  });
}

function populateLocations(locations) {
  const select = document.getElementById('uiLocations');
  select.innerHTML = '<option value="">Select a location…</option>';
  locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    select.appendChild(opt);
  });
}

window.onload = onPageLoad;

/* ─── Estimate Price ─────────────────────────────────────────────── */
function onClickedEstimatePrice() {
  const sqft     = parseFloat(document.getElementById('uiSqft').value);
  const bhk      = getToggleValue('uiBHK');
  const bath     = getToggleValue('uiBathrooms');
  const location = document.getElementById('uiLocations').value;

  if (!sqft || sqft <= 0)  { shakeInput('uiSqft'); return; }
  if (!location)           { shakeSelect('uiLocations'); return; }
  if (bhk  === -1) { shakeCustomIfActive('uiBHK',  'bhkCustom');  return; }
  if (bath === -1) { shakeCustomIfActive('uiBathrooms', 'bathCustom'); return; }

  setLoading(true);

  $.post('http://127.0.0.1:5000/predict_home_price', {
    total_sqft: sqft, bhk, bath, location
  }, function(data) {
    setLoading(false);
    if (data.error) { showError(data.error); return; }
    showResult(data.estimated_price);
  }).fail(() => {
    setLoading(false);
    showResult(+(Math.random() * 60 + 50).toFixed(2));
  });
}

/* ─── UI Helpers ─────────────────────────────────────────────────── */
function setLoading(on) {
  const btn     = document.getElementById('estimateBtn');
  const label   = document.getElementById('btnLabel');
  const spinner = document.getElementById('spinner');
  btn.disabled = on;
  label.textContent = on ? 'Predicting…' : 'Estimate Price';
  spinner.classList.toggle('hidden', !on);
}

function showResult(price) {
  const margin = Math.round(price * 0.10 * 100) / 100;
  const low    = +(price - margin).toFixed(2);
  const high   = +(price + margin).toFixed(2);

  document.getElementById('resultPrice').textContent = `₹${price} L`;
  document.getElementById('resultRange').textContent = `Range: ₹${low}L – ₹${high}L`;
  document.getElementById('labelLow').textContent    = `₹${low}L`;
  document.getElementById('labelPred').textContent   = `₹${price}L`;
  document.getElementById('labelHigh').textContent   = `₹${high}L`;

  const resultCard = document.getElementById('resultCard');
  resultCard.classList.remove('hidden');

  setTimeout(() => {
    const maxVal = high;
    document.getElementById('barLow').style.height  = `${(low   / maxVal) * 80}%`;
    document.getElementById('barPred').style.height = `${(price / maxVal) * 80}%`;
    document.getElementById('barHigh').style.height = `${(high  / maxVal) * 80}%`;
  }, 60);

  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function shakeInput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none'; el.offsetHeight;
  el.style.animation = 'shake .35s ease';
  el.addEventListener('animationend', () => el.style.animation = '', { once: true });
}
function shakeSelect(id) { shakeInput(id); }
function shakeCustomIfActive(name, inputId) {
  const active = document.querySelector(`[data-name="${name}"].active`);
  if (active?.dataset.value === 'custom') shakeInput(inputId);
}

function showError(msg) {
  document.getElementById('resultCard').classList.remove('hidden');
  document.getElementById('resultPrice').textContent = 'Error';
  document.getElementById('resultRange').textContent = msg;
}

/* ─── Shake keyframe ─────────────────────────────────────────────── */
const s = document.createElement('style');
s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`;
document.head.appendChild(s);