*MiniRPlace.jsx**
```jsx
import React, { useRef, useState, useEffect } from 'react';

export default function MiniRPlace() {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState(Array(1000).fill(null).map(() => Array(1000).fill('#FFFFFF')));
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({x: 0, y: 0});

  const draw = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    for (let y = 0; y < 1000; y++) {
      for (let x = 0; x < 1000; x++) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(x, y, 1, 1);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, 1, 1);
      }
    }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    draw(ctx);
  }, [grid, scale, offset]);

  const paintPixel = (x, y) => {
    if (x < 0 || y < 0 || x >= 1000 || y >= 1000) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      if (tool === 'pen') newGrid[y][x] = color;
      if (tool === 'eraser') newGrid[y][x] = '#FFFFFF';
      if (tool === 'picker') setColor(newGrid[y][x]);
      if (tool === 'bucket') fillArea(newGrid, x, y, newGrid[y][x], color);
      return newGrid;
    });
  };

  const fillArea = (gridData, x, y, targetColor, newColor) => {
    if (targetColor === newColor) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= 1000 || cy >= 1000) continue;
      if (gridData[cy][cx] !== targetColor) continue;
      gridData[cy][cx] = newColor;
      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      panStart.current = {x: e.clientX - offset.x, y: e.clientY - offset.y};
    } else {
      const rect = e.target.getBoundingClientRect();
      const px = Math.floor((e.clientX - rect.left - offset.x) / scale);
      const py = Math.floor((e.clientY - rect.top - offset.y) / scale);
      paintPixel(px, py);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setOffset({x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y});
    } else if (e.buttons === 1) {
      const rect = e.target.getBoundingClientRect();
      const px = Math.floor((e.clientX - rect.left - offset.x) / scale);
      const py = Math.floor((e.clientY - rect.top - offset.y) / scale);
      paintPixel(px, py);
    }
  };

  return (
    <div>
      <input type="color" value={color} onChange={e => setColor(e.target.value)} />
      <button onClick={() => setTool('pen')}>Pincel</button>
      <button onClick={() => setTool('eraser')}>Borrador</button>
      <button onClick={() => setTool('bucket')}>Relleno</button>
      <button onClick={() => setTool('picker')}>Cuentagotas</button>
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onWheel={e => setScale(prev => e.deltaY < 0 ? prev * 1.1 : prev / 1.1)}
      />
    </div>
  );
}
```
