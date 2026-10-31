import { BookOpenCheck, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

export const homeHighlights = [
  { icon: BookOpenCheck, title: "Strong Academic Foundation", description: "A focus area pending confirmation of the school’s approved academic messaging." },
  { icon: Sparkles, title: "Holistic Child Development", description: "A focus area pending confirmation of the school’s approved learner-development messaging." },
  { icon: ShieldCheck, title: "Safe and Supportive Environment", description: "A focus area pending confirmation of the school’s approved care and wellbeing information." },
  { icon: HeartHandshake, title: "Self-Reliant and Confident Learners", description: "A focus area pending confirmation of the school’s approved values language." },
] as const;

export const developmentNews = [
  { title: "School news placeholder", summary: "Development placeholder — no article or announcement has been published here.", href: "/news" },
  { title: "School event placeholder", summary: "Development placeholder — event details and dates are awaiting verified school content.", href: "/news" },
  { title: "Community update placeholder", summary: "Development placeholder — this card will be replaced by a genuine published update.", href: "/news" },
] as const;
