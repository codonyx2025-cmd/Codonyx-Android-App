import chromosomesImage from "@/assets/chromosomes.jpg";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function PhilosophySection() {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`relative py-24 lg:py-32 bg-navy-light overflow-hidden transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      {/* Subtle molecular bg */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-glow blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <p className="text-emerald-glow font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              Our Philosophy
            </p>
            <h2 className="font-display text-3xl lg:text-5xl font-bold text-white leading-tight mb-8">
              The Name Behind{" "}
              <span className="text-emerald-glow">CODONYX</span>
            </h2>
            <div className="space-y-5 text-white/70 font-body text-lg leading-relaxed">
              <p>
                <strong className="text-white">Codon</strong> — the elemental code of life, 
                the three-nucleotide sequence that instructs the building of every protein 
                in every living organism.
              </p>
              <p>
                <strong className="text-white">Onyx</strong> — symbolizing Earth's strength, 
                mystery and the resilient foundation upon which all biological systems depend.
              </p>
              <p>
                The embedded <strong className="text-emerald-glow">"YX"</strong> reflects sex chromosomes — 
                honoring biological diversity, balance and the fundamental blueprint 
                that differentiates and unites all life.
              </p>
            </div>
          </div>

          {/* Chromosome Visual */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={chromosomesImage}
                alt="Scientific visualization of chromosomes"
                className="w-80 h-80 lg:w-96 lg:h-96 object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 rounded-2xl border border-emerald-glow/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
