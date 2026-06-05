// frontend/app/lib/qrFrameGenerator.ts

export type FrameStyle = 'classic' | 'modern' | 'vintage' | 'minimal' | 'floral' | 'geometric' | 'oriental' | 'artdeco';

export interface FrameOptions {
  style: FrameStyle;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  includeLogo: boolean;
  logoSize: number;
}

const FRAME_STYLES: Record<FrameStyle, {
  name: string;
  description: string;
}> = {
  classic: {
    name: 'Classic',
    description: 'Ornate double border with filigree corners'
  },
  modern: {
    name: 'Modern',
    description: 'Layered gradients with geometric accents'
  },
  vintage: {
    name: 'Vintage',
    description: 'Victorian scrollwork with floral motifs'
  },
  minimal: {
    name: 'Minimal',
    description: 'Elegant thin lines with subtle depth'
  },
  floral: {
    name: 'Floral',
    description: 'Intricate botanical garden border'
  },
  geometric: {
    name: 'Geometric',
    description: 'Complex mandala-inspired pattern'
  },
  oriental: {
    name: 'Oriental',
    description: 'Moroccan palace lattice design'
  },
  artdeco: {
    name: 'Art Deco',
    description: 'Gatsby-era luxury fan patterns'
  }
};

export const getFrameStyles = () => FRAME_STYLES;

export async function generateFramedQR(
  qrDataUrl: string,
  options: FrameOptions,
  canvasWidth: number = 900,
  canvasHeight: number = 900
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    
    qrImage.onload = () => {
      // Keep QR size large - use 70% of canvas for good visibility
      const qrSize = Math.floor(canvasWidth * 0.7);
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = (canvasHeight - qrSize) / 2;
      
      // Background with subtle texture
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Add subtle background pattern
      drawBackgroundTexture(ctx, options, canvasWidth, canvasHeight);
      
      // Draw elaborate frame
      drawFrame(ctx, options, canvasWidth, canvasHeight, qrX, qrY, qrSize);
      
      // QR code container with elegant styling
      const padding = 16;
      
      // White plate with rounded corners
      ctx.save();
      
      // Subtle shadow
      ctx.shadowColor = hexToRgba(options.primaryColor, 0.15);
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;
      
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2, 12);
      ctx.fill();
      ctx.restore();
      
      // Subtle inner border on white plate
      ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.25);
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, qrX - padding + 3, qrY - padding + 3, qrSize + padding * 2 - 6, qrSize + padding * 2 - 6, 10);
      ctx.stroke();
      
      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      
      resolve(canvas.toDataURL('image/png', 1.0));
    };

    qrImage.onerror = () => {
      reject(new Error('Failed to load QR code image'));
    };

    qrImage.src = qrDataUrl;
  });
}

