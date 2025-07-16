document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const input = document.getElementById('vttFiles');
  const files = input.files;
  if (!files.length) return alert("Select at least one .vtt file.");

  const formData = new FormData();
  for (let file of files) {
    formData.append('vttFiles', file);
  }

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to download zip.');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    const disposition = response.headers.get('Content-Disposition');
    const match = disposition && disposition.match(/filename="?(.+)"?/);
    const filename = match ? match[1] : 'processed.zip';

    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert('Upload or download failed.');
  }
});
