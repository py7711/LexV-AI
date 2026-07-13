"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, ChevronDown, Trash2, X } from "lucide-react";
import { getDictionary, localizedPath, type Locale } from "@/lib/i18n";

type ResourceJob = {
  id: string;
  fileName: string | null;
  sourceUrl: string | null;
  sourceType: string;
  durationSec: number | null;
  status: string;
  createdAt: string;
};

type MyResourcesTableProps = {
  jobs: ResourceJob[];
  locale: Locale;
};

function durationLabel(durationSec: number | null) {
  if (!durationSec) return "--:--";
  const minutes = Math.floor(durationSec / 60);
  const seconds = Math.floor(durationSec % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function nameOf(job: ResourceJob, fallback: string) {
  return job.fileName ?? job.sourceUrl ?? `${job.sourceType} ${fallback}`;
}

function isFinished(status: string) {
  return ["completed", "success", "done", "finished"].includes(status.toLowerCase());
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (isFinished(normalized)) return "success";
  if (["processing", "running", "pending", "queue", "queued"].includes(normalized)) return "processing";
  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) return "failed";
  return normalized || "success";
}

function resourceIconSrc(sourceType: string) {
  if (sourceType.startsWith("youtube")) return "/devoice-assets/youtube-icon1.webp";
  return "/devoice-assets/audio-icon.svg";
}

const PAGE_SIZES = [10, 20, 50];

export function MyResourcesTable({ jobs: initialJobs, locale }: MyResourcesTableProps) {
  const t = getDictionary(locale).resources;
  const [jobs, setJobs] = useState(initialJobs);
  const [message, setMessage] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [openingId, setOpeningId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ResourceJob | null>(null);
  const sizeMenuRef = useRef<HTMLDivElement | null>(null);

  const visibleJobs = useMemo(() => jobs, [jobs]);
  const pageCount = Math.max(1, Math.ceil(visibleJobs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageJobs = visibleJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const href = (path = "") => localizedPath(locale, path);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!sizeMenuRef.current?.contains(event.target as Node)) {
        setSizeMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function updatePageSize(value: number) {
    setPageSize(value);
    setPage(1);
    setSizeMenuOpen(false);
  }

  function openJob(job: ResourceJob) {
    if (!isFinished(job.status)) return;
    setOpeningId(job.id);
    window.location.href = href(`jobs/${job.id}`);
  }

  async function deleteJob(job: ResourceJob) {
    setMessage("");
    setDeletingId(job.id);
    const response = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    setDeletingId("");

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? t.deleteFailed);
      return;
    }

    setJobs((current) => current.filter((item) => item.id !== job.id));
    setPendingDelete(null);
    if (pageJobs.length === 1 && currentPage > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
    setMessage(t.deleted);
  }

  return (
    <>
      <div className="resourceTable">
        {message ? <p className="formMessage">{message}</p> : null}
        <div className="resourceTableScroll">
          <table className="resourceHistoryTable">
            <thead>
              <tr>
                <th>{t.name}</th>
                <th>{t.uploaded}</th>
                <th>{t.duration}</th>
                <th>{t.status}</th>
                <th>{t.operation}</th>
              </tr>
            </thead>
            {pageJobs.length ? (
              <tbody>
                {pageJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <span className="resourceNameCell">
                        <Image src={resourceIconSrc(job.sourceType)} alt="" width={20} height={20} aria-hidden="true" />
                        <button type="button" disabled={!isFinished(job.status) || openingId === job.id || deletingId === job.id} onClick={() => openJob(job)}>
                          {nameOf(job, t.resourceFallback)}
                        </button>
                      </span>
                    </td>
                    <td>{job.createdAt}</td>
                    <td>{durationLabel(job.durationSec)}</td>
                    <td>
                      <span className={`statusPill statusPill-${statusLabel(job.status)}`}>{statusLabel(job.status)}</span>
                    </td>
                    <td>
                      <span className="resourceActions">
                        <button type="button" disabled={!isFinished(job.status) || openingId === job.id || deletingId === job.id} onClick={() => openJob(job)}>
                          {openingId === job.id ? t.opening : t.open}
                        </button>
                        <button type="button" className="resourceDelete" disabled={deletingId === job.id} onClick={() => setPendingDelete(job)}>
                          <Trash2 size={14} aria-hidden="true" />
                          {deletingId === job.id ? t.deleting : t.delete}
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : null}
          </table>
        </div>
        {!pageJobs.length ? (
          <div className="resourceEmpty">
            <strong>{t.empty}</strong>
          </div>
        ) : null}
      </div>
      <div className="resourcePagination">
        <span>{t.total} {visibleJobs.length}</span>
        <div className="resourcePageSize" ref={sizeMenuRef}>
          <button type="button" className="resourcePageSizeTrigger" aria-haspopup="listbox" aria-expanded={sizeMenuOpen} onClick={() => setSizeMenuOpen((value) => !value)}>
            {pageSize}/page
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {sizeMenuOpen ? (
            <div className="resourcePageSizeMenu" role="listbox" aria-label={t.rowsPerPage}>
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={size === pageSize ? "is-active" : ""}
                  role="option"
                  aria-selected={size === pageSize}
                  onClick={() => updatePageSize(size)}
                >
                  <span>{size}/page</span>
                  {size === pageSize ? <Check size={14} aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" aria-label={t.previousPage} disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
        <strong>{currentPage}</strong>
        <button type="button" aria-label={t.nextPage} disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>›</button>
      </div>
      {pendingDelete ? (
        <div className="resourceConfirmOverlay" role="presentation">
          <section className="resourceConfirmModal" role="dialog" aria-label={t.deleteDialog}>
            <button className="resourceConfirmClose" type="button" onClick={() => setPendingDelete(null)} aria-label={t.close}>
              <X size={16} aria-hidden="true" />
            </button>
            <span className="resourceConfirmIcon">
              <AlertTriangle size={24} aria-hidden="true" />
            </span>
            <h2>{t.deleteDialog}</h2>
            <p>{nameOf(pendingDelete, t.resourceFallback)}</p>
            <div className="resourceConfirmActions">
              <button type="button" onClick={() => setPendingDelete(null)}>
                {t.cancel}
              </button>
              <button className="resourceConfirmDanger" type="button" disabled={deletingId === pendingDelete.id} onClick={() => deleteJob(pendingDelete)}>
                {deletingId === pendingDelete.id ? t.deleting : t.delete}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