// ========== BACKGROUND TEXTURE ==========
function drawBackgroundTexture(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  // Very subtle dot pattern
  ctx.fillStyle = hexToRgba(options.primaryColor, 0.02);
  const spacing = 8;
  for (let x = 0; x < w; x += spacing) {
    for (let y = 0; y < h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number,
  qrX: number, qrY: number, qrSize: number
) {
  switch (options.style) {
    case 'classic':
      drawClassicFrame(ctx, options, w, h);
      break;
    case 'modern':
      drawModernFrame(ctx, options, w, h);
      break;
    case 'vintage':
      drawVintageFrame(ctx, options, w, h);
      break;
    case 'minimal':
      drawMinimalFrame(ctx, options, w, h);
      break;
    case 'floral':
      drawFloralFrame(ctx, options, w, h);
      break;
    case 'geometric':
      drawGeometricFrame(ctx, options, w, h);
      break;
    case 'oriental':
      drawOrientalFrame(ctx, options, w, h);
      break;
    case 'artdeco':
      drawArtDecoFrame(ctx, options, w, h);
      break;
  }
}

// ========== CLASSIC FRAME - Ornate Royal ==========
function drawClassicFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 22;
  
  // Outer thick border with gradient
  const outerGradient = ctx.createLinearGradient(0, 0, w, h);
  outerGradient.addColorStop(0, options.primaryColor);
  outerGradient.addColorStop(0.5, options.secondaryColor);
  outerGradient.addColorStop(1, options.primaryColor);
  
  ctx.strokeStyle = outerGradient;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, m, m, w - m * 2, h - m * 2, 8);
  ctx.stroke();
  
  // Middle ornamental border
  ctx.strokeStyle = options.primaryColor;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  drawRoundedRect(ctx, m + 10, m + 10, w - (m + 10) * 2, h - (m + 10) * 2, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Inner thin border
  ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.6);
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, m + 18, m + 18, w - (m + 18) * 2, h - (m + 18) * 2, 4);
  ctx.stroke();
  
  // Elaborate corner ornaments
  const corners = [
    { x: m + 8, y: m + 8, rot: 0 },
    { x: w - m - 8, y: m + 8, rot: Math.PI / 2 },
    { x: w - m - 8, y: h - m - 8, rot: Math.PI },
    { x: m + 8, y: h - m - 8, rot: -Math.PI / 2 }
  ];
  
  corners.forEach(({ x, y, rot }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    
    // Large scrollwork
    ctx.strokeStyle = options.primaryColor;
    ctx.lineWidth = 2;
    
    // Main spiral
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2.5;
      const radius = 32 * (1 - i / 70);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    
    // Secondary spiral
    ctx.strokeStyle = options.secondaryColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + Math.PI / 3;
      const radius = 20 * (1 - i / 45);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    
    // Ornamental dots
    for (let i = 0; i < 3; i++) {
      const dotAngle = (i / 3) * Math.PI / 2;
      const dotRadius = 26;
      ctx.fillStyle = options.primaryColor;
      ctx.beginPath();
      ctx.arc(
        Math.cos(dotAngle) * dotRadius,
        -Math.sin(dotAngle) * dotRadius,
        2.5, 0, Math.PI * 2
      );
      ctx.fill();
    }
    
    ctx.restore();
  });
  
  // Decorative border motifs
  drawBorderMotifs(ctx, options, m + 25, w, h, 5);
}

// ========== MODERN FRAME - Layered Luxury ==========
function drawModernFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 20;
  
  // Outer gradient border
  const gradient1 = ctx.createLinearGradient(0, 0, w, h);
  gradient1.addColorStop(0, options.primaryColor);
  gradient1.addColorStop(0.3, options.secondaryColor);
  gradient1.addColorStop(0.7, options.secondaryColor);
  gradient1.addColorStop(1, options.primaryColor);
  
  ctx.strokeStyle = gradient1;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, m, m, w - m * 2, h - m * 2, 16);
  ctx.stroke();
  
  // Middle border with alternating pattern
  const innerM = m + 12;
  ctx.strokeStyle = hexToRgba(options.primaryColor, 0.5);
  ctx.lineWidth = 1;
  
  // Create dotted pattern
  ctx.setLineDash([2, 6]);
  ctx.lineCap = 'round';
  drawRoundedRect(ctx, innerM, innerM, w - innerM * 2, h - innerM * 2, 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = 'butt';
  
  // Inner solid border
  const innerM2 = innerM + 10;
  ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.4);
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, innerM2, innerM2, w - innerM2 * 2, h - innerM2 * 2, 8);
  ctx.stroke();
  
  // Corner accent rings
  const corners = [
    { x: m + 6, y: m + 6 },
    { x: w - m - 6, y: m + 6 },
    { x: m + 6, y: h - m - 6 },
    { x: w - m - 6, y: h - m - 6 }
  ];
  
  corners.forEach(({ x, y }) => {
    // Outer ring
    ctx.strokeStyle = options.primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI / 2);
    ctx.stroke();
    
    // Middle ring
    ctx.strokeStyle = options.secondaryColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI / 2);
    ctx.stroke();
    
    // Center dot
    ctx.fillStyle = options.primaryColor;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Radial lines
    ctx.strokeStyle = hexToRgba(options.primaryColor, 0.3);
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 3; i++) {
      const angle = (i / 4) * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * 22,
        y - Math.sin(angle) * 22
      );
      ctx.stroke();
    }
  });
  
  // Floating accent marks along borders
  drawFloatingAccents(ctx, options, m + 30, w, h);
}

