document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    alert('ID заявки не указан');
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('editRequestForm');

  // Загрузка заявки
  fetch(`/api/requests`)
    .then(res => res.json())
    .then(data => {
      const request = data.find(r => r.id == id);
      if (!request) {
        alert('Заявка не найдена');
        window.location.href = 'index.html';
        return;
      }
      document.getElementById('requestId').value = request.id;
      document.getElementById('client').value = request.client;
      document.getElementById('device').value = request.device;
      document.getElementById('issue').value = request.issue;
      document.getElementById('status').value = request.status;
    });

  // Отправка изменений
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedRequest = {
      client: document.getElementById('client').value.trim(),
      device: document.getElementById('device').value.trim(),
      issue: document.getElementById('issue').value.trim(),
      status: document.getElementById('status').value,
    };

    if (!updatedRequest.client || !updatedRequest.device || !updatedRequest.issue) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    const res = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRequest),
    });

    if (res.ok) {
      alert('Заявка успешно обновлена!');
      window.location.href = 'index.html';
    } else {
      alert('Ошибка при обновлении заявки.');
    }
  });
});
