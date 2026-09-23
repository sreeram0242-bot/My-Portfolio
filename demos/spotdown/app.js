/**
 * SpotiZip Client JavaScript
 * Handles Spotify URL fetching, live download progress polling, and ZIP exports.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playlistUrlInput = document.getElementById('playlistUrl');
    const btnPaste = document.getElementById('btnPaste');
    const btnFetch = document.getElementById('btnFetch');
    const btnClear = document.getElementById('btnClear');
    const fetchSpinner = document.querySelector('#btnFetch .spinner');
    const btnText = document.querySelector('#btnFetch .btn-text');
    const btnIcon = document.querySelector('#btnFetch .btn-icon');
    
    const errorBanner = document.getElementById('errorBanner');
    const errorMessage = document.getElementById('errorMessage');
    const btnCloseError = document.getElementById('btnCloseError');

    const dashboardGrid = document.getElementById('dashboardGrid');
    const playlistCover = document.getElementById('playlistCover');
    const playlistTitle = document.getElementById('playlistTitle');
    const trackCount = document.getElementById('trackCount');
    const totalDuration = document.getElementById('totalDuration');
    const tracksBadge = document.getElementById('tracksBadge');

    const btnStartDownload = document.getElementById('btnStartDownload');
    const customSavePath = document.getElementById('customSavePath');
    const qualitySegments = document.querySelectorAll('.segmented-control .segment');

    const progressContainer = document.getElementById('progressContainer');
    const currentTaskText = document.getElementById('currentTaskText');
    const percentText = document.getElementById('percentText');
    const progressBarFill = document.getElementById('progressBarFill');
    const downloadedCount = document.getElementById('downloadedCount');
    const totalDownloadCount = document.getElementById('totalDownloadCount');
    const overallStatusChip = document.getElementById('overallStatusChip');
    const overallStatusText = document.getElementById('overallStatusText');

    const trackListBody = document.getElementById('trackListBody');
    const completionBox = document.getElementById('completionBox');
    const btnDirectDownload = document.getElementById('btnDirectDownload');
    const btnSaveToCustom = document.getElementById('btnSaveToCustom');

    // State Variables
    let currentPlaylistData = null;
    let selectedQuality = '128k';
    let currentJobId = null;
    let pollInterval = null;

    // --- Helper Functions ---
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function formatTotalTime(tracks) {
        const totalSecs = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
        const mins = Math.floor(totalSecs / 60);
        if (mins < 60) return `~${mins} min`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `~${hrs} hr ${remMins} min`;
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.remove('hidden');
    }

    function hideError() {
        errorBanner.classList.add('hidden');
    }

    function setFetchingState(isFetching) {
        if (isFetching) {
            btnFetch.disabled = true;
            fetchSpinner.classList.remove('hidden');
            btnText.textContent = "Fetching...";
            if (btnIcon) btnIcon.classList.add('hidden');
        } else {
            btnFetch.disabled = false;
            fetchSpinner.classList.add('hidden');
            btnText.textContent = "Fetch Tracks";
            if (btnIcon) btnIcon.classList.remove('hidden');
        }
    }

    // --- Event Listeners ---

    // Toggle Clear Button
    playlistUrlInput.addEventListener('input', () => {
        if (playlistUrlInput.value.trim().length > 0) {
            btnClear.style.display = 'block';
        } else {
            btnClear.style.display = 'none';
        }
        hideError();
    });

    btnClear.addEventListener('click', () => {
        playlistUrlInput.value = '';
        btnClear.style.display = 'none';
        playlistUrlInput.focus();
    });

    // Paste Clipboard Button
    btnPaste.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.includes('spotify.com')) {
                playlistUrlInput.value = text.trim();
                btnClear.style.display = 'block';
                fetchPlaylistInfo();
            } else {
                showError("Clipboard does not contain a valid Spotify URL.");
            }
        } catch (err) {
            showError("Unable to access clipboard. Please paste manually.");
        }
    });

    // Close Error
    btnCloseError.addEventListener('click', hideError);

    // Enter Key in Input
    playlistUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchPlaylistInfo();
        }
    });

    // Fetch Playlist Info Button
    btnFetch.addEventListener('click', fetchPlaylistInfo);

    // Segmented Control (Quality Selection)
    qualitySegments.forEach(segment => {
        segment.addEventListener('click', () => {
            qualitySegments.forEach(s => s.classList.remove('active'));
            segment.classList.add('active');
            selectedQuality = segment.getAttribute('data-quality');
        });
    });

    // --- Core API Actions ---

    async function fetchPlaylistInfo() {
        const url = playlistUrlInput.value.trim();
        if (!url) {
            showError("Please enter or paste a Spotify playlist URL.");
            return;
        }

        if (!url.includes('spotify.com')) {
            showError("Invalid URL. Please enter a valid Spotify link (playlist, album, or track).");
            return;
        }

        hideError();
        setFetchingState(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s max timeout

        try {
            const response = await fetch('/api/playlist/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const result = await response.json();

            if (!result.success) {
                showError(result.error || "Failed to fetch playlist details.");
                setFetchingState(false);
                return;
            }

            currentPlaylistData = result.data;
            renderPlaylistData(currentPlaylistData);
            setFetchingState(false);

        } catch (err) {
            clearTimeout(timeoutId);
            setFetchingState(false);
            if (err.name === 'AbortError') {
                showError("Request timed out. Please check your internet connection or URL and try again.");
            } else {
                showError("Network error connecting to server. Make sure server is running.");
            }
        }
    }

    function renderPlaylistData(data) {
        playlistTitle.textContent = data.playlist_name;
        playlistCover.src = data.cover_url || 'https://images.unsplash.com/photo-1614680376593-902f749f7cfc?q=80&w=400';
        trackCount.textContent = `${data.total_tracks} Tracks`;
        totalDuration.textContent = formatTotalTime(data.tracks);
        tracksBadge.textContent = `${data.total_tracks} songs`;

        // Render Track Rows
        trackListBody.innerHTML = '';
        data.tracks.forEach((track, idx) => {
            const tr = document.createElement('tr');
            tr.id = `track-row-${idx + 1}`;
            tr.innerHTML = `
                <td style="color: var(--text-muted);">${idx + 1}</td>
                <td class="track-title-cell">${escapeHtml(track.name)}</td>
                <td class="track-artist-cell">${escapeHtml(track.artist)}</td>
                <td class="track-duration-cell">${formatTime(track.duration)}</td>
                <td style="text-align: right;" id="status-cell-${idx + 1}">
                    <span class="badge-queued"><i class="ri-time-line"></i> Queued</span>
                </td>
            `;
            trackListBody.appendChild(tr);
        });

        // Reset UI Components
        progressContainer.classList.add('hidden');
        completionBox.classList.add('hidden');
        btnStartDownload.disabled = false;
        btnStartDownload.innerHTML = `<i class="ri-file-zip-line"></i> <span class="btn-text">Download All as ZIP</span>`;
        overallStatusText.textContent = "Ready";
        overallStatusChip.querySelector('.chip-dot').style.background = 'var(--text-muted)';

        dashboardGrid.classList.remove('hidden');
        dashboardGrid.scrollIntoView({ behavior: 'smooth' });
    }

    // --- Download Execution & Real-Time Polling ---

    btnStartDownload.addEventListener('click', startDownloadJob);

    async function startDownloadJob() {
        if (!currentPlaylistData) return;

        const url = playlistUrlInput.value.trim();
        const savePath = customSavePath.value.trim();

        btnStartDownload.disabled = true;
        btnStartDownload.innerHTML = `<div class="spinner"></div> <span>Preparing Download...</span>`;
        overallStatusText.textContent = "Starting...";

        progressContainer.classList.remove('hidden');
        completionBox.classList.add('hidden');
        progressBarFill.style.width = '0%';
        percentText.textContent = '0%';
        downloadedCount.textContent = '0';
        totalDownloadCount.textContent = currentPlaylistData.total_tracks;

        try {
            const response = await fetch('/api/download/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    quality: selectedQuality,
                    format: 'mp3',
                    save_path: savePath
                })
            });

            const result = await response.json();

            if (!result.success) {
                showError(result.error || "Failed to start download job.");
                btnStartDownload.disabled = false;
                btnStartDownload.innerHTML = `<i class="ri-file-zip-line"></i> <span class="btn-text">Download All as ZIP</span>`;
                return;
            }

            currentJobId = result.job_id;
            overallStatusText.textContent = "Downloading...";
            overallStatusChip.querySelector('.chip-dot').style.background = 'var(--cyan-accent)';

            // Start Polling Loop
            if (pollInterval) clearInterval(pollInterval);
            pollInterval = setInterval(pollJobStatus, 1000);

        } catch (err) {
            showError("Failed to initiate download job.");
            btnStartDownload.disabled = false;
        }
    }

    async function pollJobStatus() {
        if (!currentJobId) return;

        try {
            const response = await fetch(`/api/download/status/${currentJobId}`);
            const result = await response.json();

            if (!result.success) {
                // Job was lost or server restarted -> stop polling and reset UI cleanly
                clearInterval(pollInterval);
                pollInterval = null;
                showError(result.error || "Download job not found or server restarted. Please click Download again.");
                btnStartDownload.disabled = false;
                btnStartDownload.innerHTML = `<i class="ri-file-zip-line"></i> <span class="btn-text">Download All as ZIP</span>`;
                overallStatusText.textContent = "Ready";
                overallStatusChip.querySelector('.chip-dot').style.background = 'var(--text-muted)';
                return;
            }

            const job = result.job;
            updateJobUI(job);

            if (job.status === 'completed' || job.status === 'error') {
                clearInterval(pollInterval);
                pollInterval = null;
            }

        } catch (err) {
            console.warn("Poll status check failed:", err);
        }
    }

    function updateJobUI(job) {
        // Update Progress Bar & Percentage
        progressBarFill.style.width = `${job.percent}%`;
        percentText.textContent = `${job.percent}%`;
        downloadedCount.textContent = job.completed_tracks;
        totalDownloadCount.textContent = job.total_tracks;
        currentTaskText.textContent = job.current_track || "Processing songs...";

        // Update Track Status Rows
        if (job.tracks && Array.isArray(job.tracks)) {
            job.tracks.forEach(track => {
                const cell = document.getElementById(`status-cell-${track.id}`);
                if (cell) {
                    if (track.status === 'downloading') {
                        cell.innerHTML = `<span class="badge-downloading"><i class="ri-loader-4-line spinner" style="border-top-color: var(--cyan-accent); width:12px; height:12px;"></i> Downloading</span>`;
                    } else if (track.status === 'done') {
                        cell.innerHTML = `<span class="badge-done"><i class="ri-check-line"></i> Completed</span>`;
                    } else if (track.status === 'error') {
                        cell.innerHTML = `<span class="badge-error"><i class="ri-close-line"></i> Failed</span>`;
                    }
                }
            });
        }

        // Job Completion
        if (job.status === 'completed') {
            overallStatusText.textContent = "ZIP Ready!";
            overallStatusChip.querySelector('.chip-dot').style.background = 'var(--spotify-green)';
            btnStartDownload.innerHTML = `<i class="ri-checkbox-circle-line"></i> <span>Completed!</span>`;

            // Prepare Completion Box
            btnDirectDownload.href = `/api/download/file/${job.id}`;
            btnDirectDownload.download = job.zip_name;

            if (job.saved_to_path) {
                document.getElementById('completionMessage').textContent = `Saved directly to your PC: ${job.saved_to_path}`;
            } else {
                document.getElementById('completionMessage').textContent = `All ${job.completed_tracks} tracks successfully packed into ${job.zip_name}.`;
            }

            completionBox.classList.remove('hidden');
            completionBox.scrollIntoView({ behavior: 'smooth' });

            // Automatically trigger direct browser download!
            triggerAutomaticDownload(`/api/download/file/${job.id}`, job.zip_name);

        } else if (job.status === 'error') {
            overallStatusText.textContent = "Error";
            overallStatusChip.querySelector('.chip-dot').style.background = 'var(--status-error)';
            showError(job.error_message || "An error occurred during download.");
            btnStartDownload.disabled = false;
        }
    }

    // Auto-trigger browser download
    function triggerAutomaticDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Custom Path Save Handler
    btnSaveToCustom.addEventListener('click', async () => {
        if (!currentJobId) return;
        const customPath = customSavePath.value.trim() || prompt("Enter the absolute PC directory path to save the ZIP (e.g., C:\\Users\\Name\\Desktop):");
        if (!customPath) return;

        try {
            const response = await fetch('/api/download/save-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: currentJobId,
                    destination: customPath
                })
            });

            const result = await response.json();
            if (result.success) {
                alert(`ZIP file saved successfully to:\n${result.saved_path}`);
            } else {
                alert(`Error saving file: ${result.error}`);
            }
        } catch (err) {
            alert("Failed to communicate with local server.");
        }
    });

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Auto-populate and fetch on load to match 100% original screenshot state
    setTimeout(() => {
        if (playlistUrlInput && !playlistUrlInput.value) {
            playlistUrlInput.value = "https://open.spotify.com/playlist/3jikTRVPGkkKjQGzZbDv44";
            btnFetch.click();
        }
    }, 100);
});