// ========== VINTAGE FRAME - Victorian Masterpiece ==========
function drawVintageFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 18;
  
  // Main ornate border
  ctx.strokeStyle = options.primaryColor;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, m, m, w - m * 2, h - m * 2, 4);
  ctx.stroke();
  
  // Inner decorative border with bead pattern
  const innerM = m + 10;
  ctx.strokeStyle = options.secondaryColor;
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, innerM, innerM, w - innerM * 2, h - innerM * 2, 2);
  ctx.stroke();
  
  // Bead pattern along inner border
  drawBeadPattern(ctx, options, innerM, w, h);
  
  // Second inner border
  const innerM2 = innerM + 10;
  ctx.strokeStyle = hexToRgba(options.primaryColor, 0.5);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  drawRoundedRect(ctx, innerM2, innerM2, w - innerM2 * 2, h - innerM2 * 2, 1);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Elaborate Victorian corners
  const corners = [
    { x: m + 16, y: m + 16, rot: 0 },
    { x: w - m - 16, y: m + 16, rot: Math.PI / 2 },
    { x: w - m - 16, y: h - m - 16, rot: Math.PI },
    { x: m + 16, y: h - m - 16, rot: -Math.PI / 2 }
  ];
  
  corners.forEach(({ x, y, rot }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    
    // Large scroll element
    ctx.strokeStyle = options.primaryColor;
    ctx.lineWidth = 2;
    
    // Main scroll
    ctx.beginPath();
    ctx.arc(0, -5, 20, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();
    
    // Inner curl
    ctx.beginPath();
    ctx.arc(5, -20, 10, Math.PI * 0.5, Math.PI * 2);
    ctx.stroke();
    
    // Secondary curl
    ctx.strokeStyle = options.secondaryColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-5, -15, 8, Math.PI * 0.3, Math.PI * 1.8);
    ctx.stroke();
    
    // Decorative leaf shapes
    ctx.fillStyle = options.primaryColor;
    drawLeaf(ctx, 15, -10, 8, 4, Math.PI / 4);
    drawLeaf(ctx, 20, -5, 6, 3, Math.PI / 3);
    
    ctx.fillStyle = options.secondaryColor;
    drawLeaf(ctx, 18, -15, 5, 2.5, -Math.PI / 4);
    
    // Small accent dots
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      ctx.fillStyle = i % 2 === 0 ? options.primaryColor : options.secondaryColor;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 14, Math.sin(angle) * 14 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  });
  
  // Side filigree patterns
  drawFiligreePattern(ctx, options, m + 40, w, h);
}

