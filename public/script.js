document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('requestForm');
  const tableBody = document.querySelector('#requestTable tbody');

  fetchRequests();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const newRequest = {
      client: formData.get('client'),
      device: formData.get('device'),
      issue: formData.get('issue')
    };

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    });

    if (res.ok) {
      form.reset();
      fetchRequests();
    } else {
      alert('Ошибка при добавлении заявки');
    }
  });

  async function fetchRequests() {
    const res = await fetch('/api/requests');
    const requests = await res.json();
    tableBody.innerHTML = '';

    requests.forEach((req) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${req.id}</td>
        <td>${req.client}</td>
        <td>${req.device}</td>
        <td>${req.issue}</td>
        <td>${req.status}</td>
        <td>
          <button onclick="updateStatus(${req.id}, '${req.status}')">
            Изменить статус
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  window.updateStatus = async function (id, currentStatus) {
    const newStatus = currentStatus === 'Ожидает' ? 'Выполнено' : 'Ожидает';

    const res = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      fetchRequests();
    } else {
      alert('Ошибка при обновлении статуса');
    }
  };
});
