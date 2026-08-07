// Structured misconception library used to ground the AI Detective's investigation.
// Purely static data — safe to import from client and server.

export type MisconceptionGroup = {
  subject: string;
  areas: { area: string; misconceptions: string[] }[];
};

export const MISCONCEPTION_LIBRARY: MisconceptionGroup[] = [
  {
    subject: "Electronics",
    areas: [
      {
        area: "Current & Voltage",
        misconceptions: [
          "Believing current causes voltage rather than the other way round",
          "Confusing electron flow with conventional (hole) current direction",
          "Assuming current is used up as it passes through components",
        ],
      },
      {
        area: "Diodes",
        misconceptions: [
          "Treating forward bias as zero resistance instead of a 0.7 V drop",
          "Thinking reverse bias means no field exists",
          "Confusing avalanche breakdown with device failure",
        ],
      },
      {
        area: "MOSFET",
        misconceptions: [
          "Assuming drain current flows before the threshold voltage is reached",
          "Ignoring that the channel forms from an electric field, not from gate current",
          "Confusing pinch-off with the transistor switching off",
          "Forgetting the body effect raises the threshold voltage",
        ],
      },
    ],
  },
  {
    subject: "Mathematics",
    areas: [
      {
        area: "Calculus",
        misconceptions: [
          "Applying the product rule where the chain rule is needed",
          "Dropping the inner derivative in the chain rule",
          "Forgetting the constant of integration",
          "Evaluating a limit by substitution when the form is indeterminate",
        ],
      },
      {
        area: "Probability",
        misconceptions: [
          "Treating dependent events as independent",
          "Swapping P(A|B) with P(B|A)",
          "Using the wrong denominator in Bayes' theorem",
        ],
      },
      {
        area: "Algebra",
        misconceptions: [
          "Sign errors when distributing a negative",
          "Cancelling terms across a sum instead of a factor",
        ],
      },
    ],
  },
  {
    subject: "Programming",
    areas: [
      {
        area: "Memory",
        misconceptions: [
          "Confusing a pointer with the value it points to",
          "Assuming arrays are copied when passed to a function",
          "Forgetting to free or reassigning before freeing",
        ],
      },
      {
        area: "Control flow",
        misconceptions: [
          "Off-by-one errors in loop bounds",
          "Missing the base case in recursion",
          "Assuming a recursive call returns without unwinding the stack",
        ],
      },
    ],
  },
  {
    subject: "Physics",
    areas: [
      {
        area: "Mechanics",
        misconceptions: [
          "Believing motion requires a continuous force",
          "Confusing mass with weight",
          "Mixing up action-reaction pairs",
        ],
      },
      {
        area: "Units",
        misconceptions: [
          "Skipping unit conversion between prefixes (m, k, M)",
          "Mixing degrees and radians",
        ],
      },
    ],
  },
  {
    subject: "Chemistry",
    areas: [
      {
        area: "Stoichiometry",
        misconceptions: [
          "Using mass ratios where mole ratios are required",
          "Forgetting to balance the equation before calculating",
        ],
      },
      {
        area: "Bonding",
        misconceptions: [
          "Treating electronegativity difference as a hard ionic/covalent cutoff",
          "Confusing intermolecular forces with covalent bonds",
        ],
      },
    ],
  },
  {
    subject: "Biology",
    areas: [
      {
        area: "Genetics",
        misconceptions: [
          "Confusing genotype with phenotype",
          "Assuming dominant alleles are more common",
        ],
      },
    ],
  },
];

export const SUBJECTS = MISCONCEPTION_LIBRARY.map((g) => g.subject);

export function librarySnippet(subject?: string) {
  const groups = subject
    ? MISCONCEPTION_LIBRARY.filter(
        (g) => g.subject.toLowerCase() === subject.trim().toLowerCase(),
      )
    : [];
  const chosen = groups.length > 0 ? groups : MISCONCEPTION_LIBRARY;
  return chosen
    .map(
      (g) =>
        `${g.subject}:\n` +
        g.areas
          .map((a) => `  ${a.area}: ${a.misconceptions.join("; ")}`)
          .join("\n"),
    )
    .join("\n");
}

/** Nine standard investigation suspects the detective always considers. */
export const SUSPECTS = [
  "Forgot the formula",
  "Misread the question",
  "Calculation slip",
  "Conceptual misunderstanding",
  "Guessed",
  "Unit confusion",
  "Missing prerequisite",
  "Mixed two formulas",
  "Wrong method applied",
  "Lost concentration",
] as const;