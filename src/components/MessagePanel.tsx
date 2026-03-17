"use client";

import { useState } from "react";
import { landingPoints } from "@/data/landingPoints";
import { LandingPoint } from "@/lib/types";

interface MessagePanelProps {
  isAnimating: boolean;
  animationStatus: "idle" | "sending" | "delivered";
  onSend: (originId: string, destId: string, message: string) => void;
  onReset: () => void;
}

const malaysianPoints = landingPoints.filter((p) => p.country === "Malaysia");
const allPoints = landingPoints;

export default function MessagePanel({
  isAnimating,
  animationStatus,
  onSend,
  onReset,
}: MessagePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [message, setMessage] = useState("");

  const destinationPoints = allPoints.filter((p) => p.id !== originId);

  const canSend =
    originId && destId && message.trim().length > 0 && !isAnimating;

  const handleSend = () => {
    if (!canSend) return;
    onSend(originId, destId, message.trim());
  };

  const handleReset = () => {
    setMessage("");
    setOriginId("");
    setDestId("");
    onReset();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute left-6 top-24 z-10 w-[52px] h-[52px] flex items-center justify-center bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-xl active:bg-white/5 transition-all hover:border-[#2362DD]/40 shadow-[0_0_20px_rgba(35,98,221,0.1)]"
        title="Send Message"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#60A5FA"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="absolute left-6 top-24 z-10 w-[300px] bg-[#0A0E1A]/92 backdrop-blur-xl border border-[#2362DD]/20 rounded-xl shadow-[0_0_40px_rgba(35,98,221,0.15)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          <span className="text-[10px] font-bold tracking-[0.15em] text-[#60A5FA] uppercase">
            Send Message
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-white/5 text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Origin */}
        <div>
          <label className="block text-[10px] tracking-wider text-[#94A3B8] mb-1.5 uppercase">
            From (Malaysia)
          </label>
          <select
            value={originId}
            onChange={(e) => {
              setOriginId(e.target.value);
              if (e.target.value === destId) setDestId("");
            }}
            disabled={isAnimating}
            className="w-full bg-[#1A1F35] border border-[#2362DD]/15 rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] min-h-[44px] outline-none focus:border-[#2362DD]/40 transition-colors disabled:opacity-40"
          >
            <option value="">Select origin...</option>
            {malaysianPoints.map((p) => (
              <option key={p.id} value={p.id}>
                {p.city}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-[10px] tracking-wider text-[#94A3B8] mb-1.5 uppercase">
            To (Destination)
          </label>
          <select
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            disabled={isAnimating || !originId}
            className="w-full bg-[#1A1F35] border border-[#2362DD]/15 rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] min-h-[44px] outline-none focus:border-[#2362DD]/40 transition-colors disabled:opacity-40"
          >
            <option value="">Select destination...</option>
            {destinationPoints.map((p) => (
              <option key={p.id} value={p.id}>
                {p.city}, {p.country}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-[10px] tracking-wider text-[#94A3B8] mb-1.5 uppercase">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, 280))
            }
            disabled={isAnimating}
            placeholder="Type your message..."
            rows={3}
            className="w-full bg-[#1A1F35] border border-[#2362DD]/15 rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] outline-none focus:border-[#2362DD]/40 transition-colors resize-none disabled:opacity-40 placeholder:text-[#475569]"
          />
          <div className="text-right text-[10px] text-[#475569] mt-0.5">
            {message.length}/280
          </div>
        </div>

        {/* Status */}
        {animationStatus === "sending" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#2362DD]/10 border border-[#2362DD]/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#60A5FA] animate-pulse" />
            <span className="text-[11px] text-[#60A5FA]">
              Transmitting via submarine cable...
            </span>
          </div>
        )}

        {animationStatus === "delivered" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#059669]/10 border border-[#059669]/20 rounded-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span className="text-[11px] text-[#34D399]">
              Message delivered!
            </span>
          </div>
        )}

        {/* Send / Reset buttons */}
        {animationStatus === "delivered" ? (
          <button
            onClick={handleReset}
            className="w-full min-h-[48px] rounded-lg text-[11px] font-semibold tracking-wider transition-all bg-[#1A1F35] border border-[#2362DD]/20 text-[#94A3B8] active:bg-white/5"
          >
            SEND ANOTHER
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`w-full min-h-[48px] rounded-lg text-[11px] font-semibold tracking-wider transition-all ${
              canSend
                ? "bg-[#2362DD] text-white active:bg-[#1C4FB8] shadow-[0_0_20px_rgba(35,98,221,0.3)]"
                : "bg-[#1A1F35]/50 text-[#475569] cursor-not-allowed"
            }`}
          >
            {isAnimating ? "SENDING..." : "SEND MESSAGE"}
          </button>
        )}
      </div>
    </div>
  );
}
