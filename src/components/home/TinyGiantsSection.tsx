import dnaHelixBg from "@/assets/dna-helix-bg.jpg";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function TinyGiantsSection() {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`relative py-24 lg:py-32 overflow-hidden transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      {/* Background */}
      <div className="absolute inset-0">
        <img src={dnaHelixBg} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-navy/80" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10 text-center">
        <p className="text-emerald-glow font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
          The Concept
        </p>
        <h2 className="font-display text-3xl lg:text-5xl font-bold text-white mb-8 max-w-3xl mx-auto leading-tight">
          Tiny Giants — Small Molecular Systems,{" "}
          <span className="text-emerald-glow">Global Impact</span>
        </h2>
        <p className="text-white/70 text-lg font-body max-w-2xl mx-auto leading-relaxed mb-12">
          At the molecular level, the smallest building blocks of life hold the power to 
          transform entire healthcare systems. CODONYX harnesses these tiny giants — codons, 
          proteins and molecular signals — to engineer solutions that scale from laboratory 
          benches to global populations.
        </p>
      </div>
    </section>
  );
}
