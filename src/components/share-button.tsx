"use client";

import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    setMessage("");
    try {
      const url = window.location.href;
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Copy the link from your browser’s address bar.");
    }
  }
  return <div><button type="button" onClick={share} className="rounded-lg border border-teal-700 px-4 py-2 font-medium text-teal-700">Share article</button><p role="status" className="mt-2 text-sm text-slate-600">{message}</p></div>;
}
