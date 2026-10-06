"use client";

import { useState, useRef } from "react";

const STATUS = {
  IDLE: "idle",
  VALIDATING: "validating",
  ANALYZING: "analyzing",
  READY: "ready",
  DOWNLOADING: "downloading",
  DONE: "done",
  ERROR: "error",
};

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [message, setMessage] = useState("");
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus(STATUS.VALIDATING);
    setMessage("Memeriksa URL...");
    setFormats([]);
    setSelectedFormat(null);
    setVideoInfo(null);
    setProgress(0);

    try {
      const res = await fetch("/api/process?mode=info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(STATUS.ERROR);
        setMessage(data.error || "Gagal menganalisis video.");
        return;
      }

      setStatus(STATUS.READY);
      setMessage("Analisis selesai. Pilih kualitas dan format.");
      setVideoInfo({
        title: data.title,
        duration: data.duration,
        thumbnail: data.thumbnail,
      });
      setFormats(data.formats || []);
      if (data.formats?.length > 0) {
        setSelectedFormat(data.formats[0].format_id);
      }
    } catch (err) {
      setStatus(STATUS.ERROR);
      setMessage(
        err.name === "AbortError"
          ? "Permintaan dibatalkan."
          : "Terjadi kesalahan jaringan."
      );
    }
  }

  async function handleDownload() {
    if (!selectedFormat) return;

    setStatus(STATUS.DOWNLOADING);
    setMessage("Menyiapkan download...");
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/process?mode=download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          format_id: selectedFormat,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus(STATUS.ERROR);
        setMessage(data.error || "Gagal menyiapkan download.");
        return;
      }

      const contentLength = res.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          setProgress(Math.round((received / total) * 100));
        }
      }

      const blob = new Blob(chunks);
      const downloadUrl = URL.createObjectURL(blob);

      // Ekstrak nama file dari header Content-Disposition
      const disposition = res.headers.get("Content-Disposition") || "";
      let filename = "video.mp4";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
      if (match) filename = decodeURIComponent(match[1]);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);

      setStatus(STATUS.DONE);
      setMessage("Selesai. File telah diunduh.");
      setProgress(100);
    } catch (err) {
      if (err.name === "AbortError") {
        setStatus(STATUS.READY);
        setMessage("Download dibatalkan.");
      } else {
        setStatus(STATUS.ERROR);
        setMessage("Terjadi kesalahan saat mengunduh.");
      }
    } finally {
      abortRef.current = null;
    }
  }

  function cancelDownload() {
    if (abortRef.current) abortRef.current.abort();
  }

  const isLoading =
    status === STATUS.VALIDATING || status === STATUS.ANALYZING;

  return (
    <div className="space-y-6">
      <form onSubmit={handleAnalyze} className="space-y-3">
        <label htmlFor="url" className="sr-only">
          URL Video
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="url"
            type="url"
            inputMode="url"
            placeholder="https://contoh.com/video"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading || status === STATUS.DOWNLOADING}
            className="flex-1 rounded-lg border border-border-light dark:border-border-dark bg-transparent px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={
              isLoading || !url.trim() || status === STATUS.DOWNLOADING
            }
            className="rounded-lg bg-neutral-900 dark:bg-neutral-100 px-6 py-3 text-sm font-medium text-white dark:text-neutral-900 transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "Menganalisis..." : "Analisis"}
          </button>
        </div>
      </form>

      {/* Status */}
      {(status !== STATUS.IDLE || message) && (
        <div className="flex items-center gap-2 min-h-[1.5rem]">
          {status === STATUS.ERROR ? (
            <span className="status-text-error">{message}</span>
          ) : status === STATUS.DONE ? (
            <span className="status-text text-green-600 dark:text-green-400">
              {message}
            </span>
          ) : isLoading || status === STATUS.DOWNLOADING ? (
            <span className="status-text-active">{message}</span>
          ) : (
            <span className="status-text">{message}</span>
          )}
        </div>
      )}

      {/* Skeleton loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-24 w-full" />
        </div>
      )}

      {/* Progress bar */}
      {status === STATUS.DOWNLOADING && progress > 0 && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {progress}%
          </p>
          <button
            onClick={cancelDownload}
            className="text-xs text-red-600 dark:text-red-400 underline"
          >
            Batalkan
          </button>
        </div>
      )}

      {/* Hasil analisis */}
      {videoInfo && (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            {videoInfo.thumbnail && (
              <img
                src={videoInfo.thumbnail}
                alt=""
                className="h-20 w-32 rounded-lg object-cover bg-neutral-200 dark:bg-neutral-800"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{videoInfo.title}</p>
              {videoInfo.duration && (
                <p className="text-sm text-neutral-500">
                  Durasi: {formatDuration(videoInfo.duration)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format tersedia</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {formats.map((f) => (
                <label
                  key={f.format_id}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${
                    selectedFormat === f.format_id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-border-light dark:border-border-dark hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.format_id}
                    checked={selectedFormat === f.format_id}
                    onChange={() => setSelectedFormat(f.format_id)}
                    className="accent-blue-600"
                  />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">
                      {f.resolution || "Audio"}
                    </span>
                    {f.ext && (
                      <span className="text-neutral-500 ml-1">
                        .{f.ext}
                      </span>
                    )}
                    {f.filesize && (
                      <span className="text-neutral-500 ml-2">
                        (~{formatBytes(f.filesize)})
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={!selectedFormat || status === STATUS.DOWNLOADING}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === STATUS.DOWNLOADING
              ? "Menyiapkan download..."
              : "Download"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
