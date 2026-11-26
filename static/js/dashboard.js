/* QuantumCV — Dashboard JS */

const CSRF = () => document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<div class="toast-icon"></div><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 4000);
}

async function deleteResume(id, btn) {
  if (!confirm('Delete this resume? This cannot be undone.')) return;

  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch(`/resume/api/delete/${id}/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': CSRF() }
    });
    const data = await res.json();
    if (data.success) {
      const card = document.querySelector(`.resume-card[data-id="${id}"]`);
      card.style.transition = 'all 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.remove();
        showToast('Resume deleted.', 'info');
        // Show empty state if no resumes left
        if (!document.querySelectorAll('.resume-card').length) {
          location.reload();
        }
      }, 300);
    }
  } catch {
    showToast('Failed to delete. Try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}