// ========== FLORAL FRAME - Botanical Garden ==========
function drawFloralFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 16;
  
  // Delicate vine border
  ctx.strokeStyle = hexToRgba(options.primaryColor, 0.4);
  ctx.lineWidth = 1;
  
  // Wavy top and bottom with leaves
  for (let side = 0; side < 2; side++) {
    const y = side === 0 ? m + 12 : h - m - 12;
    ctx.beginPath();
    for (let x = m + 30; x < w - m - 30; x += 1) {
      const waveY = y + Math.sin(x * 0.04) * 6 + Math.sin(x * 0.08) * 3;
      if (x === m + 30) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
    
    // Leaves along the vine
    for (let x = m + 40; x < w - m - 40; x += 25) {
      const leafY = y + Math.sin(x * 0.04) * 6 + Math.sin(x * 0.08) * 3;
      const leafDir = side === 0 ? 1 : -1;
      
      ctx.fillStyle = hexToRgba(options.primaryColor, 0.3);
      drawLeaf(ctx, x, leafY, 7, 3.5, leafDir * 0.3);
      
      if (Math.random() > 0.5) {
        ctx.fillStyle = hexToRgba(options.secondaryColor, 0.2);
        drawLeaf(ctx, x + 5, leafY + leafDir * 3, 5, 2.5, leafDir * 0.5);
      }
    }
  }
  
  // Wavy left and right
  for (let side = 0; side < 2; side++) {
    const x = side === 0 ? m + 12 : w - m - 12;
    ctx.beginPath();
    for (let y = m + 30; y < h - m - 30; y += 1) {
      const waveX = x + Math.sin(y * 0.04) * 6 + Math.sin(y * 0.08) * 3;
      if (y === m + 30) ctx.moveTo(waveX, y);
      else ctx.lineTo(waveX, y);
    }
    ctx.stroke();
    
    // Leaves along vertical vines
    for (let y = m + 40; y < h - m - 40; y += 25) {
      const leafX = x + Math.sin(y * 0.04) * 6 + Math.sin(y * 0.08) * 3;
      const leafDir = side === 0 ? 1 : -1;
      
      ctx.fillStyle = hexToRgba(options.primaryColor, 0.3);
      drawLeaf(ctx, leafX, y, 7, 3.5, leafDir * 0.3 + Math.PI / 2);
    }
  }
  
  // Large floral corner bouquets
  const corners = [
    { x: m + 24, y: m + 24 },
    { x: w - m - 24, y: m + 24 },
    { x: m + 24, y: h - m - 24 },
    { x: w - m - 24, y: h - m - 24 }
  ];
  
  corners.forEach(({ x, y }) => {
    // Main rose
    drawRose(ctx, x, y, 12, options.primaryColor, options.secondaryColor);
    
    // Smaller buds
    drawRose(ctx, x + 14, y - 8, 7, options.secondaryColor, options.primaryColor);
    drawRose(ctx, x - 8, y + 12, 8, hexToRgba(options.primaryColor, 0.7), hexToRgba(options.secondaryColor, 0.7));
    
    // Leaves around flowers
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const distance = 20;
      const lx = x + Math.cos(angle) * distance;
      const ly = y + Math.sin(angle) * distance;
      
      ctx.fillStyle = hexToRgba(options.primaryColor, 0.2);
      drawLeaf(ctx, lx, ly, 8, 3, angle + Math.PI / 2);
    }
  });
}

