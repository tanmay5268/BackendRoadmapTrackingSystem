"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Phase, ProgressMap } from "@/types/roadmap";
import { phases as phaseData } from "@/lib/roadmap-data";
import ProgressBar from "./ProgressBar";

function getAllTopicIds(phases: Phase[]): string[] {
  const ids: string[] = [];
  for (const phase of phases) {
    for (const section of phase.sections) {
      for (const topic of section.topics) {
        ids.push(topic.id);
        if (topic.subtopics) {
          ids.push(...topic.subtopics.map((_, i) => `${topic.id}-sub-${i}`));
        }
      }
    }
  }
  return ids;
}

function getOrCreateDeviceId(): string {
  const key = "roadmap_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function RoadmapView() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(["phase-1"]));
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [db, setDb] = useState<any>(null);
  const [deviceId, setDeviceId] = useState("");
  const initRef = useRef(false);

  const allTopicIds = useMemo(() => getAllTopicIds(phaseData), []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    import("@/lib/supabase").then(({ createClient }) => {
      const supabase = createClient();
      setDb(supabase);
      supabase
        .from("user_progress")
        .select("topic_id, checked")
        .eq("device_id", id)
        .then(({ data }: any) => {
          if (data) {
            const map: ProgressMap = {};
            for (const row of data) {
              map[row.topic_id] = row.checked;
            }
            setProgress(map);
          }
        });
    });
  }, []);

  const toggleTopic = useCallback(
    async (topicId: string) => {
      if (!db || !deviceId) return;
      const newVal = !progress[topicId];
      setProgress((prev) => ({ ...prev, [topicId]: newVal }));
      setSaving((prev) => new Set(prev).add(topicId));

      await db.from("user_progress").upsert(
        {
          device_id: deviceId,
          topic_id: topicId,
          checked: newVal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id,topic_id" }
      );

      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(topicId);
        return next;
      });
    },
    [progress, deviceId, db]
  );

  const calcProgress = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return 0;
      let checked = 0;
      for (const id of ids) {
        if (progress[id]) checked++;
      }
      return checked / ids.length;
    },
    [progress]
  );

  const overallProgress = calcProgress(allTopicIds);

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      {/* Overall progress */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-2xl font-bold">{Math.round(overallProgress * 100)}%</span>
        </div>
        <div className="mt-2">
          <ProgressBar value={overallProgress} />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {Object.values(progress).filter(Boolean).length} of {allTopicIds.length} topics
        </p>
      </div>

      {/* Phases */}
      {phaseData.map((phase) => {
        const phaseTopicIds: string[] = [];
        for (const section of phase.sections) {
          for (const topic of section.topics) {
            phaseTopicIds.push(topic.id);
            if (topic.subtopics) {
              phaseTopicIds.push(...topic.subtopics.map((_, i) => `${topic.id}-sub-${i}`));
            }
          }
        }
        const phaseProgress = calcProgress(phaseTopicIds);
        const isExpanded = expandedPhases.has(phase.id);

        return (
          <div key={phase.id} className="mb-4 rounded-lg border border-gray-200">
            {/* Phase header */}
            <button
              onClick={() => togglePhase(phase.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                    phaseProgress === 1
                      ? "bg-green-600"
                      : phaseProgress > 0
                        ? "bg-gray-700"
                        : "bg-gray-300"
                  }`}
                >
                  {phase.number}
                </span>
                <div>
                  <h2 className="font-semibold">
                    Phase {phase.number}: {phase.title}
                  </h2>
                  <p className="text-xs text-gray-400">{phase.weeks} · {phase.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 text-right text-sm font-medium">
                  {Math.round(phaseProgress * 100)}%
                </span>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Phase content */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-5 py-4">
                {/* Sections */}
                {phase.sections.map((section) => {
                  const sectionTopicIds: string[] = [];
                  for (const topic of section.topics) {
                    sectionTopicIds.push(topic.id);
                    if (topic.subtopics) {
                      sectionTopicIds.push(
                        ...topic.subtopics.map((_, i) => `${topic.id}-sub-${i}`)
                      );
                    }
                  }
                  const sectionProgress = calcProgress(sectionTopicIds);

                  return (
                    <div key={section.id} className="mb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          {section.title}
                        </span>
                        <span className="text-xs text-gray-300">
                          ({Math.round(sectionProgress * 100)}%)
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {section.topics.map((topic) => (
                          <div key={topic.id}>
                            <label className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={!!progress[topic.id]}
                                onChange={() => toggleTopic(topic.id)}
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                              <span
                                className={`text-sm ${
                                  progress[topic.id] ? "text-gray-400 line-through" : ""
                                }`}
                              >
                                {topic.label}
                              </span>
                              {saving.has(topic.id) && (
                                <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
                              )}
                            </label>

                            {/* Subtopics */}
                            {topic.subtopics && topic.subtopics.length > 0 && (
                              <div className="ml-7 border-l border-gray-100 pl-4">
                                {topic.subtopics.map((sub, i) => {
                                  const subId = `${topic.id}-sub-${i}`;
                                  return (
                                    <label
                                      key={subId}
                                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={!!progress[subId]}
                                        onChange={() => toggleTopic(subId)}
                                        className="h-3 w-3 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                      />
                                      <span
                                        className={`text-xs ${
                                          progress[subId] ? "text-gray-300 line-through" : "text-gray-500"
                                        }`}
                                      >
                                        {sub}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Projects */}
                {phase.projects.length > 0 && (
                  <div className="mb-4 mt-6">
                    <h3 className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Projects
                    </h3>
                    <div className="space-y-3">
                      {phase.projects.map((project) => (
                        <div key={project.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                          <h4 className="text-sm font-medium">{project.title}</h4>
                          <p className="mt-0.5 text-xs text-gray-500">{project.description}</p>
                          {project.requirements.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {project.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                                  <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-300" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkpoint */}
                {phase.checkpoint && phase.checkpoint.length > 0 && (
                  <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-3">
                    <h3 className="text-xs font-medium text-amber-700 uppercase tracking-wider">
                      Mentorship Checkpoint
                    </h3>
                    <p className="mt-1 text-xs text-amber-600">
                      Answer these questions before moving to the next phase:
                    </p>
                    <ol className="mt-2 list-inside list-decimal space-y-1">
                      {phase.checkpoint.map((q, i) => (
                        <li key={i} className="text-xs text-amber-700">{q}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
