import os
import re
import ipaddress
import socket
from urllib.parse import urlparse
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse
import yt_dlp

app = FastAPI()

MAX_FILE_SIZE = int(os.environ.get("MAX_FILE_SIZE_BYTES", 524288000))  # 500 MB

# ---------------------------------------------------------------------------
# SSRF PROTECTION
# ---------------------------------------------------------------------------

PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

BLOCKED_SCHEMES = {"file", "ftp", "gopher", "dict", "data", "javascript"}


def is_private_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return any(ip in net for net in PRIVATE_RANGES)
    except ValueError:
        return True  # gagal parse → anggap tidak aman


def validate_url(url: str) -> str:
    """Validasi URL dan cegah SSRF. Mengembalikan URL yang sudah dinormalisasi."""
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL tidak boleh kosong.")

    try:
        parsed = urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="Format URL tidak valid.")

    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=400,
            detail="Hanya URL http atau https yang didukung.",
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="Hostname tidak ditemukan.")

    # Blokir localhost secara literal
    if hostname.lower() in ("localhost", "localhost.localdomain"):
        raise HTTPException(status_code=400, detail="Host tidak diizinkan.")

    # Resolve DNS dan cek IP
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(
            status_code=400, detail="Tidak dapat menyelesaikan hostname."
        )

    for info in infos:
        ip = info[4][0]
        if is_private_ip(ip):
            raise HTTPException(
                status_code=400,
                detail="Host mengarah ke alamat internal. Tidak diizinkan.",
            )

    return url


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------


def sanitize_filename(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name)
    name = name.strip(". ")
    return name[:200] or "video"


def build_format_list(info: dict) -> list:
    """Bangun daftar format yang layak ditampilkan."""
    formats = []
    seen = set()

    for f in info.get("formats", []):
        if f.get("format_note") == "storyboard":
            continue
        if not f.get("url"):
            continue

        fid = f.get("format_id")
        if not fid or fid in seen:
            continue
        seen.add(fid)

        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        is_video = vcodec != "none"
        is_audio = acodec != "none"

        if not is_video and not is_audio:
            continue

        entry = {
            "format_id": fid,
            "ext": f.get("ext", ""),
            "resolution": f.get("resolution") or (
                f"{f.get('height', '')}p" if f.get("height") else None
            ),
            "filesize": f.get("filesize") or f.get("filesize_approx"),
            "vcodec": vcodec,
            "acodec": acodec,
            "format_note": f.get("format_note", ""),
        }

        # Hanya tampilkan progresif (video+audio) atau video-only resolusi tertinggi
        if is_video and is_audio:
            formats.append(entry)
        elif is_video and not is_audio:
            # Simpan video-only hanya jika tidak ada progresif yang setara
            formats.append(entry)
        elif is_audio and not is_video:
            # Audio-only: prioritaskan m4a/webm
            if f.get("ext") in ("m4a", "webm", "mp3"):
                formats.append(entry)

    # Urutkan: progresif dulu, lalu resolusi tertinggi
    def sort_key(x):
        res = 0
        if x.get("resolution"):
            m = re.search(r"(\d+)p?", str(x["resolution"]))
            if m:
                res = int(m.group(1))
        has_audio = 1 if x.get("acodec") != "none" else 0
        return (-has_audio, -res)

    formats.sort(key=sort_key)

    # Batasi jumlah format agar UI tidak penuh
    return formats[:20]


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------


@app.post("/api/process")
async def process(
    request: Request,
    mode: str = Query("info"),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body JSON tidak valid.")

    raw_url = body.get("url", "")
    url = validate_url(raw_url)

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 30,
        "retries": 3,
        "extractor_retries": 2,
        "no_check_certificate": False,
        "nocheckcertificate": False,
    }

    # ------------------------------------------------------------------
    # MODE: INFO
    # ------------------------------------------------------------------
    if mode == "info":
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
        except yt_dlp.utils.DownloadError as e:
            msg = str(e)
            if "DRM" in msg or "drm" in msg:
                raise HTTPException(
                    status_code=422,
                    detail="Sumber ini menggunakan DRM. Vidora tidak mendukung bypass DRM.",
                )
            if "login" in msg.lower() or "sign in" in msg.lower():
                raise HTTPException(
                    status_code=422,
                    detail="Sumber ini memerlukan login. Tidak didukung.",
                )
            if "private" in msg.lower() or "not available" in msg.lower():
                raise HTTPException(
                    status_code=422,
                    detail="Video tidak tersedia secara publik.",
                )
            raise HTTPException(
                status_code=422,
                detail=f"Sumber tidak didukung atau menolak permintaan: {msg[:200]}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Gagal menganalisis video: {str(e)[:200]}",
            )

        if info.get("_type") == "playlist":
            raise HTTPException(
                status_code=400,
                detail="Playlist tidak didukung. Masukkan URL video tunggal.",
            )

        formats = build_format_list(info)

        return JSONResponse(
            {
                "title": info.get("title", "Video"),
                "duration": info.get("duration"),
                "thumbnail": info.get("thumbnail"),
                "formats": formats,
            }
        )

    # ------------------------------------------------------------------
    # MODE: DOWNLOAD (streaming)
    # ------------------------------------------------------------------
    elif mode == "download":
        format_id = body.get("format_id")
        if not format_id:
            raise HTTPException(
                status_code=400, detail="format_id wajib untuk mode download."
            )

        # Ambil info dulu untuk mendapatkan judul dan format yang tepat
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
        except yt_dlp.utils.DownloadError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Sumber tidak dapat diakses: {str(e)[:200]}",
            )

        # Cari format yang diminta
        target = None
        for f in info.get("formats", []):
            if f.get("format_id") == format_id:
                target = f
                break

        if not target:
            raise HTTPException(
                status_code=400, detail="Format yang dipilih tidak tersedia."
            )

        # Cek ukuran file
        filesize = target.get("filesize") or target.get("filesize_approx")
        if filesize and filesize > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File terlalu besar ({filesize // 1048576} MB). Batas maksimum {MAX_FILE_SIZE // 1048576} MB.",
            )

        title = sanitize_filename(info.get("title", "video"))
        ext = target.get("ext", "mp4")
        filename = f"{title}.{ext}"

        # Siapkan opsi download streaming
        download_opts = {
            **ydl_opts,
            "format": format_id,
            "outtmpl": "-",  # stream ke stdout
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
        }

        def generate():
            with yt_dlp.YoutubeDL(download_opts) as ydl:
                ydl.download([url])

        return StreamingResponse(
            generate(),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Content-Type-Options": "nosniff",
            },
        )

    else:
        raise HTTPException(
            status_code=400, detail="Mode tidak dikenal. Gunakan 'info' atau 'download'."
        )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