// ========== GEOMETRIC FRAME - Mandala Pattern ==========
function drawGeometricFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 20;
  
  // Complex zigzag outer border
  ctx.strokeStyle = options.primaryColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const segments = 64;
  
  for (let i = 0; i < segments; i++) {
    const progress = i / segments;
    const zigzag = (i % 2 === 0 ? 1 : -1) * 10;
    let px: number, py: number;
    
    if (progress < 0.25) {
      px = m + (w - m * 2) * progress * 4;
      py = m + zigzag;
    } else if (progress < 0.5) {
      px = w - m + zigzag;
      py = m + (h - m * 2) * (progress - 0.25) * 4;
    } else if (progress < 0.75) {
      px = w - m - (w - m * 2) * (progress - 0.5) * 4;
      py = h - m - zigzag;
    } else {
      px = m - zigzag;
      py = h - m - (h - m * 2) * (progress - 0.75) * 4;
    }
    
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  
  // Inner geometric pattern
  const innerM = m + 16;
  ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.5);
  ctx.lineWidth = 1;
  
  // Create triangular pattern
  const triangleSize = 14;
  const triHeight = triangleSize * Math.sqrt(3) / 2;
  
  // Top border triangles
  for (let x = innerM + 10; x < w - innerM - 10; x += triangleSize) {
    const isUp = Math.floor(x / triangleSize) % 2 === 0;
    ctx.beginPath();
    if (isUp) {
      ctx.moveTo(x, innerM);
      ctx.lineTo(x + triangleSize / 2, innerM + triHeight);
      ctx.lineTo(x - triangleSize / 2, innerM + triHeight);
    } else {
      ctx.moveTo(x, innerM + triHeight);
      ctx.lineTo(x + triangleSize / 2, innerM);
      ctx.lineTo(x - triangleSize / 2, innerM);
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  // Bottom border triangles
  for (let x = innerM + 10; x < w - innerM - 10; x += triangleSize) {
    const isUp = Math.floor(x / triangleSize) % 2 === 0;
    ctx.beginPath();
    if (isUp) {
      ctx.moveTo(x, h - innerM - triHeight);
      ctx.lineTo(x + triangleSize / 2, h - innerM);
      ctx.lineTo(x - triangleSize / 2, h - innerM);
    } else {
      ctx.moveTo(x, h - innerM);
      ctx.lineTo(x + triangleSize / 2, h - innerM - triHeight);
      ctx.lineTo(x - triangleSize / 2, h - innerM - triHeight);
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  // Left/Right border triangles
  for (let y = innerM + 10; y < h - innerM - 10; y += triangleSize) {
    const isRight = Math.floor(y / triangleSize) % 2 === 0;
    
    // Left side
    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(innerM, y);
      ctx.lineTo(innerM + triHeight, y + triangleSize / 2);
      ctx.lineTo(innerM + triHeight, y - triangleSize / 2);
    } else {
      ctx.moveTo(innerM + triHeight, y);
      ctx.lineTo(innerM, y + triangleSize / 2);
      ctx.lineTo(innerM, y - triangleSize / 2);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Right side
    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(w - innerM, y);
      ctx.lineTo(w - innerM - triHeight, y + triangleSize / 2);
      ctx.lineTo(w - innerM - triHeight, y - triangleSize / 2);
    } else {
      ctx.moveTo(w - innerM - triHeight, y);
      ctx.lineTo(w - innerM, y + triangleSize / 2);
      ctx.lineTo(w - innerM, y - triangleSize / 2);
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  // Mandala corner pieces
  drawMandalaCorners(ctx, options, m + 30, w, h);
}

// ========== ORIENTAL FRAME - Moroccan Palace ==========
function drawOrientalFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 20;
  
  // Thick outer border
  ctx.strokeStyle = options.primaryColor;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, m, m, w - m * 2, h - m * 2, 2);
  ctx.stroke();
  
  // Complex geometric lattice
  const latticeM = m + 14;
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(latticeM, latticeM, w - latticeM * 2, h - latticeM * 2);
  ctx.clip();
  
  // Diamond lattice pattern
  const diamondSize = 16;
  const diamondHeight = diamondSize * Math.sqrt(2);
  
  ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.4);
  ctx.lineWidth = 0.5;
  
  for (let x = latticeM; x < w - latticeM; x += diamondSize) {
    for (let y = latticeM; y < h - latticeM; y += diamondHeight) {
      const offsetX = (Math.floor(y / diamondHeight) % 2) * (diamondSize / 2);
      
      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(x + offsetX, y + diamondHeight / 2);
      ctx.lineTo(x + offsetX + diamondSize / 2, y);
      ctx.lineTo(x + offsetX + diamondSize, y + diamondHeight / 2);
      ctx.lineTo(x + offsetX + diamondSize / 2, y + diamondHeight);
      ctx.closePath();
      ctx.stroke();
      
      // Inner cross
      ctx.beginPath();
      ctx.moveTo(x + offsetX + diamondSize / 2, y + diamondHeight / 4);
      ctx.lineTo(x + offsetX + diamondSize / 2, y + diamondHeight * 3 / 4);
      ctx.moveTo(x + offsetX + diamondSize / 4, y + diamondHeight / 2);
      ctx.lineTo(x + offsetX + diamondSize * 3 / 4, y + diamondHeight / 2);
      ctx.stroke();
      
      // Small dot in center
      ctx.fillStyle = hexToRgba(options.primaryColor, 0.3);
      ctx.beginPath();
      ctx.arc(x + offsetX + diamondSize / 2, y + diamondHeight / 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
  
  // Border over lattice
  ctx.strokeStyle = hexToRgba(options.primaryColor, 0.6);
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, latticeM, latticeM, w - latticeM * 2, h - latticeM * 2, 1);
  ctx.stroke();
  
  // 8-pointed star corners
  const corners = [
    { x: m + 22, y: m + 22 },
    { x: w - m - 22, y: m + 22 },
    { x: m + 22, y: h - m - 22 },
    { x: w - m - 22, y: h - m - 22 }
  ];
  
  corners.forEach(({ x, y }) => {
    drawEightPointStar(ctx, x, y, 16, options.primaryColor, options.secondaryColor);
    
    // Surrounding small stars
    drawEightPointStar(ctx, x + 12, y - 8, 6, options.secondaryColor, options.primaryColor);
    drawEightPointStar(ctx, x - 8, y + 10, 7, hexToRgba(options.primaryColor, 0.6), hexToRgba(options.secondaryColor, 0.6));
  });
  
  // Border arches
  drawMoorishArches(ctx, options, m + 40, w, h);
}

// ========== ART DECO FRAME - Gatsby Luxury ==========
function drawArtDecoFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 18;
  
  // Bold outer border
  ctx.strokeStyle = options.primaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  
  // Stepped inner borders (classic Art Deco)
  for (let i = 1; i <= 3; i++) {
    const step = m + i * 8;
    ctx.strokeStyle = i === 3 ? options.secondaryColor : hexToRgba(options.primaryColor, 0.4 - i * 0.1);
    ctx.lineWidth = i === 3 ? 2 : 1;
    ctx.strokeRect(step, step, w - step * 2, h - step * 2);
  }
  
  // Fan/sunburst corner pieces
  const corners = [
    { x: m + 24, y: m + 24, angles: [0, Math.PI / 2] },
    { x: w - m - 24, y: m + 24, angles: [Math.PI / 2, Math.PI] },
    { x: m + 24, y: h - m - 24, angles: [-Math.PI / 2, 0] },
    { x: w - m - 24, y: h - m - 24, angles: [Math.PI, -Math.PI / 2] }
  ];
  
  corners.forEach(({ x, y, angles }) => {
    // Concentric fan rays
    const rayLengths = [30, 25, 20];
    const rayCounts = [12, 8, 5];
    
    rayLengths.forEach((length, layerIndex) => {
      ctx.strokeStyle = hexToRgba(
        layerIndex === 0 ? options.primaryColor : options.secondaryColor,
        0.8 - layerIndex * 0.3
      );
      ctx.lineWidth = 2 - layerIndex * 0.5;
      
      angles.forEach(baseAngle => {
        for (let i = 0; i < rayCounts[layerIndex]; i++) {
          const spread = Math.PI / 4;
          const angle = baseAngle + (i - (rayCounts[layerIndex] - 1) / 2) * (spread / (rayCounts[layerIndex] - 1));
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(angle) * length,
            y + Math.sin(angle) * length
          );
          ctx.stroke();
        }
      });
    });
    
    // Central medallion
    ctx.fillStyle = options.secondaryColor;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = options.primaryColor;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer ring
    ctx.strokeStyle = options.primaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  });
  
  // Decorative vertical line groups
  drawArtDecoLineGroups(ctx, options, m + 40, w, h);
}

// ========== MINIMAL FRAME - Refined Elegance ==========
function drawMinimalFrame(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  w: number, h: number
) {
  const m = 24;
  
  // Subtle shadow for depth
  ctx.save();
  ctx.shadowColor = hexToRgba(options.primaryColor, 0.15);
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 6;
  
  // Single refined border
  ctx.strokeStyle = options.primaryColor;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, m, m, w - m * 2, h - m * 2, 12);
  ctx.stroke();
  ctx.restore();
  
  // Corner accent lines with graduated lengths
  const corners = [
    { x: m, y: m, dx: 1, dy: 1 },
    { x: w - m, y: m, dx: -1, dy: 1 },
    { x: m, y: h - m, dx: 1, dy: -1 },
    { x: w - m, y: h - m, dx: -1, dy: -1 }
  ];
  
  const lineLengths = [40, 25, 15];
  
  corners.forEach(({ x, y, dx, dy }) => {
    lineLengths.forEach((length, index) => {
      ctx.strokeStyle = index === 0 ? options.primaryColor : hexToRgba(options.secondaryColor, 0.5 - index * 0.15);
      ctx.lineWidth = 2 - index * 0.5;
      
      const offset = index * 5;
      
      ctx.beginPath();
      ctx.moveTo(x + dx * offset, y + dy * offset);
      ctx.lineTo(x + dx * (length + offset), y + dy * offset);
      ctx.moveTo(x + dx * offset, y + dy * offset);
      ctx.lineTo(x + dx * offset, y + dy * (length + offset));
      ctx.stroke();
    });
    
    // Elegant dot at intersection
    ctx.fillStyle = options.primaryColor;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle secondary dot
    ctx.fillStyle = hexToRgba(options.secondaryColor, 0.5);
    ctx.beginPath();
    ctx.arc(x + dx * 18, y + dy * 18, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Center marks on each side
  const midPoints = [
    { x: w / 2, y: m, dx: 0, dy: 1 },
    { x: w / 2, y: h - m, dx: 0, dy: -1 },
    { x: m, y: h / 2, dx: 1, dy: 0 },
    { x: w - m, y: h / 2, dx: -1, dy: 0 }
  ];
  
  midPoints.forEach(({ x, y, dx, dy }) => {
    ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * 12, y + dy * 12);
    ctx.stroke();
    
    ctx.fillStyle = hexToRgba(options.primaryColor, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ========== HELPER FUNCTIONS ==========

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  rotation: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRose(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  color1: string,
  color2: string
) {
  // Outer petals
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const px = x + Math.cos(angle) * size * 0.5;
    const py = y + Math.sin(angle) * size * 0.5;
    
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Inner petals
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
    const px = x + Math.cos(angle) * size * 0.25;
    const py = y + Math.sin(angle) * size * 0.25;
    
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Center
  ctx.fillStyle = color1;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawEightPointStar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  color1: string,
  color2: string
) {
  ctx.fillStyle = color1;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const radius = i % 2 === 0 ? size : size * 0.4;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  
  // Center
  ctx.fillStyle = color2;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBorderMotifs(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  offset: number,
  w: number, h: number,
  size: number
) {
  const spacing = 35;
  
  // Top and bottom
  for (let x = offset; x < w - offset; x += spacing) {
    // Diamond motif
    ctx.strokeStyle = options.secondaryColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, offset - 10);
    ctx.lineTo(x + 5, offset - 5);
    ctx.lineTo(x, offset);
    ctx.lineTo(x - 5, offset - 5);
    ctx.closePath();
    ctx.stroke();
    
    // Bottom
    ctx.beginPath();
    ctx.moveTo(x, h - offset + 10);
    ctx.lineTo(x + 5, h - offset + 5);
    ctx.lineTo(x, h - offset);
    ctx.lineTo(x - 5, h - offset + 5);
    ctx.closePath();
    ctx.stroke();
  }
  
  // Left and right
  for (let y = offset; y < h - offset; y += spacing) {
    ctx.strokeStyle = options.secondaryColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(offset - 10, y);
    ctx.lineTo(offset - 5, y + 5);
    ctx.lineTo(offset, y);
    ctx.lineTo(offset - 5, y - 5);
    ctx.closePath();
    ctx.stroke();
    
    // Right
    ctx.beginPath();
    ctx.moveTo(w - offset + 10, y);
    ctx.lineTo(w - offset + 5, y + 5);
    ctx.lineTo(w - offset, y);
    ctx.lineTo(w - offset + 5, y - 5);
    ctx.closePath();
    ctx.stroke();
  }
}

function drawFloatingAccents(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  offset: number,
  w: number, h: number
) {
  const spacing = 40;
  
  ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.3);
  ctx.lineWidth = 0.8;
  
  // Top and bottom
  for (let x = offset; x < w - offset; x += spacing) {
    ctx.beginPath();
    ctx.arc(x, offset - 5, 3, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, h - offset + 5, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Left and right
  for (let y = offset; y < h - offset; y += spacing) {
    ctx.beginPath();
    ctx.arc(offset - 5, y, 3, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(w - offset + 5, y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBeadPattern(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  offset: number,
  w: number, h: number
) {
  const beadSpacing = 8;
  
  // Top beads
  for (let x = offset + 5; x < w - offset - 5; x += beadSpacing) {
    ctx.fillStyle = options.secondaryColor;
    ctx.beginPath();
    ctx.arc(x, offset, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x, h - offset, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Side beads
  for (let y = offset + 5; y < h - offset - 5; y += beadSpacing) {
    ctx.fillStyle = options.secondaryColor;
    ctx.beginPath();
    ctx.arc(offset, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(w - offset, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFiligreePattern(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  offset: number,
  w: number, h: number
) {
  const spacing = 45;
  
  ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.3);
  ctx.lineWidth = 0.8;
  
  // Top and bottom filigree
  for (let x = offset; x < w - offset; x += spacing) {
    // S-curve
    ctx.beginPath();
    ctx.moveTo(x, offset - 15);
    ctx.quadraticCurveTo(x + 8, offset - 8, x, offset);
    ctx.quadraticCurveTo(x - 8, offset + 8, x, offset + 15);
    ctx.stroke();
    
    // Bottom
    ctx.beginPath();
    ctx.moveTo(x, h - offset + 15);
    ctx.quadraticCurveTo(x + 8, h - offset + 8, x, h - offset);
    ctx.quadraticCurveTo(x - 8, h - offset - 8, x, h - offset - 15);
    ctx.stroke();
  }
}

function drawMandalaCorners(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  offset: number,
  w: number, h: number
) {
  const corners = [
    { x: offset, y: offset },
    { x: w - offset, y: offset },
    { x: offset, y: h - offset },
    { x: w - offset, y: h - offset }
  ];
  
  corners.forEach(({ x, y }) => {
    // Concentric rings
    for (let r = 8; r <= 24; r += 8) {
      ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.4);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Radiating lines
    ctx.strokeStyle = hexToRgba(options.primaryColor, 0.3);
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * 20,
        y + Math.sin(angle) * 20
      );
      ctx.stroke();
    }
    
    // Center
    ctx.fillStyle = options.primaryColor;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMoorishArches(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  offset: number,
  w: number, h: number
) {
  const archWidth = 30;
  const spacing = 40;
  
  ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.4);
  ctx.lineWidth = 1;
  
  // Top arches
  for (let x = offset; x < w - offset - archWidth; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, offset);
    ctx.quadraticCurveTo(x + archWidth / 2, offset - 12, x + archWidth, offset);
    ctx.stroke();
    
    // Bottom
    ctx.beginPath();
    ctx.moveTo(x, h - offset);
    ctx.quadraticCurveTo(x + archWidth / 2, h - offset + 12, x + archWidth, h - offset);
    ctx.stroke();
  }
  
  // Side arches
  for (let y = offset; y < h - offset - archWidth; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(offset, y);
    ctx.quadraticCurveTo(offset - 12, y + archWidth / 2, offset, y + archWidth);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(w - offset, y);
    ctx.quadraticCurveTo(w - offset + 12, y + archWidth / 2, w - offset, y + archWidth);
    ctx.stroke();
  }
}

function drawArtDecoLineGroups(
  ctx: CanvasRenderingContext2D,
  options: FrameOptions,
  offset: number,
  w: number, h: number
) {
  const groupWidth = 30;
  const spacing = 50;
  
  // Top line groups
  for (let x = offset; x < w - offset - groupWidth; x += spacing) {
    ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.3);
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 1.5 - i * 0.3;
      ctx.beginPath();
      ctx.moveTo(x + i * 4, offset - 2);
      ctx.lineTo(x + i * 4, offset - 12);
      ctx.stroke();
    }
    
    // Bottom
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 1.5 - i * 0.3;
      ctx.beginPath();
      ctx.moveTo(x + i * 4, h - offset + 2);
      ctx.lineTo(x + i * 4, h - offset + 12);
      ctx.stroke();
    }
  }
  
  // Side line groups
  for (let y = offset; y < h - offset - groupWidth; y += spacing) {
    ctx.strokeStyle = hexToRgba(options.secondaryColor, 0.3);
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 1.5 - i * 0.3;
      ctx.beginPath();
      ctx.moveTo(offset - 2, y + i * 4);
      ctx.lineTo(offset - 12, y + i * 4);
      ctx.stroke();
    }
    
    // Right
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 1.5 - i * 0.3;
      ctx.beginPath();
      ctx.moveTo(w - offset + 2, y + i * 4);
      ctx.lineTo(w - offset + 12, y + i * 4);
      ctx.stroke();
    }
  }
}

// ========== UTILITY FUNCTIONS ==========

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}