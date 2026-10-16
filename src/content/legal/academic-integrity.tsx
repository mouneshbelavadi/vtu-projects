import React from "react";
import Link from "next/link";

export const academicIntegrityLastUpdated = "14 October 2026";

export const academicIntegrityTocItems = [
  { id: "purpose-vtu-adda", label: "1. Purpose of VTU Adda Projects" },
  { id: "what-we-do-not-do", label: "2. What We Do Not Do" },
  { id: "what-we-expect-from-students", label: "3. What We Expect from Students" },
  { id: "role-of-technical-mentors", label: "4. Role of Technical Mentors" },
  { id: "enforcement-and-misuse", label: "5. Enforcement and Misuse" },
  { id: "university-affiliation-disclaimer", label: "6. University Affiliation Disclaimer" },
];

export function AcademicIntegrityContent() {
  return (
    <>
      <h1>Academic Integrity Policy</h1>
      <p className="text-xs text-ink-3">Last updated: {academicIntegrityLastUpdated}</p>

      <h2 id="purpose-vtu-adda">1. Purpose of VTU Adda Projects</h2>
      <p>
        VTU Adda Projects exists to help engineering students bridge the gap between academic theory and practical engineering implementation. We provide reference codebases, architectural documentation templates, and technical mentorship to accelerate your independent learning and software development skills.
      </p>

      <h2 id="what-we-do-not-do">2. What We Do Not Do</h2>
      <p>We uphold strict academic standards and will never engage in dishonest practices:</p>
      <ul>
        <li>We do not solve live semester examinations, online quizzes, or practical tests.</li>
        <li>We do not complete lab manual records or weekly class assignments.</li>
        <li>We do not duplicate or resell another student submission as original work.</li>
        <li>We do not provide deceptive documentation designed to misrepresent unverified technical achievements.</li>
      </ul>

      <h2 id="what-we-expect-from-students">3. What We Expect from Students</h2>
      <p>Students using our materials agree to maintain complete academic honesty:</p>
      <ul>
        <li>Use our source code and project documentation strictly as learning aids and reference architectures.</li>
        <li>Study every component, module, and data flow in your project thoroughly so that you understand the underlying engineering concepts.</li>
        <li>Write your own final report, viva presentations, and project viva explanations in your own words.</li>
        <li>Comply with all guidelines and ethical rules established by your college department and university regulations.</li>
      </ul>

      <h2 id="role-of-technical-mentors">4. Role of Technical Mentors</h2>
      <p>
        Mentoring sessions provide conceptual guidance and technical coaching:
      </p>
      <ul>
        <li>Mentors review architectures, debug runtime errors, and teach underlying programming design patterns.</li>
        <li>Mentors help you prepare for viva voce examinations by asking rigorous conceptual questions and providing constructive feedback.</li>
        <li>Mentors will never write academic submissions for you, take examinations in your place, or complete coursework on your behalf.</li>
      </ul>

      <h2 id="enforcement-and-misuse">5. Enforcement and Misuse</h2>
      <p>
        If we discover evidence of systematic misuse, including attempts to pass off our materials in a manner that breaches institutional regulations, resale of our kits, or fraudulent payment submissions, we will immediately revoke file download access and terminate the user account without refund.
      </p>

      <h2 id="university-affiliation-disclaimer">6. University Affiliation Disclaimer</h2>
      <p className="font-semibold text-ink">
        We are not affiliated with VTU or any college.
      </p>

      <div className="pt-6 border-t border-rule mt-6 flex flex-wrap gap-4 text-xs font-semibold">
        <Link href="/projects" className="text-accent hover:underline">
          Browse project kits &rarr;
        </Link>
        <Link href="/how-it-works" className="text-accent hover:underline">
          How our store works &rarr;
        </Link>
        <Link href="/contact" className="text-accent hover:underline">
          Contact support team &rarr;
        </Link>
      </div>
    </>
  );
}
