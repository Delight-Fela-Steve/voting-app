"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button, Card } from "@/components/ui";

type QRCodePanelProps = {
  title: string;
  url: string;
  downloadFileName?: string;
};

export function QRCodePanel({
  title,
  url,
  downloadFileName = "qr-code.png",
}: QRCodePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = downloadFileName;
    link.href = dataUrl;
    link.click();
  }

  return (
    <Card className="flex flex-col items-center gap-4 p-6">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <div className="rounded-xl bg-white p-3">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={200}
          level="M"
          includeMargin
        />
      </div>
      <p className="max-w-xs break-all text-center text-xs text-text-muted">
        {url}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost">Open page</Button>
        </a>
        <Button type="button" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy link"}
        </Button>
        <Button type="button" variant="ghost" onClick={handleDownload}>
          Download QR
        </Button>
      </div>
    </Card>
  );
}
