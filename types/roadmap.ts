export type Topic = {
  id: string;
  label: string;
  subtopics?: string[];
};

export type Section = {
  id: string;
  title: string;
  topics: Topic[];
};

export type Project = {
  id: string;
  title: string;
  description: string;
  requirements: string[];
};

export type Phase = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  weeks: string;
  sections: Section[];
  projects: Project[];
  checkpoint?: string[];
};

export type ProgressMap = Record<string, boolean>;
