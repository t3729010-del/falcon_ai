async function loadDiagnostics() {
    try {
        const resp = await fetch('http://127.0.0.1:5000/avatar/diagnostics');
        const data = await resp.json();

        document.getElementById('active-provider').textContent =
            data.active_provider || 'none';
        document.getElementById('available-count').textContent =
            `${data.available_count} / ${data.total_providers}`;

        const grid = document.getElementById('provider-grid');
        grid.innerHTML = data.providers.map(p => {
            const isActive = p.name === data.active_provider;
            const statusClass = p.available ? 'available' : 'unavailable';
            const badgeClass = p.available ? 'ready' : 'unavailable';
            const activeClass = isActive ? 'active' : '';
            const badgeText = isActive ? '● ACTIVE' : p.available ? 'READY' : 'UNAVAILABLE';

            return `
                <div class="provider-card ${statusClass} ${activeClass}">
                    <div class="provider-header">
                        <span class="provider-name">${p.name}</span>
                        <span class="provider-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="provider-detail">Model: ${p.model}</div>
                    <div class="provider-detail">${p.detail}</div>
                    ${p.last_error ? `<div class="provider-detail" style="color:#ff6b6b">Last error: ${p.last_error}</div>` : ''}
                    <div class="provider-stats">
                        <div class="provider-stat">Gen time <span>${p.last_generation_time_ms ? p.last_generation_time_ms + 'ms' : '—'}</span></div>
                        <div class="provider-stat">Total <span>${p.total_generations}</span></div>
                        <div class="provider-stat">Failed <span>${p.failed_generations}</span></div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        document.getElementById('provider-grid').innerHTML =
            `<div class="provider-card unavailable"><div class="provider-detail" style="color:#ff6b6b">Failed to load diagnostics: ${e.message}</div></div>`;
    }
}

document.getElementById('refresh-btn').addEventListener('click', loadDiagnostics);

document.getElementById('test-avatar-btn').addEventListener('click', async () => {
    const btn = document.getElementById('test-avatar-btn');
    btn.textContent = '⏳ Testing...';
    btn.disabled = true;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#d4b896';
        ctx.beginPath();
        ctx.ellipse(128, 120, 50, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(108, 110, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(148, 110, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(128, 145, 20, 0.1, Math.PI - 0.1);
        ctx.stroke();

        const b64 = canvas.toDataURL('image/png').split(',')[1];

        const resp = await fetch('http://127.0.0.1:5000/generate_avatar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({image: `data:image/png;base64,${b64}`}),
            signal: AbortSignal.timeout(120000)
        });

        const data = await resp.json();
        if (data.use_browser_fallback) {
            alert('All AI providers unavailable → BrowserFallbackProvider will be used.\n\nThe avatar will be generated in your browser using Canvas.');
        } else if (data.success) {
            alert(`Avatar generated successfully!\n\nProvider: ${data.model_used}\nTime: ${data.inference_time_s}s`);
        } else {
            alert(`Generation failed: ${data.error}`);
        }
    } catch (e) {
        alert(`Error: ${e.message}`);
    }

    btn.textContent = 'Test Avatar Generation';
    btn.disabled = false;
    loadDiagnostics();
});

loadDiagnostics();
setInterval(loadDiagnostics, 10000);
