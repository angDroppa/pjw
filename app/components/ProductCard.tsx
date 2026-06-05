import "./ProductCard.css";
import { BiciclettaCatalog } from "@/lib/zodSchemas/bicicletta";

interface ProductCardProps {
  product: BiciclettaCatalog;
  onSelect: () => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const prezzoMin = Math.min(...product.specifics.map((s) => s.price));
  const taglie = product.specifics.map((s) => s.size);

  const isElettrica = product.type.toLowerCase().includes("elettric");

  return (
    <div className="product-card group cursor-pointer" onClick={onSelect}>
      <div className="card-glow" />
      <div className="card-content">

        <div>
          <div className="card-header flex justify-between items-start gap-2">
            <span className={`card-badge ${isElettrica ? "badge-electric" : "badge-standard"}`}>
              {product.type}
            </span>

            <div className="card-size-container">
              {taglie.map((taglia) => (
                <span key={taglia} className="card-size">{taglia}</span>
              ))}
            </div>
          </div>

          <h3 className="card-title">{product.type}</h3>
          <p className="text-slate-400 text-xs mt-1">
            da €{prezzoMin.toFixed(2)} / giorno
          </p>
        </div>

        <div className="card-media-wrapper">
          <span className="card-emoji">{isElettrica ? "⚡" : "🚲"}</span>
          <div className="card-decor-line" />
        </div>

        <button
          className="card-button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <span>Configura e Prenota</span>
        </button>

      </div>
    </div>
  );
}