"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { QrCode, Download, Copy, CheckCircle, Info, ExternalLink, Palette, Loader2, ChevronDown, ChevronRight, Crown, ArrowRight, Lock } from "lucide-react";
import { generateFramedQR, getFrameStyles, type FrameStyle } from "../../lib/qrFrameGenerator";
import "./qr.css";

interface QRTabProps {
  planInfo: any;
  isProOrAbove: boolean;
  getAccessToken: () => string | null;
  addToast: (type: "success" | "error" | "info", message: string, action?: { label: string; href: string }) => void;
  navigateToMembership: () => void;
  API_URL: string;
  user: any;
}

export default function QRTab({
  planInfo,
  isProOrAbove,
  getAccessToken,
  addToast,
  navigateToMembership,
  API_URL,
  user,
}: QRTabProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrMenuUrl, setQrMenuUrl] = useState<string>("");
  const [loadingQR, setLoadingQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrFgColor, setQrFgColor] = useState("#1A1510");
  const [qrBgColor, setQrBgColor] = useState("#FFFFFF");
  const [qrIncludeLogo, setQrIncludeLogo] = useState(false);
  const [qrLogoSize, setQrLogoSize] = useState(36);
  const [qrCustomized, setQrCustomized] = useState(false);

  const [selectedFrameStyle, setSelectedFrameStyle] = useState<FrameStyle>("classic");
  const [framePrimaryColor, setFramePrimaryColor] = useState("#C45E3A");
  const [frameSecondaryColor, setFrameSecondaryColor] = useState("#D4C9B5");
  const [frameBackgroundColor, setFrameBackgroundColor] = useState("#FFFFFF");
  const [framedQRData, setFramedQRData] = useState<string | null>(null);
  const [generatingFrame, setGeneratingFrame] = useState(false);
  const [showFrameOptions, setShowFrameOptions] = useState(false);

  const initialLoadDone = useRef(false);
  const previousUserId = useRef<string | null>(null);

  // Save QR state to localStorage per user
  const saveToStorage = useCallback(() => {
    if (!user?.id) return;
    const key = `qr_state_${user.id}`;
    const state = {
      qrCodeData,
      qrMenuUrl,
      qrCustomized,
      qrFgColor,
      qrBgColor,
      qrIncludeLogo,
      qrLogoSize,
      selectedFrameStyle,
      framePrimaryColor,
      frameSecondaryColor,
      frameBackgroundColor,
      framedQRData,
    };
    localStorage.setItem(key, JSON.stringify(state));
  }, [user?.id, qrCodeData, qrMenuUrl, qrCustomized, qrFgColor, qrBgColor, qrIncludeLogo, qrLogoSize, selectedFrameStyle, framePrimaryColor, frameSecondaryColor, frameBackgroundColor, framedQRData]);

  // Load QR state from localStorage for current user
  const loadFromStorage = useCallback(() => {
    if (!user?.id) return null;
    const key = `qr_state_${user.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch { return null; }
    }
    return null;
  }, [user?.id]);

  // Auto-save whenever QR state changes
  useEffect(() => {
    if (initialLoadDone.current && qrCodeData) {
      saveToStorage();
    }
  }, [qrCodeData, qrCustomized, framedQRData, selectedFrameStyle]);

  // Generate fresh QR from backend
  const generateQR = useCallback(async () => {
    setLoadingQR(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/qr/generate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQrCodeData(data.qrCode);
        setQrMenuUrl(data.menuUrl);
        setQrCustomized(false);
        setFramedQRData(null);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingQR(false); }
  }, [getAccessToken, API_URL]);

  // Initialize on mount or when user changes
  useEffect(() => {
    const currentUserId = user?.id || null;
    const userChanged = previousUserId.current !== null && previousUserId.current !== currentUserId;
    
    if (userChanged) {
      // Different user logged in - reset
      initialLoadDone.current = false;
      setQrCodeData(null);
      setQrMenuUrl("");
      setQrCustomized(false);
      setFramedQRData(null);
    }
    
    previousUserId.current = currentUserId;

    if (!initialLoadDone.current) {
      // First load for this user - try to restore from storage
      const saved = loadFromStorage();
      
      if (saved && saved.qrCodeData) {
        setQrCodeData(saved.qrCodeData);
        setQrMenuUrl(saved.qrMenuUrl || "");
        setQrCustomized(saved.qrCustomized || false);
        setQrFgColor(saved.qrFgColor || "#1A1510");
        setQrBgColor(saved.qrBgColor || "#FFFFFF");
        setQrIncludeLogo(saved.qrIncludeLogo || false);
        setQrLogoSize(saved.qrLogoSize || 36);
        setSelectedFrameStyle((saved.selectedFrameStyle as FrameStyle) || "classic");
        setFramePrimaryColor(saved.framePrimaryColor || "#C45E3A");
        setFrameSecondaryColor(saved.frameSecondaryColor || "#D4C9B5");
        setFrameBackgroundColor(saved.frameBackgroundColor || "#FFFFFF");
        setFramedQRData(saved.framedQRData || null);
      } else {
        // No saved state - generate new QR
        generateQR();
      }
      
      initialLoadDone.current = true;
    }
  }, [user?.id]);

  const handleGenerateCustomQR = async () => {
    if (!isProOrAbove) {
      addToast("error", "Custom QR design is available on Pro plan and above.", { label: "Upgrade", href: "/membership" });
      return;
    }
    setLoadingQR(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/qr/generate-custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ fgColor: qrFgColor, bgColor: qrBgColor, includeLogo: qrIncludeLogo, logoSize: qrLogoSize }),
      });
      if (response.ok) {
        const data = await response.json();
        setQrCodeData(data.qrCode);
        setQrMenuUrl(data.menuUrl);
        setQrCustomized(true);
        
        if (framedQRData) {
          setGeneratingFrame(true);
          try {
            const framed = await generateFramedQR(data.qrCode, {
              style: selectedFrameStyle,
              primaryColor: framePrimaryColor,
              secondaryColor: frameSecondaryColor,
              backgroundColor: frameBackgroundColor,
              includeLogo: qrIncludeLogo,
              logoSize: qrLogoSize
            });
            setFramedQRData(framed);
          } catch (err) { setFramedQRData(null); }
          setGeneratingFrame(false);
        }
        
        addToast("success", "Custom QR code generated!");
      } else if (response.status === 403) {
        addToast("error", "Custom QR design is available on Pro plan and above.", { label: "Upgrade", href: "/membership" });
      }
    } catch (err) { console.error(err); }
    finally { setLoadingQR(false); }
  };

  const handleGenerateFramedQR = async () => {
    if (!isProOrAbove) {
      addToast("error", "QR frame styles are available on Pro plan and above.", { label: "Upgrade", href: "/membership" });
      return;
    }
    if (!qrCodeData) { addToast("error", "Generate a QR code first"); return; }
    setGeneratingFrame(true);
    try {
      const framed = await generateFramedQR(qrCodeData, {
        style: selectedFrameStyle,
        primaryColor: framePrimaryColor,
        secondaryColor: frameSecondaryColor,
        backgroundColor: frameBackgroundColor,
        includeLogo: qrIncludeLogo,
        logoSize: qrLogoSize
      });
      setFramedQRData(framed);
      addToast("success", "Framed QR code generated!");
    } catch (error) {
      addToast("error", "Failed to generate framed QR");
    } finally { setGeneratingFrame(false); }
  };

  const handleRemoveFrame = () => {
    setFramedQRData(null);
    addToast("info", "Frame removed.");
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrMenuUrl).then(() => {
      setCopied(true);
      addToast("success", "Link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQR = () => {
    const dataToDownload = framedQRData || qrCodeData;
    if (!dataToDownload) return;
    const link = document.createElement("a");
    link.href = dataToDownload;
    link.download = `menu-qr-code${framedQRData ? '-framed' : ''}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("success", "QR downloaded!");
  };

  return (
    <div className="qr-tab">
      <div className="dash-qr-section">
        <div className="dash-qr-card">
          {loadingQR || generatingFrame ? (
            <div className="dash-qr-loading">
              <Loader2 size={40} className="spinning" />
              <p>{generatingFrame ? "Applying frame..." : "Generating QR code..."}</p>
            </div>
          ) : qrCodeData ? (
            <>
              <div className="dash-qr-code">
                <img src={framedQRData || qrCodeData} alt="Menu QR Code" className="dash-qr-image" />
              </div>
              <h2>Your Menu QR Code</h2>
              {qrCustomized && isProOrAbove && <p style={{ fontSize: '11px', color: 'var(--terra)', marginBottom: '4px' }}>Customized</p>}
              {framedQRData && <p style={{ fontSize: '11px', color: 'var(--green)', marginBottom: '4px' }}>Framed with {selectedFrameStyle.charAt(0).toUpperCase() + selectedFrameStyle.slice(1)} style</p>}
              <p className="dash-qr-url">{qrMenuUrl}</p>
              <div className="dash-qr-actions">
                <button className="dash-btn-primary" onClick={handleDownloadQR} type="button"><Download size={16} /> Download</button>
                <button className="dash-btn-secondary" onClick={handleCopyUrl} type="button">
                  {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
                </button>
                {framedQRData && (
                  <button className="dash-btn-secondary" onClick={handleRemoveFrame} type="button" style={{ width: '100%', marginTop: '4px' }}>Remove Frame</button>
                )}
              </div>
              {planInfo.isFree && (
                <p className="dash-qr-upgrade-text"><Info size={14} /><span>Free plan includes EasyMenu branding.</span><Link href="/membership">Upgrade</Link></p>
              )}
            </>
          ) : (
            <div className="dash-qr-empty">
              <QrCode size={48} />
              <h3>Generate QR Code</h3>
              <p>Create a QR code for your menu.</p>
              <button className="dash-btn-primary" onClick={generateQR} type="button"><QrCode size={16} /> Generate</button>
            </div>
          )}
        </div>

        <div className="dash-qr-tips">
          <h3>How to use</h3>
          <ul>
            <li><CheckCircle size={16} /><span>Download and print</span></li>
            <li><CheckCircle size={16} /><span>Place on tables/counters</span></li>
            <li><CheckCircle size={16} /><span>Customers scan with phone</span></li>
            <li><CheckCircle size={16} /><span>Menu opens instantly</span></li>
            <li><CheckCircle size={16} /><span>Update anytime</span></li>
          </ul>
          {qrMenuUrl && (
            <a href={qrMenuUrl} target="_blank" rel="noopener noreferrer" className="dash-qr-preview-link">
              <ExternalLink size={16} /> Preview Menu
            </a>
          )}

          {/* Custom QR Section */}
          <div className="dash-qr-custom-section">
            <h3 className="dash-qr-custom-title">
              <Palette size={14} /> Customize QR
              {!isProOrAbove && <span className="dash-qr-pro-badge">Pro</span>}
            </h3>
            
            {!isProOrAbove ? (
              <div className="dash-qr-locked-section">
                <div className="dash-qr-locked-content">
                  <Lock size={20} />
                  <p>Custom QR colors and logo placement are available on <strong>Pro</strong> plan and above.</p>
                </div>
                <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button" style={{ width: '100%', marginTop: '12px' }}>
                  <Crown size={16} /> Upgrade to Pro <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="dash-qr-custom-grid">
                  <div className="dash-form-group"><label>Foreground</label><input type="color" value={qrFgColor} onChange={(e) => setQrFgColor(e.target.value)} className="dash-color-input" /></div>
                  <div className="dash-form-group"><label>Background</label><input type="color" value={qrBgColor} onChange={(e) => setQrBgColor(e.target.value)} className="dash-color-input" /></div>
                </div>
                <div className="dash-qr-custom-options">
                  <label className="dash-checkbox-label"><input type="checkbox" checked={qrIncludeLogo} onChange={(e) => setQrIncludeLogo(e.target.checked)} /><span>Include logo</span></label>
                  {qrIncludeLogo && (
                    <div className="dash-form-group"><label>Logo Size: {qrLogoSize}px</label><input type="range" min="24" max="64" value={qrLogoSize} onChange={(e) => setQrLogoSize(Number(e.target.value))} className="dash-range-input" /></div>
                  )}
                </div>
                <button className="dash-btn-primary" onClick={handleGenerateCustomQR} type="button" style={{ width: '100%', marginTop: '12px' }}>
                  <Palette size={14} /> {qrCustomized ? 'Update Custom QR' : 'Generate Custom QR'}
                </button>
              </>
            )}
          </div>

          {/* QR Frame Section */}
          <div className="dash-qr-frame-section">
            <h3 
              className="dash-qr-custom-title" 
              onClick={() => isProOrAbove && setShowFrameOptions(!showFrameOptions)} 
              style={{ cursor: isProOrAbove ? 'pointer' : 'default' }}
            >
              <Palette size={14} /> QR Frame Styles
              {isProOrAbove && (
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ink-muted)' }}>
                  {showFrameOptions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
              {!isProOrAbove && <span className="dash-qr-pro-badge">Pro</span>}
            </h3>
            
            {!isProOrAbove ? (
              <div className="dash-qr-locked-section" style={{ marginTop: '12px' }}>
                <div className="dash-qr-locked-content">
                  <Lock size={20} />
                  <p>Beautiful QR frame styles are a <strong>Pro</strong> plan feature. Choose from 8 elegant designs.</p>
                </div>
                <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button" style={{ width: '100%', marginTop: '12px' }}>
                  <Crown size={16} /> Upgrade to Pro <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              showFrameOptions && (
                <div className="dash-qr-frame-options">
                  <div className="dash-qr-frame-grid">
                    {Object.entries(getFrameStyles()).map(([style, info]) => (
                      <div key={style} className={`dash-qr-frame-card ${selectedFrameStyle === style ? 'active' : ''}`} onClick={() => setSelectedFrameStyle(style as FrameStyle)}>
                        <div className="dash-qr-frame-preview">
                          <div className="dash-qr-frame-preview-box" style={{ borderColor: framePrimaryColor, background: frameBackgroundColor }}>
                            <div className="dash-qr-frame-preview-qr"><QrCode size={20} /></div>
                          </div>
                        </div>
                        <div className="dash-qr-frame-info">
                          <span className="dash-qr-frame-name">{info.name}</span>
                          <span className="dash-qr-frame-desc">{info.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dash-qr-frame-colors">
                    <div className="dash-qr-color-row">
                      <div className="dash-form-group"><label>Primary Color</label><input type="color" value={framePrimaryColor} onChange={(e) => setFramePrimaryColor(e.target.value)} className="dash-color-input" /></div>
                      <div className="dash-form-group"><label>Secondary Color</label><input type="color" value={frameSecondaryColor} onChange={(e) => setFrameSecondaryColor(e.target.value)} className="dash-color-input" /></div>
                      <div className="dash-form-group"><label>Background</label><input type="color" value={frameBackgroundColor} onChange={(e) => setFrameBackgroundColor(e.target.value)} className="dash-color-input" /></div>
                    </div>
                  </div>
                  <button className="dash-btn-primary" onClick={handleGenerateFramedQR} disabled={generatingFrame || !qrCodeData} type="button" style={{ width: '100%', marginTop: '16px' }}>
                    {generatingFrame ? <><Loader2 size={16} className="spinning" />Applying Frame...</> : <><QrCode size={16} /> {framedQRData ? 'Update Frame' : 'Generate Framed QR'}</>}
                  </button>
                  {framedQRData && (
                    <button className="dash-btn-secondary" onClick={handleRemoveFrame} type="button" style={{ width: '100%', marginTop: '8px' }}>Remove Frame</button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}