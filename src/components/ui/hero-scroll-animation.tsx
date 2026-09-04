import { useScroll, useTransform, motion, type MotionValue } from "motion/react";
import { forwardRef, useRef } from "react";
import { ArrowDown, Brain, GraduationCap, Sparkles, Fingerprint, BookOpen, Users } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

interface SectionProps {
  scrollYProgress: MotionValue;
}

/** First sticky panel: brand statement that scales/rotates away on scroll. */
const Section1: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -4]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.4]);

  return (
    <motion.section
      style={{ scale, rotate, opacity }}
      className="sticky top-0 flex h-screen flex-col items-center justify-center gap-6 bg-[image:var(--gradient-hero)] px-6 text-center"
    >
      <div className="flex items-center gap-3">
        <BrandMark size={56} />
        <span className="font-display text-2xl font-semibold tracking-tight">Pratikriya</span>
      </div>
      <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
        Learning that responds, <br />
        <span className="italic text-primary">the moment you wonder.</span>
      </h2>
      <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
        One calm place to ask doubts, revise notes, rehearse exams, and teach
        what you've learned. Scroll to see the toolkit.
      </p>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        Scroll please
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </motion.span>
      </div>
    </motion.section>
  );
};

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

/** Second sticky panel: tool showcase that scales up into place on scroll. */
const Section2: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [4, 0]);

  return (
    <motion.section
      style={{ scale, rotate }}
      className="relative flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6 py-20"
    >
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Everything in one place
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Four tools, one gentle tutor
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Each tool is built on the same idea: fast feedback, calmly delivered.
        </p>
      </div>

      <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map(({ Icon, title, desc, img }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
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
    </motion.section>
  );
};

const HeroScrollAnimation = forwardRef<HTMLElement>(function HeroScrollAnimation(_props, _ref) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={container} className="relative h-[200vh]">
      <Section1 scrollYProgress={scrollYProgress} />
      <Section2 scrollYProgress={scrollYProgress} />
    </div>
  );
});

export default HeroScrollAnimation;
