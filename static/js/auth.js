/* QuantumCV — Auth JS */

const CSRF = () => document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<div class="toast-icon"></div><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 4000);
}

function setBtn(id, loading) {
  const btn = document.getElementById(id);
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

// ── STEP 1: SEND OTP ──

async function sendOTP() {
  const email = document.getElementById('email-input').value.trim();
  const errEl = document.getElementById('email-error');
  errEl.textContent = '';

  if (!email || !/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(email)) {
    errEl.textContent = 'Please enter a valid email address.';
    document.getElementById('email-input').focus();
    return;
  }

  setBtn('send-otp-btn', true);

  try {
    const res = await fetch('/api/send-otp/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF() },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('email-display').textContent = email;
      document.getElementById('step-email').classList.remove('active');
      document.getElementById('step-otp').classList.add('active');
      setTimeout(() => document.querySelector('.otp-digit').focus(), 100);
      startResendTimer();
      showToast('Verification code sent!', 'success');
    } else {
      errEl.textContent = data.message;
      showToast(data.message, 'error');
    }
  } catch {
    errEl.textContent = 'Network error. Please try again.';
  } finally {
    setBtn('send-otp-btn', false);
  }
}

// ── OTP INPUT HANDLING ──

document.addEventListener('DOMContentLoaded', () => {
  const digits = document.querySelectorAll('.otp-digit');

  digits.forEach((inp, i) => {
    inp.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(-1);
      e.target.classList.toggle('filled', !!e.target.value);

      if (val && i < digits.length - 1) digits[i + 1].focus();

      // Auto-verify when all filled
      if (Array.from(digits).every(d => d.value)) {
        setTimeout(verifyOTP, 300);
      }
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        digits[i - 1].value = '';
        digits[i - 1].classList.remove('filled');
        digits[i - 1].focus();
      }
      if (e.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
      if (e.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
    });

    inp.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      pasted.split('').forEach((ch, j) => {
        if (digits[j]) {
          digits[j].value = ch;
          digits[j].classList.add('filled');
        }
      });
      if (pasted.length === 6) setTimeout(verifyOTP, 300);
    });
  });

  // Enter key on email input
  document.getElementById('email-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendOTP();
  });
});

// ── STEP 2: VERIFY OTP ──

async function verifyOTP() {
  const digits = document.querySelectorAll('.otp-digit');
  const otp = Array.from(digits).map(d => d.value).join('');
  const errEl = document.getElementById('otp-error');
  errEl.textContent = '';

  if (otp.length !== 6) {
    errEl.textContent = 'Please enter all 6 digits.';
    return;
  }

  setBtn('verify-btn', true);

  try {
    const res = await fetch('/api/verify-otp/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF() },
      body: JSON.stringify({
        otp,
        full_name: document.getElementById('name-input')?.value?.trim() || ''
      })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Verified! Redirecting...', 'success');
      setTimeout(() => window.location.href = data.redirect, 600);
    } else {
      errEl.textContent = data.message;
      digits.forEach(d => d.classList.add('error'));
      setTimeout(() => digits.forEach(d => d.classList.remove('error')), 500);
      digits[0].focus();
      // Clear digits on wrong OTP
      digits.forEach(d => { d.value = ''; d.classList.remove('filled'); });
    }
  } catch {
    errEl.textContent = 'Network error. Please try again.';
  } finally {
    setBtn('verify-btn', false);
  }
}

// ── RESEND TIMER ──

let resendInterval = null;

function startResendTimer() {
  const btn = document.getElementById('resend-btn');
  const timer = document.getElementById('resend-timer');
  btn.disabled = true;
  let t = 60;
  timer.textContent = t;

  resendInterval = setInterval(() => {
    t--;
    timer.textContent = t;
    if (t <= 0) {
      clearInterval(resendInterval);
      btn.disabled = false;
      btn.innerHTML = 'Resend code';
    }
  }, 1000);
}

async function resendOTP() {
  try {
    const res = await fetch('/api/resend-otp/', {
      method: 'POST',
      headers: { 'X-CSRFToken': CSRF() }
    });
    const data = await res.json();
    if (data.success) {
      showToast('New code sent!', 'success');
      startResendTimer();
      document.getElementById('resend-btn').innerHTML = `Resend code (<span id="resend-timer">60</span>s)`;
    } else {
      showToast(data.message, 'error');
    }
  } catch {
    showToast('Failed to resend. Try again.', 'error');
  }
}

function goBack() {
  document.getElementById('step-otp').classList.remove('active');
  document.getElementById('step-email').classList.add('active');
  document.getElementById('email-error').textContent = '';
  clearInterval(resendInterval);
}
