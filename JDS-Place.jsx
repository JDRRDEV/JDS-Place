import React, { useEffect, useRef, useState } from "react";

const WIDTH = 1000;
const HEIGHT = 1000;
const DEFAULT_PALETTE = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#A52A2A",
  "#808080", "#800080", "#008000", "#000080", "#FFC0CB",
  "#FFD700", "#40E0D0", "#8B4513", "#2F4F4F", "#C0C0C0"
];

function hexToRGBA(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b, 255];
}

export default function MiniRPlace() {
  const canvasRef = useRef(null);
  const offscreenRef = useRef(document.createElement('canvas'));
  const [palette] = useState(DEFAULT_PALETTE);
  const [color, setColor] = useState(palette[0]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offX: 0, offY: 0 });

  useEffect(() => {
    const off = offscreenRef.current;
    off.width = WIDTH;
    off.height = HEIGHT;
    const ctx = off.getContext('2d');
    const img = ctx.createImageData(WIDTH, HEIGHT);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    draw();
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreenRef.current, 0, 0);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    for (let x = 0; x <= WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
  }

  function placePixel(px, py, hex) {
    if (px < 0 || py < 0 || px >= WIDTH || py >= HEIGHT) return;
    const [r, g, b, a] = hexToRGBA(hex);
    const img = offscreenRef.current.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT);
    const idx = (py * WIDTH + px) * 4;
    img.data[idx] = r;
    img.data[idx + 1] = g;
    img.data[idx + 2] = b;
    img.data[idx + 3] = a;
    offscreenRef.current.getContext('2d').putImageData(img, 0, 0);
    draw();
  }

  function clientToCanvasPixel(clientX, clientY) {
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const sx = (clientX - rect.left) / dpr;
    const sy = (clientY - rect.top) / dpr;
    const cx = (sx - offset.x) / scale;
    const cy = (sy - offset.y) / scale;
    return { px: Math.floor(cx), py: Math.floor(cy) };
  }

  function onMouseDown(e) {
    if (e.button === 2) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, offX: offset.x, offY: offset.y };
    } else {
      const { px, py } = clientToCanvasPixel(e.clientX, e.clientY);
      placePixel(px, py, color);
    }
  }

  function onMouseMove(e) {
    if (!isPanning) return;
    const start = panStartRef.current;
    setOffset({ x: start.offX + e.clientX - start.x, y: start.offY + e.clientY - start.y });
    draw();
  }

  function onMouseUp() { setIsPanning(false); }

  function onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(50, Math.max(0.1, s * zoomFactor)));
    draw();
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', padding: '10px', background: '#222', color: '#fff' }}>
        <div>Paleta</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
          {palette.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{ background: c, height: '30px', border: c === color ? '2px solid #fff' : '1px solid #444', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        style={{ flex: 1, background: '#fff', cursor: 'crosshair' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onContextMenu={e => e.preventDefault()}
        onWheel={onWheel}
      />
    </div>
  );
}
