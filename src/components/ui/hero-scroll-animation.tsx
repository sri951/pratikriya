import { motion } from "motion/react";
import { Sparkles, BookOpen, GraduationCap, Users } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const TOOLS = [
  {
    Icon: Sparkles,
    title: "Doubt solver",
    desc: "Step-by-step answers with diagrams and a voice summary.",
    img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=800&auto=format&fit=crop",
  },
  {
    Icon: BookOpen,
    title: "Notes AI",
    desc: "Upload notes, get flashcards, quizzes, and mind maps.",
    img: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800&auto=format&fit=crop",
  },
  {
    Icon: GraduationCap,
    title: "Exam mode",
    desc: "Practice papers generated from your own documents.",
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
  },
  {
    Icon: Users,
    title: "Reverse Teacher",
    desc: "Teach the AI and master concepts by explaining them.",
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
  },
];

export default function HeroScrollAnimation() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3">
            <BrandMark size={44} />
            <span className="font-display text-xl font-semibold tracking-tight">Pratikriya</span>
          </div>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            Learning that responds,{" "}
            <span className="italic text-primary">the moment you wonder.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            One calm place to ask doubts, revise notes, rehearse exams, and teach
            what you've learned.
          </p>
        </motion.div>

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map(({ Icon, title, desc, img }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: "easeOut" }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]"
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                width={400}
                height={220}
                className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="p-4">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-2 font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
