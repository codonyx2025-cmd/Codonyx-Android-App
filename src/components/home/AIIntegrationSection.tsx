import aiMolecularImage from "@/assets/ai-molecular.jpg";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function AIIntegrationSection() {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`py-24 lg:py-32 bg-background transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={aiMolecularImage}
                alt="Neural network visualization merging with DNA strand"
                loading="lazy"
                decoding="async"
                className="w-full h-[400px] lg:h-[480px] object-cover"
              />
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              AI + Molecular Science
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-6">
              Accelerating Discovery Through{" "}
              <span className="text-primary">Intelligent Molecular Design</span>
            </h2>
            <div className="space-y-4 text-muted-foreground font-body text-lg leading-relaxed">
              <p>
                Artificial intelligence doesn't replace the scientist — it amplifies their 
                intuition. Our AI platforms analyze billions of molecular interactions in 
                seconds, identifying patterns invisible to the human eye.
              </p>
              <p>
                From drug target identification to protein folding prediction, CODONYX 
                integrates neural architectures with molecular biology to compress decades 
                of research into actionable insights.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Drug Discovery", "Protein Engineering", "Biomarker Analysis", "Predictive Diagnostics"].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary font-body text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
